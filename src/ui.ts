/**
 * UI Module for Typography Layout Calculator
 * Handles DOM manipulation and user interactions
 */

import { calculateGutterWidth, calculateLayout } from './calculator.js';
import { LayoutInputs, LayoutResults } from './types.js';
import { PAPER_SIZES, getPaperSize, getDefaultPaperSize, PaperSize } from './paperSizes.js';
import { updateVisualization } from './visualization.js';
import { Unit, UNITS, convertFromMM, convertToMM, formatValue } from './units.js';
import { DEFAULT_SAMPLE_TEXT } from './defaultText.js';

// Page dimensions and margins are always in mm, gutter is always in em
const PAGE_UNIT: Unit = 'mm';
const GUTTER_UNIT: Unit = 'em';

/**
 * Gets all input values from the form, converting from selected unit to mm
 * @returns LayoutInputs object with form values in millimeters
 */
/**
 * Gets column span from checkboxes
 */
function getColumnSpan(): { start: number; end: number } | null {
  const checkboxes = document.querySelectorAll('#columnSpanCheckboxes input[type="checkbox"]:checked') as NodeListOf<HTMLInputElement>;
  if (checkboxes.length === 0) return null;
  
  const checkedIndices = Array.from(checkboxes).map(cb => parseInt(cb.value, 10)).sort((a, b) => a - b);
  return {
    start: checkedIndices[0],
    end: checkedIndices[checkedIndices.length - 1]
  };
}

/**
 * Gets text columns from checkboxes
 */
function getTextColumns(): number[] {
  const checkboxes = document.querySelectorAll('#textColumnCheckboxes input[type="checkbox"]:checked') as NodeListOf<HTMLInputElement>;
  return Array.from(checkboxes).map(cb => parseInt(cb.value, 10)).sort((a, b) => a - b);
}

