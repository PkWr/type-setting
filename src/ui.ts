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

// Current unit preference (stored in mm internally, displayed in selected unit)
let currentUnit: Unit = 'mm';

/**
 * Gets the currently selected unit
 */
function getCurrentUnit(): Unit {
  const unitSelect = document.getElementById('unitSelect') as HTMLSelectElement;
  return (unitSelect?.value as Unit) || 'mm';
}

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
  const unit = getCurrentUnit();
  const typeSize = parseFloat((document.getElementById('typeSize') as HTMLInputElement).value);

  // Get values in selected unit and convert to mm
  const pageWidth = parseFloat((document.getElementById('pageWidth') as HTMLInputElement).value);
  const pageHeight = parseFloat((document.getElementById('pageHeight') as HTMLInputElement).value);
  const leftMargin = parseFloat((document.getElementById('leftMargin') as HTMLInputElement).value);
  const rightMargin = parseFloat((document.getElementById('rightMargin') as HTMLInputElement).value);
  const topMargin = parseFloat((document.getElementById('topMargin') as HTMLInputElement).value);
  const bottomMargin = parseFloat((document.getElementById('bottomMargin') as HTMLInputElement).value);
  let gutterWidth = parseFloat((document.getElementById('gutterWidth') as HTMLInputElement).value);
  
  // If gutter width is not set, auto-suggest it
  if (isNaN(gutterWidth) || gutterWidth <= 0) {
    const autoGutter = calculateGutterWidth(typeSize);
    const unit = getCurrentUnit();
    gutterWidth = convertFromMM(autoGutter, unit, typeSize);
    // Set the input value
    const gutterInput = document.getElementById('gutterWidth') as HTMLInputElement;
    if (gutterInput) {
      gutterInput.value = gutterWidth.toFixed(unit === 'em' ? 3 : 2);
    }
  }
  
  const numCols = parseInt((document.getElementById('numCols') as HTMLInputElement).value, 10);
  const columnSpan = getColumnSpan();
  const textColumns = getTextColumns();
  
  const inputs: LayoutInputs = {
    pageWidth: convertToMM(pageWidth, unit, typeSize),
    pageHeight: convertToMM(pageHeight, unit, typeSize),
    leftMargin: convertToMM(leftMargin, unit, typeSize),
    rightMargin: convertToMM(rightMargin, unit, typeSize),
    topMargin: convertToMM(topMargin, unit, typeSize),
    bottomMargin: convertToMM(bottomMargin, unit, typeSize),
    typeSize, // Type size is always in points
    numCols,
    gutterWidth: convertToMM(gutterWidth, unit, typeSize),
  };
  
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
 */