function getFormInputs(): LayoutInputs {
  const typeSize = parseFloat((document.getElementById('typeSize') as HTMLInputElement).value);
  const leadingInput = document.getElementById('leading') as HTMLInputElement;
  let leading = parseFloat(leadingInput?.value || '');
  // Default to 1.5x type size if not set
  if (isNaN(leading) || leading <= 0) {
    leading = typeSize * 1.5;
    if (leadingInput) {
      leadingInput.value = leading.toFixed(1);
    }
  }
  const facingPages = isFacingPages();

  // Page dimensions and margins are always in mm (no conversion needed)
  const pageWidth = parseFloat((document.getElementById('pageWidth') as HTMLInputElement).value);
  const pageHeight = parseFloat((document.getElementById('pageHeight') as HTMLInputElement).value);
  const topMargin = parseFloat((document.getElementById('topMargin') as HTMLInputElement).value);
  const bottomMargin = parseFloat((document.getElementById('bottomMargin') as HTMLInputElement).value);
  
  // Get margins based on facing pages mode
  let leftMargin: number;
  let rightMargin: number;
  
  if (facingPages) {
    // Facing pages: use inner and outer margins
    const innerMarginLeft = parseFloat((document.getElementById('innerMarginLeft') as HTMLInputElement).value);
    const innerMarginRight = parseFloat((document.getElementById('innerMarginRight') as HTMLInputElement).value);
    const outerMarginLeft = parseFloat((document.getElementById('outerMarginLeft') as HTMLInputElement).value);
    const outerMarginRight = parseFloat((document.getElementById('outerMarginRight') as HTMLInputElement).value);
    
    // For compatibility, set leftMargin = average inner, rightMargin = average outer
    leftMargin = (innerMarginLeft + innerMarginRight) / 2;
    rightMargin = (outerMarginLeft + outerMarginRight) / 2;
  } else {
    // Single page: use left and right margins
    leftMargin = parseFloat((document.getElementById('leftMargin') as HTMLInputElement).value);
    rightMargin = parseFloat((document.getElementById('rightMargin') as HTMLInputElement).value);
  }
  
  // Gutter is always in ems - convert to mm for calculations
  let gutterWidth = parseFloat((document.getElementById('gutterWidth') as HTMLInputElement).value);
  if (isNaN(gutterWidth) || gutterWidth <= 0) {
    gutterWidth = 1.0; // Default to 1em
    const gutterInput = document.getElementById('gutterWidth') as HTMLInputElement;
    if (gutterInput) {
      gutterInput.value = '1.000';
    }
  }
  
  const numCols = parseInt((document.getElementById('numCols') as HTMLInputElement).value, 10);
  const fontFamily = (document.getElementById('fontFamily') as HTMLSelectElement).value;
  const hyphenation = (document.getElementById('hyphenation') as HTMLInputElement)?.checked ?? true;
  const columnSpan = getColumnSpan();
  const textColumns = getTextColumns();
  
  const inputs: LayoutInputs = {
    pageWidth, // Already in mm
    pageHeight, // Already in mm
    leftMargin, // Already in mm
    rightMargin, // Already in mm
    topMargin, // Already in mm
    bottomMargin, // Already in mm
    typeSize, // Type size is always in points
    leading, // Leading (line height) in points
    fontFamily, // Font family name
    numCols,
    gutterWidth: convertToMM(gutterWidth, GUTTER_UNIT, typeSize), // Convert em to mm
    hyphenation, // Hyphenation enabled/disabled
  };
  
  // Add facing pages specific margins if in facing pages mode
  if (facingPages) {
    inputs.innerMarginLeft = parseFloat((document.getElementById('innerMarginLeft') as HTMLInputElement).value);
    inputs.innerMarginRight = parseFloat((document.getElementById('innerMarginRight') as HTMLInputElement).value);
    inputs.outerMarginLeft = parseFloat((document.getElementById('outerMarginLeft') as HTMLInputElement).value);
    inputs.outerMarginRight = parseFloat((document.getElementById('outerMarginRight') as HTMLInputElement).value);
  }
  
  if (columnSpan) {
    inputs.columnSpanStart = columnSpan.start;
    inputs.columnSpanEnd = columnSpan.end;
  }
  
  if (textColumns.length > 0) {
    inputs.textColumns = textColumns;
  }
  
  return inputs;
}

/**
 * Suggests and sets gutter width based on type size
 * Gutter is always in ems (1em = type size)
 */
export function suggestGutter(): void {
  const typeSize = parseFloat((document.getElementById('typeSize') as HTMLInputElement).value);
  
  const gutterInput = document.getElementById('gutterWidth') as HTMLInputElement;
  const noteSpan = document.getElementById('autoGutterNote');

  // Gutter is always 1em (always displayed in ems)
  gutterInput.value = '1.000';
  if (noteSpan) {
    // Show actual value: 1em = typeSize pt = typeSize * 0.3528 mm
    const gutterMM = typeSize * 0.3528;
    noteSpan.textContent = `1em = ${typeSize}pt (${gutterMM.toFixed(2)}mm)`;
  }
}

/**
 * Calculates words per line based on column width and type size
 * @param columnWidthMM - Column width in millimeters
 * @param typeSize - Type size in points
 * @returns Estimated words per line
 */
function calculateWordsPerLine(columnWidthMM: number, typeSize: number): number {
  // Average character width is approximately 0.5-0.6 times the type size
  // Converting type size from points to mm: typeSize * 0.3528
  const typeSizeMM = typeSize * 0.3528;
  const avgCharWidthMM = typeSizeMM * 0.55; // Average character width
  
  // Calculate characters per line
  const charsPerLine = columnWidthMM / avgCharWidthMM;
  
  // Average word length is approximately 5 characters (including space)
  const wordsPerLine = charsPerLine / 5;
  
  return Math.round(wordsPerLine);
}

/**
 * Updates column width display
 */
function updateColumnWidthDisplay(): void {
  try {
    const inputs = getFormInputs();
    const results = calculateLayout(inputs);
    
    // Column width is in mm, convert to em
    const columnWidthMM = results.columnWidth;
    const columnWidthEM = convertFromMM(columnWidthMM, GUTTER_UNIT, inputs.typeSize);
    
    const columnWidthDisplay = document.getElementById('columnWidthDisplay');
    if (columnWidthDisplay) {
      columnWidthDisplay.textContent = `Column width: ${formatValue(columnWidthEM, GUTTER_UNIT, 2)} (${formatValue(columnWidthMM, PAGE_UNIT, 2)})`;
    }
  } catch (e) {
    const columnWidthDisplay = document.getElementById('columnWidthDisplay');
    if (columnWidthDisplay) {
      columnWidthDisplay.textContent = '';
    }
  }
}

/**
 * Updates words per line indicator with Bringhurst's guidance
 */
function updateWordsPerLine(): void {
  try {
    const inputs = getFormInputs();
    const results = calculateLayout(inputs);
    // Use textBoxWidth (which accounts for column span) instead of columnWidth
    // This gives accurate words per line for the actual text box width
    const wordsPerLine = calculateWordsPerLine(results.textBoxWidth, inputs.typeSize);
    
    // Bringhurst's ideal line length: ~66 characters per line
    // Average word length is ~5 characters (including space), so ideal is ~13 words
    const BRINGHURST_IDEAL_WORDS = 13;
    const BRINGHURST_MIN_WORDS = 9; // ~45 characters (acceptable minimum)
    const BRINGHURST_MAX_WORDS = 17; // ~85 characters (acceptable maximum)
    
    const wordsPerLineElement = document.getElementById('wordsPerLine');
    const wordsPerLineContainer = wordsPerLineElement?.closest('.form-group');
    const helperTextElement = wordsPerLineContainer?.querySelector('.helper-text') as HTMLElement;
    
    if (wordsPerLineElement) {
      wordsPerLineElement.textContent = wordsPerLine.toString();
    }
    
    // Update helper text with Bringhurst's guidance
    if (helperTextElement) {
      let guidance = '';
      if (wordsPerLine >= BRINGHURST_MIN_WORDS && wordsPerLine <= BRINGHURST_MAX_WORDS) {
        guidance = `Ideal range: ${BRINGHURST_MIN_WORDS}-${BRINGHURST_MAX_WORDS} words (Bringhurst: ~66 characters)`;
      } else if (wordsPerLine < BRINGHURST_MIN_WORDS) {
        guidance = `Below ideal (${BRINGHURST_MIN_WORDS}-${BRINGHURST_MAX_WORDS} words). Bringhurst recommends ~66 characters (~${BRINGHURST_IDEAL_WORDS} words)`;
      } else {
        guidance = `Above ideal (${BRINGHURST_MIN_WORDS}-${BRINGHURST_MAX_WORDS} words). Bringhurst recommends ~66 characters (~${BRINGHURST_IDEAL_WORDS} words)`;
      }
      helperTextElement.textContent = guidance;
    }
  } catch (e) {
    const wordsPerLineElement = document.getElementById('wordsPerLine');
    if (wordsPerLineElement) {
      wordsPerLineElement.textContent = '—';
    }
  }
}


/**
 * Updates visualization when inputs change
 */
function updateVisualizationOnInputChange(): void {
  try {
    const inputs = getFormInputs();
    const results = calculateLayout(inputs);
    updateVisualization(inputs);
    updateWordsPerLine();
    updateColumnWidthDisplay();
  } catch (e) {
    // Silently fail if inputs are invalid
  }
}


/**
 * Updates column span checkboxes based on number of columns
 */