export function suggestGutter(): void {
  const typeSize = parseFloat((document.getElementById('typeSize') as HTMLInputElement).value);
  const autoGutterMM = calculateGutterWidth(typeSize);
  const unit = getCurrentUnit();
  const autoGutter = convertFromMM(autoGutterMM, unit, typeSize);
  
  const gutterInput = document.getElementById('gutterWidth') as HTMLInputElement;
  const noteSpan = document.getElementById('autoGutterNote');

  gutterInput.value = autoGutter.toFixed(unit === 'em' ? 3 : 2);
  if (noteSpan) {
    noteSpan.textContent = '1em (based on type size)';
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
 * Updates words per line indicator
 */
function updateWordsPerLine(): void {
  try {
    const inputs = getFormInputs();
    const results = calculateLayout(inputs);
    // Use textBoxWidth (which accounts for column span) instead of columnWidth
    // This gives accurate words per line for the actual text box width
    const wordsPerLine = calculateWordsPerLine(results.textBoxWidth, inputs.typeSize);
    
    const wordsPerLineElement = document.getElementById('wordsPerLine');
    if (wordsPerLineElement) {
      wordsPerLineElement.textContent = wordsPerLine.toString();
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
    displayResults(results);
    updateVisualization(inputs);
    updateWordsPerLine();
  } catch (e) {
    // Silently fail if inputs are invalid
  }
}

/**
 * Displays calculation results in the results div
 * @param results - Layout calculation results (in millimeters)
 */
function displayResults(results: LayoutResults): void {
  const resultsDiv = document.getElementById('resultsContent');
  if (!resultsDiv) return;

  const unit = getCurrentUnit();
  const typeSize = parseFloat((document.getElementById('typeSize') as HTMLInputElement).value);

  // Convert results from mm to selected unit
  const textBoxWidth = convertFromMM(results.textBoxWidth, unit, typeSize);
  const columnWidth = convertFromMM(results.columnWidth, unit, typeSize);
  const gutterWidth = convertFromMM(results.gutterWidth, unit, typeSize);
  const optimalColumnWidth = convertFromMM(results.optimalColumnWidth, unit, typeSize);

  const decimals = unit === 'em' ? 3 : unit === 'mm' ? 1 : 2;
  const gutterDecimals = unit === 'em' ? 3 : 2;

  const res = `
    <ul>
      <li><b>Text box width:</b> ${formatValue(textBoxWidth, unit, decimals)}</li>
      <li><b>Column width:</b> ${formatValue(columnWidth, unit, decimals)} each</li>
      <li><b>Gutter width:</b> ${formatValue(gutterWidth, unit, gutterDecimals)}</li>
      <li><b>Optimal column width (Bringhurst):</b> ${formatValue(optimalColumnWidth, unit, decimals)}</li>
    </ul>
    <p>Tip: Auto-set the gutter to font size (1em) for optimal spacing, or adjust manually.</p>
  `;
  resultsDiv.innerHTML = res;
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
 * Updates text column checkboxes based on column span
 */
function updateTextColumnCheckboxes(): void {
  const container = document.getElementById('textColumnCheckboxes');
  if (!container) return;
  
  const numCols = parseInt((document.getElementById('numCols') as HTMLInputElement).value, 10) || 1;
  const columnSpan = getColumnSpan();
  
  // Clear existing checkboxes
  container.innerHTML = '';
  
  if (!columnSpan) {
    return;
  }
  
  // Only show checkboxes for columns within the span
  for (let i = columnSpan.start; i <= columnSpan.end; i++) {
    const label = document.createElement('label');
    label.className = 'layer-checkbox';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = i.toString();
    checkbox.checked = true; // All columns in span selected by default
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

  const unit = getCurrentUnit();
  const typeSize = parseFloat((document.getElementById('typeSize') as HTMLInputElement).value);
  const orientation = getOrientation();
  
  // Convert from mm to selected unit
  let width = convertFromMM(size.width, unit, typeSize);
  let height = convertFromMM(size.height, unit, typeSize);

  // Swap if landscape orientation
  if (orientation === 'landscape') {
    [width, height] = [height, width];
  }

  const widthInput = document.getElementById('pageWidth') as HTMLInputElement;
  const heightInput = document.getElementById('pageHeight') as HTMLInputElement;

  const decimals = unit === 'em' ? 3 : 2;
  if (widthInput) widthInput.value = width.toFixed(decimals);
  if (heightInput) heightInput.value = height.toFixed(decimals);
  
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
 * Updates all input labels to show the current unit and facing pages mode
 */
function updateInputLabels(): void {
  const unit = getCurrentUnit();
  const unitAbbr = UNITS[unit].abbreviation;
  const facingPages = isFacingPages();

  const labels: Record<string, string> = {
    pageWidth: `Page width (${unitAbbr})`,
    pageHeight: `Page height (${unitAbbr})`,
    leftMargin: facingPages ? `Inner (${unitAbbr})` : `Left (${unitAbbr})`,
    rightMargin: facingPages ? `Outer (${unitAbbr})` : `Right (${unitAbbr})`,
    topMargin: `Top (${unitAbbr})`,
    bottomMargin: `Bottom (${unitAbbr})`,
    gutterWidth: `Gutter width (${unitAbbr})`,
  };

  Object.entries(labels).forEach(([id, text]) => {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label) {
      label.textContent = text;
    }
  });
}

/**
 * Updates unit description helper text
 */
function updateUnitDescription(): void {
  const unit = getCurrentUnit();
  const description = UNITS[unit].description;
  const descSpan = document.getElementById('unitDescription');
  if (descSpan) {
    descSpan.textContent = description;
  }
}

/**
 * Converts all input values when unit changes
 */
function convertInputsToNewUnit(oldUnit: Unit, newUnit: Unit): void {
  const typeSize = parseFloat((document.getElementById('typeSize') as HTMLInputElement).value);
  
  const inputIds = ['pageWidth', 'pageHeight', 'leftMargin', 'rightMargin', 'topMargin', 'bottomMargin', 'gutterWidth'];
  
  inputIds.forEach(id => {
    const input = document.getElementById(id) as HTMLInputElement;
    if (input && input.value) {
      const value = parseFloat(input.value);
      // Convert: old unit -> mm -> new unit
      const valueMM = convertToMM(value, oldUnit, typeSize);
      const newValue = convertFromMM(valueMM, newUnit, typeSize);
      const decimals = newUnit === 'em' ? 3 : 2;
      input.value = newValue.toFixed(decimals);
    }
  });
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
  const unit = getCurrentUnit();
  
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
        <p><strong>Gutter Width:</strong> ${formatValue(inputs.gutterWidth, unit, inputs.typeSize)} ${unit}</p>
        <p><strong>Margins:</strong> Top: ${formatValue(inputs.topMargin, unit, inputs.typeSize)} ${unit}, Bottom: ${formatValue(inputs.bottomMargin, unit, inputs.typeSize)} ${unit}, Left: ${formatValue(inputs.leftMargin, unit, inputs.typeSize)} ${unit}, Right: ${formatValue(inputs.rightMargin, unit, inputs.typeSize)} ${unit}</p>
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
  // Initialize unit system
  currentUnit = getCurrentUnit();
  updateInputLabels();
  updateUnitDescription();

  // Handle unit selection change
  const unitSelect = document.getElementById('unitSelect') as HTMLSelectElement;
  if (unitSelect) {
    unitSelect.addEventListener('change', () => {
      const newUnit = getCurrentUnit();
      convertInputsToNewUnit(currentUnit, newUnit);
      currentUnit = newUnit;
      updateInputLabels();
      updateUnitDescription();
      suggestGutter(); // Recalculate gutter in new unit
      updateVisualizationOnInputChange();
    });
  }

  // Handle facing pages checkbox
  const facingPagesCheckbox = document.getElementById('facingPages') as HTMLInputElement;
  if (facingPagesCheckbox) {
    facingPagesCheckbox.addEventListener('change', () => {
      updateInputLabels();
      updateVisualizationOnInputChange();
    });
  }

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
      updateVisualizationOnInputChange();
    });
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

  // Initial visualization and words per line
  updateVisualizationOnInputChange();
  updateWordsPerLine();
}