function updateColumnSpanCheckboxes(): void {
  const container = document.getElementById('columnSpanCheckboxes');
  if (!container) return;
  
  const numCols = parseInt((document.getElementById('numCols') as HTMLInputElement).value, 10) || 1;
  
  // Clear existing checkboxes
  container.innerHTML = '';
  
  // Create checkboxes for each column
  for (let i = 1; i <= numCols; i++) {
    const label = document.createElement('label');
    label.className = 'layer-checkbox';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = i.toString();
    checkbox.checked = true; // All columns selected by default
    checkbox.id = `columnSpan${i}`;
    
    checkbox.addEventListener('change', () => {
      // Ensure at least one column is selected
      const checked = document.querySelectorAll('#columnSpanCheckboxes input[type="checkbox"]:checked');
      if (checked.length === 0) {
        checkbox.checked = true;
      }
      // Update text column checkboxes to match span
      updateTextColumnCheckboxes();
      updateVisualizationOnInputChange();
    });
    
    const span = document.createElement('span');
    span.textContent = i.toString();
    
    label.appendChild(checkbox);
    label.appendChild(span);
    container.appendChild(label);
  }
  
  // Update text column checkboxes when span changes
  updateTextColumnCheckboxes();
}

/**
 * Updates text column checkboxes - shows all available columns
 */
function updateTextColumnCheckboxes(): void {
  const container = document.getElementById('textColumnCheckboxes');
  if (!container) return;
  
  const numCols = parseInt((document.getElementById('numCols') as HTMLInputElement).value, 10) || 1;
  const columnSpan = getColumnSpan();
  
  // Clear existing checkboxes
  container.innerHTML = '';
  
  // Show checkboxes for ALL available columns, not just within span
  // This allows selecting any column as starting column regardless of span
  for (let i = 1; i <= numCols; i++) {
    const label = document.createElement('label');
    label.className = 'layer-checkbox';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = i.toString();
    
    // Default: select columns within span if span exists, otherwise select first column
    if (columnSpan) {
      checkbox.checked = i >= columnSpan.start && i <= columnSpan.end;
    } else {
      checkbox.checked = i === 1; // Default to first column if no span
    }
    
    checkbox.id = `textColumn${i}`;
    
    checkbox.addEventListener('change', () => {
      // Ensure at least one column is selected
      const checked = document.querySelectorAll('#textColumnCheckboxes input[type="checkbox"]:checked');
      if (checked.length === 0) {
        checkbox.checked = true;
      }
      updateVisualizationOnInputChange();
    });
    
    const span = document.createElement('span');
    span.textContent = i.toString();
    
    label.appendChild(checkbox);
    label.appendChild(span);
    container.appendChild(label);
  }
}

/**
 * Populates the paper size dropdown
 */
function populatePaperSizeDropdown(): void {
  const select = document.getElementById('paperSizeSelect') as HTMLSelectElement;
  if (!select) {
    console.error('Paper size select element not found');
    return;
  }

  // Clear all existing options
  select.innerHTML = '';
  
  // Add Custom option first
  const customOpt = document.createElement('option');
  customOpt.value = '';
  customOpt.textContent = 'Custom';
  select.appendChild(customOpt);

  // Check if PAPER_SIZES is available
  if (!PAPER_SIZES || PAPER_SIZES.length === 0) {
    console.error('PAPER_SIZES array is empty or not available');
    return;
  }

  // Group paper sizes by category
  const categories = new Map<string, PaperSize[]>();
  PAPER_SIZES.forEach(size => {
    if (!categories.has(size.category)) {
      categories.set(size.category, []);
    }
    categories.get(size.category)!.push(size);
  });

  // Add optgroups for each category
  categories.forEach((sizes, category) => {
    const optgroup = document.createElement('optgroup');
    optgroup.label = category;
    sizes.forEach(size => {
      const option = document.createElement('option');
      option.value = size.name;
      option.textContent = `${size.name} (${size.width} × ${size.height} mm)`;
      optgroup.appendChild(option);
    });
    select.appendChild(optgroup);
  });

  // Set default to A4
  const defaultSize = getDefaultPaperSize();
  if (defaultSize) {
    select.value = defaultSize.name;
    applyPaperSize(defaultSize.name);
  }
}

/**
 * Gets current orientation
 */
function getOrientation(): 'portrait' | 'landscape' {
  const portraitRadio = document.getElementById('orientationPortrait') as HTMLInputElement;
  return portraitRadio?.checked ? 'portrait' : 'landscape';
}

/**
 * Applies a paper size to the width and height inputs
 * @param paperSizeName - Name of the paper size to apply
 */
function applyPaperSize(paperSizeName: string): void {
  const size = getPaperSize(paperSizeName);
  if (!size) return;

  const orientation = getOrientation();
  
  // Page dimensions are always in mm (no conversion needed)
  let width = size.width;
  let height = size.height;

  // Swap if landscape orientation
  if (orientation === 'landscape') {
    [width, height] = [height, width];
  }

  const widthInput = document.getElementById('pageWidth') as HTMLInputElement;
  const heightInput = document.getElementById('pageHeight') as HTMLInputElement;

  // Page dimensions are always in mm (1 decimal place)
  if (widthInput) widthInput.value = width.toFixed(1);
  if (heightInput) heightInput.value = height.toFixed(1);
  
  updateVisualizationOnInputChange();
}

/**
 * Swaps page width and height based on orientation
 */
function updateOrientation(): void {
  const pageWidthInput = document.getElementById('pageWidth') as HTMLInputElement;
  const pageHeightInput = document.getElementById('pageHeight') as HTMLInputElement;
  
  const currentWidth = parseFloat(pageWidthInput.value);
  const currentHeight = parseFloat(pageHeightInput.value);
  
  // Swap width and height
  pageWidthInput.value = currentHeight.toString();
  pageHeightInput.value = currentWidth.toString();
  
  updateVisualizationOnInputChange();
}

/**
 * Checks if facing pages mode is enabled
 */
function isFacingPages(): boolean {
  const checkbox = document.getElementById('facingPages') as HTMLInputElement;
  return checkbox?.checked || false;
}

/**
 * Updates margin inputs visibility and syncs values when switching modes
 */
function updateMarginInputs(): void {
  const facingPages = isFacingPages();
  const singlePageMargins = document.getElementById('singlePageMargins') as HTMLElement;
  const facingPagesMargins = document.getElementById('facingPagesMargins') as HTMLElement;
  const facingPagesMarginsOuter = document.getElementById('facingPagesMarginsOuter') as HTMLElement;
  
  const leftMarginInput = document.getElementById('leftMargin') as HTMLInputElement;
  const rightMarginInput = document.getElementById('rightMargin') as HTMLInputElement;
  const innerMarginLeftInput = document.getElementById('innerMarginLeft') as HTMLInputElement;
  const innerMarginRightInput = document.getElementById('innerMarginRight') as HTMLInputElement;
  const outerMarginLeftInput = document.getElementById('outerMarginLeft') as HTMLInputElement;
  const outerMarginRightInput = document.getElementById('outerMarginRight') as HTMLInputElement;
  
  if (facingPages) {
    // Show facing pages inputs, hide single page inputs
    if (singlePageMargins) singlePageMargins.style.display = 'none';
    if (facingPagesMargins) facingPagesMargins.style.display = 'grid';
    if (facingPagesMarginsOuter) facingPagesMarginsOuter.style.display = 'grid';
    
    // Sync values: mirror leftMargin/rightMargin to inner/outer (only if not already synced)
    if (leftMarginInput && innerMarginLeftInput && !innerMarginLeftInput.dataset.synced) {
      innerMarginLeftInput.value = leftMarginInput.value;
      innerMarginRightInput.value = leftMarginInput.value;
      outerMarginLeftInput.value = rightMarginInput.value;
      outerMarginRightInput.value = rightMarginInput.value;
      innerMarginLeftInput.dataset.synced = 'true';
      // Clear the other sync flag
      if (leftMarginInput.dataset.synced) leftMarginInput.dataset.synced = '';
    }
  } else {
    // Show single page inputs, hide facing pages inputs
    if (singlePageMargins) singlePageMargins.style.display = 'grid';
    if (facingPagesMargins) facingPagesMargins.style.display = 'none';
    if (facingPagesMarginsOuter) facingPagesMarginsOuter.style.display = 'none';
    
    // Sync values: average inner to leftMargin, average outer to rightMargin (only if not already synced)
    if (innerMarginLeftInput && leftMarginInput && !leftMarginInput.dataset.synced) {
      const avgInner = ((parseFloat(innerMarginLeftInput.value) + parseFloat(innerMarginRightInput.value)) / 2).toFixed(1);
      leftMarginInput.value = avgInner;
      const avgOuter = ((parseFloat(outerMarginLeftInput.value) + parseFloat(outerMarginRightInput.value)) / 2).toFixed(1);
      rightMarginInput.value = avgOuter;
      leftMarginInput.dataset.synced = 'true';
      // Clear the other sync flag
      if (innerMarginLeftInput.dataset.synced) innerMarginLeftInput.dataset.synced = '';
    }
  }
}



/**
 * Initializes the calculator UI
 */
/**
 * Exports the current visualization as a standalone HTML file
 */
function exportVisualizationAsHTML(): void {
  const container = document.getElementById('visualizationContainer');
  if (!container) {
    alert('Visualization container not found');
    return;
  }

  const svg = container.querySelector('svg');
  if (!svg) {
    alert('No visualization to export. Please generate a layout first.');
    return;
  }

  // Get current inputs for metadata
  const inputs = getFormInputs();
  
  // Clone the SVG to avoid modifying the original
  const svgClone = svg.cloneNode(true) as SVGElement;
  
  // Create standalone HTML
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Typography Layout Preview</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 2rem;
      background-color: #f8fafc;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .preview-container {
      background: white;
      padding: 2rem;
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      max-width: 100%;
    }
    .preview-header {
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .preview-header h1 {
      font-size: 1.5rem;
      color: #1e293b;
      margin-bottom: 0.5rem;
    }
    .preview-meta {
      font-size: 0.875rem;
      color: #64748b;
      line-height: 1.6;
    }
    .preview-meta strong {
      color: #1e293b;
    }
    svg {
      display: block;
      max-width: 100%;
      height: auto;
    }
  </style>
</head>
<body>
  <div class="preview-container">
    <div class="preview-header">
      <h1>Typography Layout Preview</h1>
      <div class="preview-meta">
        <p><strong>Page Size:</strong> ${inputs.pageWidth.toFixed(2)} × ${inputs.pageHeight.toFixed(2)} mm</p>
        <p><strong>Type Size:</strong> ${inputs.typeSize} pt</p>
        <p><strong>Columns:</strong> ${inputs.numCols}</p>
        <p><strong>Gutter Width:</strong> ${formatValue(convertFromMM(inputs.gutterWidth, GUTTER_UNIT, inputs.typeSize), GUTTER_UNIT, 3)}</p>
        <p><strong>Margins:</strong> Top: ${formatValue(inputs.topMargin, PAGE_UNIT, inputs.typeSize)} ${PAGE_UNIT}, Bottom: ${formatValue(inputs.bottomMargin, PAGE_UNIT, inputs.typeSize)} ${PAGE_UNIT}, Left: ${formatValue(inputs.leftMargin, PAGE_UNIT, inputs.typeSize)} ${PAGE_UNIT}, Right: ${formatValue(inputs.rightMargin, PAGE_UNIT, inputs.typeSize)} ${PAGE_UNIT}</p>
        ${inputs.columnSpanStart && inputs.columnSpanEnd ? `<p><strong>Column Span:</strong> Columns ${inputs.columnSpanStart} to ${inputs.columnSpanEnd}</p>` : ''}
        ${inputs.textColumns && inputs.textColumns.length > 0 ? `<p><strong>Text Columns:</strong> ${inputs.textColumns.join(', ')}</p>` : ''}
      </div>
    </div>
    ${svgClone.outerHTML}
  </div>
</body>
</html>`;

  // Create blob and download
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `typography-layout-preview-${Date.now()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function initializeCalculator(): void {
  // Initialize margin inputs visibility
  updateMarginInputs();

  // Handle facing pages checkbox
  const facingPagesCheckbox = document.getElementById('facingPages') as HTMLInputElement;
  if (facingPagesCheckbox) {
    facingPagesCheckbox.addEventListener('change', () => {
      // Clear sync flags when switching modes
      const innerMarginLeftInput = document.getElementById('innerMarginLeft') as HTMLInputElement;
      const leftMarginInput = document.getElementById('leftMargin') as HTMLInputElement;
      if (innerMarginLeftInput) innerMarginLeftInput.dataset.synced = '';
      if (leftMarginInput) leftMarginInput.dataset.synced = '';
      
      updateMarginInputs();
      updateVisualizationOnInputChange();
    });
  }
  
  // Add event listeners for facing pages margin inputs
  const facingPagesMarginInputs = ['innerMarginLeft', 'innerMarginRight', 'outerMarginLeft', 'outerMarginRight'];
  facingPagesMarginInputs.forEach(id => {
    const input = document.getElementById(id) as HTMLInputElement;
    if (input) {
      input.addEventListener('input', updateVisualizationOnInputChange);
      input.addEventListener('change', updateVisualizationOnInputChange);
    }
  });

  // Handle sample text input - update visualization when text changes
  const sampleTextInput = document.getElementById('sampleText') as HTMLTextAreaElement;
  if (sampleTextInput) {
    sampleTextInput.addEventListener('input', updateVisualizationOnInputChange);
    sampleTextInput.addEventListener('change', updateVisualizationOnInputChange);
  }

  // Handle layer visibility checkboxes
  const layerCheckboxes = ['showMargins', 'showColumns', 'showText'];
  layerCheckboxes.forEach(id => {
    const checkbox = document.getElementById(id) as HTMLInputElement;
    if (checkbox) {
      checkbox.addEventListener('change', updateVisualizationOnInputChange);
    }
  });

  // Load default text on page open
  if (sampleTextInput) {
    sampleTextInput.value = DEFAULT_SAMPLE_TEXT;
    // Trigger initial visualization update with default text
    updateVisualizationOnInputChange();
  }

  // Handle load default text button
  const loadDefaultTextButton = document.getElementById('loadDefaultTextButton');
  if (loadDefaultTextButton && sampleTextInput) {
    loadDefaultTextButton.addEventListener('click', () => {
      sampleTextInput.value = DEFAULT_SAMPLE_TEXT;
      updateVisualizationOnInputChange();
    });
  }

  // Handle clear text button
  const clearTextButton = document.getElementById('clearTextButton');
  if (clearTextButton && sampleTextInput) {
    clearTextButton.addEventListener('click', () => {
      sampleTextInput.value = '';
      updateVisualizationOnInputChange();
    });
  }

  // Populate column span checkboxes
  updateColumnSpanCheckboxes();
  
  // Handle number of columns change
  const numColsInput = document.getElementById('numCols') as HTMLInputElement;
  if (numColsInput) {
    numColsInput.addEventListener('change', () => {
      updateColumnSpanCheckboxes();
      updateVisualizationOnInputChange();
    });
  }

  // Populate paper size dropdown
  populatePaperSizeDropdown();

  // Set gutter on load
  suggestGutter();

  // Attach event listeners
  const suggestGutterButton = document.getElementById('suggestGutterButton');
  if (suggestGutterButton) {
    suggestGutterButton.addEventListener('click', suggestGutter);
  }

  // Recalculate gutter and words per line when type size changes
  const typeSizeInput = document.getElementById('typeSize') as HTMLInputElement;
  if (typeSizeInput) {
    typeSizeInput.addEventListener('input', () => {
      suggestGutter();
      // Auto-update leading to 1.5x type size if leading is empty
      const leadingInput = document.getElementById('leading') as HTMLInputElement;
      if (leadingInput && (!leadingInput.value || leadingInput.value === '')) {
        const newTypeSize = parseFloat(typeSizeInput.value);
        leadingInput.value = (newTypeSize * 1.5).toFixed(1);
      }
      updateVisualizationOnInputChange();
    });
  }

  // Handle leading input
  const leadingInput = document.getElementById('leading') as HTMLInputElement;
  if (leadingInput) {
    leadingInput.addEventListener('input', updateVisualizationOnInputChange);
    leadingInput.addEventListener('change', updateVisualizationOnInputChange);
  }

  // Export as HTML button
  const exportHtmlButton = document.getElementById('exportHtmlButton');
  if (exportHtmlButton) {
    exportHtmlButton.addEventListener('click', exportVisualizationAsHTML);
  }

  // Handle paper size selection
  const paperSizeSelect = document.getElementById('paperSizeSelect') as HTMLSelectElement;
  if (paperSizeSelect) {
    paperSizeSelect.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      if (target.value) {
        applyPaperSize(target.value);
      } else {
        updateVisualizationOnInputChange();
      }
    });
  }

  // Handle orientation change
  const orientationRadios = document.querySelectorAll('input[name="orientation"]') as NodeListOf<HTMLInputElement>;
  orientationRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      // If a paper size is selected, reapply it with new orientation
      if (paperSizeSelect && paperSizeSelect.value) {
        applyPaperSize(paperSizeSelect.value);
      } else {
        // Otherwise, swap current width and height
        updateOrientation();
      }
    });
  });

  // Update visualization when inputs change
  const inputIds = ['pageWidth', 'pageHeight', 'leftMargin', 'rightMargin', 'topMargin', 'bottomMargin', 'numCols', 'gutterWidth'];
  inputIds.forEach(id => {
    const input = document.getElementById(id) as HTMLInputElement;
    if (input) {
      input.addEventListener('input', updateVisualizationOnInputChange);
      input.addEventListener('change', updateVisualizationOnInputChange);
    }
  });
  
  // Handle font family change
  const fontFamilySelect = document.getElementById('fontFamily') as HTMLSelectElement;
  if (fontFamilySelect) {
    fontFamilySelect.addEventListener('change', updateVisualizationOnInputChange);
  }

  // Handle hyphenation checkbox
  const hyphenationCheckbox = document.getElementById('hyphenation') as HTMLInputElement;
  if (hyphenationCheckbox) {
    hyphenationCheckbox.addEventListener('change', updateVisualizationOnInputChange);
  }

  // Initial visualization and words per line
  updateVisualizationOnInputChange();
  updateWordsPerLine();

  // Add resize observer to update scale indicator when window/container resizes
  const visualizationContainer = document.getElementById('visualizationContainer');
  let resizeTimeout: number | undefined;
  
  if (visualizationContainer && window.ResizeObserver) {
    const resizeObserver = new ResizeObserver(() => {
      // Debounce resize updates
      if (resizeTimeout !== undefined) {
        clearTimeout(resizeTimeout);
      }
      resizeTimeout = window.setTimeout(() => {
        updateVisualizationOnInputChange();
      }, 100);
    });
    resizeObserver.observe(visualizationContainer);
  } else {
    // Fallback to window resize listener if ResizeObserver not available
    window.addEventListener('resize', () => {
      if (resizeTimeout !== undefined) {
        clearTimeout(resizeTimeout);
      }
      resizeTimeout = window.setTimeout(() => {
        updateVisualizationOnInputChange();
      }, 100);
    });
  }
}

