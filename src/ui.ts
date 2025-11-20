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

// Page dimensions are always in mm, gutter is always in em
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
  const slider = document.getElementById('columnSpanSlider') as HTMLInputElement;
  if (!slider) return null;
  
  const spanCount = parseInt(slider.value, 10);
  if (isNaN(spanCount) || spanCount < 1) return null;
  
  return {
    start: 1,
    end: spanCount
  };
}

/**
 * Gets text columns from slider - returns array starting from slider value through span
 */
function getTextColumns(): number[] {
  const textStartSlider = document.getElementById('textStartSlider') as HTMLInputElement;
  if (!textStartSlider) return [1];
  
  const textStart = parseInt(textStartSlider.value, 10) || 1;
  const columnSpan = getColumnSpan();
  
  if (columnSpan) {
    // Return columns from textStart through the span end
    const start = Math.max(textStart, columnSpan.start);
    const end = columnSpan.end;
    const columns: number[] = [];
    for (let i = start; i <= end; i++) {
      columns.push(i);
    }
    return columns.length > 0 ? columns : [textStart];
  }
  
  return [textStart];
}

function getFormInputs(): LayoutInputs {
  const typeSize = parseFloat((document.getElementById('typeSize') as HTMLInputElement).value);
  const leadingInput = document.getElementById('leading') as HTMLInputElement;
  let leading = parseFloat(leadingInput?.value || '');
  // Default to type size + 2 if not set
  if (isNaN(leading) || leading <= 0) {
    leading = typeSize + 2;
    if (leadingInput) {
      leadingInput.value = leading.toFixed(1);
    }
  }
  const facingPages = isFacingPages();

  // Get margin unit
  const marginUnitToggle = document.getElementById('marginUnitToggle') as HTMLInputElement;
  const marginUnit: Unit = (marginUnitToggle?.checked ? 'em' : 'mm');

  // Page dimensions are always in mm (no conversion needed)
  const pageWidth = parseFloat((document.getElementById('pageWidth') as HTMLInputElement).value);
  const pageHeight = parseFloat((document.getElementById('pageHeight') as HTMLInputElement).value);
  
  // Get margins and convert to mm if needed
  let topMargin = parseFloat((document.getElementById('topMargin') as HTMLInputElement).value);
  let bottomMargin = parseFloat((document.getElementById('bottomMargin') as HTMLInputElement).value);
  
  // Convert margins to mm if they're in em
  if (marginUnit === 'em') {
    topMargin = convertToMM(topMargin, 'em', typeSize);
    bottomMargin = convertToMM(bottomMargin, 'em', typeSize);
  }
  
  // Get margins based on facing pages mode
  let leftMargin: number;
  let rightMargin: number;
  
  if (facingPages) {
    // Facing pages: use inner and outer margins
    let innerMarginLeft = parseFloat((document.getElementById('innerMarginLeft') as HTMLInputElement).value);
    let innerMarginRight = parseFloat((document.getElementById('innerMarginRight') as HTMLInputElement).value);
    let outerMarginLeft = parseFloat((document.getElementById('outerMarginLeft') as HTMLInputElement).value);
    let outerMarginRight = parseFloat((document.getElementById('outerMarginRight') as HTMLInputElement).value);
    
    // Convert to mm if needed
    if (marginUnit === 'em') {
      innerMarginLeft = convertToMM(innerMarginLeft, 'em', typeSize);
      innerMarginRight = convertToMM(innerMarginRight, 'em', typeSize);
      outerMarginLeft = convertToMM(outerMarginLeft, 'em', typeSize);
      outerMarginRight = convertToMM(outerMarginRight, 'em', typeSize);
    }
    
    // For compatibility, set leftMargin = average inner, rightMargin = average outer
    leftMargin = (innerMarginLeft + innerMarginRight) / 2;
    rightMargin = (outerMarginLeft + outerMarginRight) / 2;
  } else {
    // Single page: use left and right margins
    leftMargin = parseFloat((document.getElementById('leftMargin') as HTMLInputElement).value);
    rightMargin = parseFloat((document.getElementById('rightMargin') as HTMLInputElement).value);
    
    // Convert to mm if needed
    if (marginUnit === 'em') {
      leftMargin = convertToMM(leftMargin, 'em', typeSize);
      rightMargin = convertToMM(rightMargin, 'em', typeSize);
    }
  }
  
  // Get gutter width - convert based on selected unit
  let gutterWidth = parseFloat((document.getElementById('gutterWidth') as HTMLInputElement).value);
  if (isNaN(gutterWidth) || gutterWidth <= 0) {
    // Default based on unit: 1em or equivalent in mm
    if (marginUnit === 'em') {
      gutterWidth = 1.0; // Default to 1em
    } else {
      gutterWidth = convertFromMM(convertToMM(1.0, 'em', typeSize), 'mm', typeSize); // 1em in mm
    }
    const gutterInput = document.getElementById('gutterWidth') as HTMLInputElement;
    if (gutterInput) {
      gutterInput.value = marginUnit === 'em' ? '1.000' : gutterWidth.toFixed(3);
    }
  }
  
  // Convert gutter width to mm for calculations
  let gutterWidthMM: number;
  if (marginUnit === 'em') {
    gutterWidthMM = convertToMM(gutterWidth, 'em', typeSize);
  } else {
    gutterWidthMM = gutterWidth; // Already in mm
  }
  
  const numCols = parseInt((document.getElementById('numCols') as HTMLInputElement).value, 10);
  const fontFamily = (document.getElementById('fontFamily') as HTMLSelectElement).value;
  const hyphenation = (document.getElementById('hyphenation') as HTMLInputElement)?.checked ?? false;
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
    gutterWidth: gutterWidthMM, // Already converted to mm
    hyphenation, // Hyphenation enabled/disabled
  };
  
  // Add facing pages specific margins if in facing pages mode (already converted to mm above)
  if (facingPages) {
    let innerMarginLeft = parseFloat((document.getElementById('innerMarginLeft') as HTMLInputElement).value);
    let innerMarginRight = parseFloat((document.getElementById('innerMarginRight') as HTMLInputElement).value);
    let outerMarginLeft = parseFloat((document.getElementById('outerMarginLeft') as HTMLInputElement).value);
    let outerMarginRight = parseFloat((document.getElementById('outerMarginRight') as HTMLInputElement).value);
    
    // Convert to mm if needed
    if (marginUnit === 'em') {
      innerMarginLeft = convertToMM(innerMarginLeft, 'em', typeSize);
      innerMarginRight = convertToMM(innerMarginRight, 'em', typeSize);
      outerMarginLeft = convertToMM(outerMarginLeft, 'em', typeSize);
      outerMarginRight = convertToMM(outerMarginRight, 'em', typeSize);
    }
    
    inputs.innerMarginLeft = innerMarginLeft;
    inputs.innerMarginRight = innerMarginRight;
    inputs.outerMarginLeft = outerMarginLeft;
    inputs.outerMarginRight = outerMarginRight;
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
  const marginUnitToggle = document.getElementById('marginUnitToggle') as HTMLInputElement;
  const marginUnit: Unit = (marginUnitToggle?.checked ? 'em' : 'mm');
  
  const gutterInput = document.getElementById('gutterWidth') as HTMLInputElement;
  const noteSpan = document.getElementById('autoGutterNote');

  // Set gutter based on selected unit
  if (marginUnit === 'em') {
    gutterInput.value = '1.000';
  } else {
    // Convert 1em to mm
    const gutterMM = convertToMM(1.0, 'em', typeSize);
    gutterInput.value = gutterMM.toFixed(3);
  }
  
  if (noteSpan) {
    // Show actual value: 1em = typeSize pt = typeSize * 0.3528 mm
    const gutterMM = typeSize * 0.3528;
    if (marginUnit === 'em') {
      noteSpan.textContent = `1em = ${typeSize}pt (${gutterMM.toFixed(2)}mm)`;
    } else {
      const gutterEm = convertFromMM(gutterMM, 'em', typeSize);
      noteSpan.textContent = `${gutterMM.toFixed(2)}mm = ${gutterEm.toFixed(2)}em (${typeSize}pt)`;
    }
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
/**
 * Updates the specification section with all current values
 */
function updateSpecification(): void {
  try {
    const inputs = getFormInputs();
    const results = calculateLayout(inputs);
    const facingPages = isFacingPages();
    const orientationToggle = (document.getElementById('orientationToggle') as HTMLInputElement)?.checked ?? false;
    const orientation = orientationToggle ? 'Landscape' : 'Portrait';
    
    const specContent = document.getElementById('specificationContent');
    if (!specContent) return;
    
    // Get column span info
    const columnSpan = getColumnSpan();
    const textColumns = getTextColumns();
    
    // Get paper size name if preset is selected
    const paperSizeSelect = document.getElementById('paperSizeSelect') as HTMLSelectElement;
    const selectedPaperSize = paperSizeSelect?.value || '';
    let pageSizeLabel = 'Custom';
    if (selectedPaperSize) {
      const paperSize = getPaperSize(selectedPaperSize);
      if (paperSize) {
        pageSizeLabel = paperSize.name;
      }
    }
    
    // Get margin unit for display
    const marginUnitToggle = document.getElementById('marginUnitToggle') as HTMLInputElement;
    const marginUnit: Unit = (marginUnitToggle?.checked ? 'em' : 'mm');
    
    let html = '<table class="spec-table">';
    
    // Page dimensions
    html += `<tr><td class="spec-label">Size:</td><td class="spec-value">${pageSizeLabel}</td></tr>`;
    html += `<tr><td class="spec-label">Dimensions:</td><td class="spec-value">${inputs.pageWidth} × ${inputs.pageHeight} mm</td></tr>`;
    html += `<tr><td class="spec-label">Orientation:</td><td class="spec-value">${orientation}</td></tr>`;
    html += `<tr><td class="spec-label">Facing pages:</td><td class="spec-value">${facingPages ? 'Yes' : 'No'}</td></tr>`;
    
    // Helper function to format margin values with both units
    const formatMarginValue = (mmValue: number, displayUnit: Unit): string => {
      if (displayUnit === 'em') {
        const emValue = convertFromMM(mmValue, 'em', inputs.typeSize);
        return `${emValue.toFixed(1)} em (${mmValue.toFixed(1)} mm)`;
      } else {
        const emValue = convertFromMM(mmValue, 'em', inputs.typeSize);
        return `${mmValue.toFixed(1)} mm (${emValue.toFixed(1)} em)`;
      }
    };
    
    // Margins
    if (facingPages) {
      const innerMarginLeftMM = inputs.innerMarginLeft || 0;
      const innerMarginRightMM = inputs.innerMarginRight || 0;
      const outerMarginLeftMM = inputs.outerMarginLeft || 0;
      const outerMarginRightMM = inputs.outerMarginRight || 0;
      
      html += `<tr><td class="spec-label">Verso inner:</td><td class="spec-value">${formatMarginValue(innerMarginLeftMM, marginUnit)}</td></tr>`;
      html += `<tr><td class="spec-label">Verso outer:</td><td class="spec-value">${formatMarginValue(outerMarginLeftMM, marginUnit)}</td></tr>`;
      html += `<tr><td class="spec-label">Recto inner:</td><td class="spec-value">${formatMarginValue(innerMarginRightMM, marginUnit)}</td></tr>`;
      html += `<tr><td class="spec-label">Recto outer:</td><td class="spec-value">${formatMarginValue(outerMarginRightMM, marginUnit)}</td></tr>`;
    } else {
      const leftMarginMM = inputs.leftMargin;
      const rightMarginMM = inputs.rightMargin;
      
      html += `<tr><td class="spec-label">Left:</td><td class="spec-value">${formatMarginValue(leftMarginMM, marginUnit)}</td></tr>`;
      html += `<tr><td class="spec-label">Right:</td><td class="spec-value">${formatMarginValue(rightMarginMM, marginUnit)}</td></tr>`;
    }
    
    const topMarginMM = inputs.topMargin;
    const bottomMarginMM = inputs.bottomMargin;
    
    html += `<tr><td class="spec-label">Top:</td><td class="spec-value">${formatMarginValue(topMarginMM, marginUnit)}</td></tr>`;
    html += `<tr><td class="spec-label">Bottom:</td><td class="spec-value">${formatMarginValue(bottomMarginMM, marginUnit)}</td></tr>`;
    
    // Typography
    html += `<tr><td class="spec-label">Type size:</td><td class="spec-value">${inputs.typeSize} pt</td></tr>`;
    html += `<tr><td class="spec-label">Leading:</td><td class="spec-value">${inputs.leading || inputs.typeSize + 2} pt</td></tr>`;
    html += `<tr><td class="spec-label">Font family:</td><td class="spec-value">${inputs.fontFamily || 'serif'}</td></tr>`;
    html += `<tr><td class="spec-label">Hyphenation:</td><td class="spec-value">${inputs.hyphenation !== false ? 'Enabled' : 'Disabled'}</td></tr>`;
    
    // Columns
    html += `<tr><td class="spec-label">Number:</td><td class="spec-value">${inputs.numCols}</td></tr>`;
    
    // Get gutter width in display unit
    const gutterInputSpec = document.getElementById('gutterWidth') as HTMLInputElement;
    const gutterDisplay = gutterInputSpec ? parseFloat(gutterInputSpec.value) : (marginUnit === 'em' ? 1.0 : results.gutterWidth);
    let gutterDisplayValue: number;
    let gutterDisplayUnit: string;
    
    if (marginUnit === 'em') {
      // Show in ems with mm equivalent
      gutterDisplayValue = gutterDisplay;
      gutterDisplayUnit = 'em';
      html += `<tr><td class="spec-label">Gutter width:</td><td class="spec-value">${gutterDisplayValue.toFixed(1)} ${gutterDisplayUnit} (${results.gutterWidth.toFixed(1)} mm)</td></tr>`;
    } else {
      // Show in mm with em equivalent
      gutterDisplayValue = gutterDisplay;
      gutterDisplayUnit = 'mm';
      const gutterEm = convertFromMM(results.gutterWidth, 'em', inputs.typeSize);
      html += `<tr><td class="spec-label">Gutter width:</td><td class="spec-value">${gutterDisplayValue.toFixed(1)} ${gutterDisplayUnit} (${gutterEm.toFixed(1)} em)</td></tr>`;
    }
    
    // Column width with em equivalent
    const columnWidthEm = convertFromMM(results.columnWidth, 'em', inputs.typeSize);
    html += `<tr><td class="spec-label">Column width:</td><td class="spec-value">${results.columnWidth.toFixed(1)} mm (${columnWidthEm.toFixed(1)} em)</td></tr>`;
    
    if (columnSpan) {
      html += `<tr><td class="spec-label">Text box spans:</td><td class="spec-value">Columns ${columnSpan.start}–${columnSpan.end}</td></tr>`;
      // Text box width with em equivalent
      const textBoxWidthEm = convertFromMM(results.textBoxWidth, 'em', inputs.typeSize);
      html += `<tr><td class="spec-label">Text box width:</td><td class="spec-value">${results.textBoxWidth.toFixed(1)} mm (${textBoxWidthEm.toFixed(1)} em)</td></tr>`;
    } else {
      // Text box width with em equivalent
      const textBoxWidthEm = convertFromMM(results.textBoxWidth, 'em', inputs.typeSize);
      html += `<tr><td class="spec-label">Text box width:</td><td class="spec-value">${results.textBoxWidth.toFixed(1)} mm (${textBoxWidthEm.toFixed(1)} em)</td></tr>`;
    }
    if (textColumns && textColumns.length > 0) {
      const textStart = Math.min(...textColumns);
      html += `<tr><td class="spec-label">Text starts:</td><td class="spec-value">Column ${textStart}</td></tr>`;
    }
    
    // Words per line
    const wordsPerLine = calculateWordsPerLine(results.textBoxWidth, inputs.typeSize);
    html += `<tr><td class="spec-label">Words per line:</td><td class="spec-value">${wordsPerLine}</td></tr>`;
    
    html += '</table>';
    specContent.innerHTML = html;
  } catch (e) {
    // Silently fail if inputs are invalid
  }
}

function updateVisualizationOnInputChange(): void {
  try {
    const inputs = getFormInputs();
    const results = calculateLayout(inputs);
    updateVisualization(inputs);
    updateWordsPerLine();
    updateColumnWidthDisplay();
    updateSpecification();
  } catch (e) {
    // Silently fail if inputs are invalid
  }
}


/**
 * Updates column span checkboxes based on number of columns
 */
function updateColumnSpanSlider(): void {
  const slider = document.getElementById('columnSpanSlider') as HTMLInputElement;
  const valueDisplay = document.getElementById('columnSpanValue');
  if (!slider) return;
  
  const numCols = parseInt((document.getElementById('numCols') as HTMLInputElement).value, 10) || 1;
  
  // Update slider max to match number of columns
  slider.max = numCols.toString();
  
  // Ensure slider value doesn't exceed max
  const currentValue = parseInt(slider.value, 10);
  if (currentValue > numCols) {
    slider.value = numCols.toString();
  }
  
  // Update display value
  if (valueDisplay) {
    valueDisplay.textContent = slider.value;
  }
  
  // Update text column checkboxes when span changes
  updateTextStartSlider();
}

/**
 * Updates text start slider - sets max to numCols and updates value display
 */
function updateTextStartSlider(): void {
  const slider = document.getElementById('textStartSlider') as HTMLInputElement;
  const valueDisplay = document.getElementById('textStartValue');
  if (!slider) return;
  
  const numCols = parseInt((document.getElementById('numCols') as HTMLInputElement).value, 10) || 1;
  const columnSpan = getColumnSpan();
  
  // Set max to number of columns
  slider.max = numCols.toString();
  
  // Ensure value doesn't exceed max
  const currentValue = parseInt(slider.value, 10) || 1;
  if (currentValue > numCols) {
    slider.value = numCols.toString();
  }
  
  // Default to span start if span exists, otherwise 1
  if (!slider.value || slider.value === '0') {
    if (columnSpan) {
      slider.value = columnSpan.start.toString();
    } else {
      slider.value = '1';
    }
  }
  
  // Update display
  if (valueDisplay) {
    valueDisplay.textContent = slider.value;
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
  const orientationToggle = document.getElementById('orientationToggle') as HTMLInputElement;
  return orientationToggle?.checked ? 'landscape' : 'portrait';
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
  saveSettings();
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
 * Updates the visual state of orientation toggle icons
 */
function updateOrientationToggleState(): void {
  const orientationToggle = document.getElementById('orientationToggle') as HTMLInputElement;
  const portraitOption = document.querySelector('.unit-option-portrait');
  const landscapeOption = document.querySelector('.unit-option-landscape');
  
  if (orientationToggle && portraitOption && landscapeOption) {
    if (orientationToggle.checked) {
      // Landscape selected
      portraitOption.classList.remove('unit-option-mm');
      portraitOption.classList.add('unit-option-em');
      landscapeOption.classList.remove('unit-option-em');
      landscapeOption.classList.add('unit-option-mm');
    } else {
      // Portrait selected
      portraitOption.classList.remove('unit-option-em');
      portraitOption.classList.add('unit-option-mm');
      landscapeOption.classList.remove('unit-option-mm');
      landscapeOption.classList.add('unit-option-em');
    }
  }
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
/**
 * Updates margin labels to show the selected unit
 */
function updateMarginLabels(): void {
  const marginUnitToggle = document.getElementById('marginUnitToggle') as HTMLInputElement;
  const marginUnit: Unit = (marginUnitToggle?.checked ? 'em' : 'mm');
  const unitLabel = marginUnit === 'em' ? 'em' : 'mm';
  
  const labelMap: Record<string, string> = {
    'topMarginLabel': 'Top',
    'bottomMarginLabel': 'Bottom',
    'leftMarginLabel': 'Left',
    'rightMarginLabel': 'Right',
    'innerMarginLeftLabel': 'Inner',
    'innerMarginRightLabel': 'Inner',
    'outerMarginLeftLabel': 'Outer',
    'outerMarginRightLabel': 'Outer',
    'gutterWidthLabel': 'Gutter width'
  };
  
  try {
    const typeSize = parseFloat((document.getElementById('typeSize') as HTMLInputElement).value);
    
    Object.keys(labelMap).forEach(labelId => {
      const label = document.getElementById(labelId);
      if (label) {
        if (labelId === 'gutterWidthLabel') {
          // For gutter width, show only the unit in label
          label.textContent = `Gutter width (${unitLabel})`;
          
          // Show conversion value in helper text below input
          const gutterInput = document.getElementById('gutterWidth') as HTMLInputElement;
          const conversionElement = document.getElementById('gutterWidthConversion') as HTMLElement;
          let gutterValue = gutterInput ? parseFloat(gutterInput.value) : NaN;
          
          // If gutter value is empty or invalid, use default (1em or equivalent)
          if (isNaN(gutterValue) || gutterValue <= 0) {
            if (marginUnit === 'em') {
              gutterValue = 1.0; // Default to 1em
            } else {
              gutterValue = convertToMM(1.0, 'em', typeSize); // Default to 1em equivalent in mm
            }
          }
          
          if (conversionElement && !isNaN(typeSize) && !isNaN(gutterValue) && gutterValue > 0) {
            let conversionValue: number;
            let conversionUnit: string;
            
            if (marginUnit === 'em') {
              // Show mm equivalent
              conversionValue = convertToMM(gutterValue, 'em', typeSize);
              conversionUnit = 'mm';
              conversionElement.textContent = `${conversionValue.toFixed(1)} ${conversionUnit}`;
            } else {
              // Show em equivalent
              conversionValue = convertFromMM(gutterValue, 'em', typeSize);
              conversionUnit = 'em';
              conversionElement.textContent = `${conversionValue.toFixed(1)} ${conversionUnit}`;
            }
          } else if (conversionElement) {
            conversionElement.textContent = '';
          }
        } else {
          // For margin labels, show only the unit in label
          label.textContent = `${labelMap[labelId]} (${unitLabel})`;
          
          // Show conversion value in helper text below input
          const inputId = labelId.replace('Label', '');
          const input = document.getElementById(inputId) as HTMLInputElement;
          const conversionElement = document.getElementById(`${inputId}Conversion`) as HTMLElement;
          const marginValue = input ? parseFloat(input.value) : 0;
          
          if (conversionElement && !isNaN(typeSize) && !isNaN(marginValue) && marginValue > 0) {
            let conversionValue: number;
            let conversionUnit: string;
            
            if (marginUnit === 'em') {
              // Show mm equivalent
              conversionValue = convertToMM(marginValue, 'em', typeSize);
              conversionUnit = 'mm';
              conversionElement.textContent = `${conversionValue.toFixed(1)} ${conversionUnit}`;
            } else {
              // Show em equivalent
              conversionValue = convertFromMM(marginValue, 'em', typeSize);
              conversionUnit = 'em';
              conversionElement.textContent = `${conversionValue.toFixed(1)} ${conversionUnit}`;
            }
          } else if (conversionElement) {
            conversionElement.textContent = '';
          }
        }
      }
    });
  } catch (e) {
    // Fallback to simple labels if conversion fails
    Object.keys(labelMap).forEach(labelId => {
      const label = document.getElementById(labelId);
      if (label) {
        label.textContent = `${labelMap[labelId]} (${unitLabel})`;
      }
    });
  }
}

/**
 * Converts margin and gutter values when switching units
 */
function convertMarginValues(fromUnit: Unit, toUnit: Unit): void {
  if (fromUnit === toUnit) return;
  
  const typeSize = parseFloat((document.getElementById('typeSize') as HTMLInputElement).value);
  const marginInputs = [
    'topMargin',
    'bottomMargin',
    'leftMargin',
    'rightMargin',
    'innerMarginLeft',
    'innerMarginRight',
    'outerMarginLeft',
    'outerMarginRight'
  ];
  
  marginInputs.forEach(inputId => {
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (input && input.value) {
      const currentValue = parseFloat(input.value);
      if (!isNaN(currentValue)) {
        // Convert to mm first, then to target unit
        let valueInMM: number;
        if (fromUnit === 'em') {
          valueInMM = convertToMM(currentValue, 'em', typeSize);
        } else {
          valueInMM = currentValue; // Already in mm
        }
        
        // Convert from mm to target unit
        let newValue: number;
        if (toUnit === 'em') {
          newValue = convertFromMM(valueInMM, 'em', typeSize);
        } else {
          newValue = valueInMM; // Already in mm
        }
        
        input.value = newValue.toFixed(1);
      }
    }
  });
  
  // Convert gutter width
  const gutterInput = document.getElementById('gutterWidth') as HTMLInputElement;
  if (gutterInput) {
    let currentGutter = parseFloat(gutterInput.value);
    
    // If gutter is empty or invalid, use default (1em or equivalent)
    if (isNaN(currentGutter) || currentGutter <= 0) {
      if (fromUnit === 'em') {
        currentGutter = 1.0; // Default to 1em
      } else {
        currentGutter = convertToMM(1.0, 'em', typeSize); // Default to 1em equivalent in mm
      }
    }
    
    // Convert to mm first, then to target unit
    let gutterInMM: number;
    if (fromUnit === 'em') {
      gutterInMM = convertToMM(currentGutter, 'em', typeSize);
    } else {
      gutterInMM = currentGutter; // Already in mm
    }
    
    // Convert from mm to target unit
    let newGutter: number;
    if (toUnit === 'em') {
      newGutter = convertFromMM(gutterInMM, 'em', typeSize);
    } else {
      newGutter = gutterInMM; // Already in mm
    }
    
    gutterInput.value = newGutter.toFixed(3);
  }
}

function updateMarginInputs(): void {
  const facingPages = isFacingPages();
  const singlePageMargins = document.getElementById('singlePageMargins') as HTMLElement;
  const facingPagesMargins = document.getElementById('facingPagesMargins') as HTMLElement;
  
  const leftMarginInput = document.getElementById('leftMargin') as HTMLInputElement;
  const rightMarginInput = document.getElementById('rightMargin') as HTMLInputElement;
  const innerMarginLeftInput = document.getElementById('innerMarginLeft') as HTMLInputElement;
  const innerMarginRightInput = document.getElementById('innerMarginRight') as HTMLInputElement;
  const outerMarginLeftInput = document.getElementById('outerMarginLeft') as HTMLInputElement;
  const outerMarginRightInput = document.getElementById('outerMarginRight') as HTMLInputElement;
  
  // Update labels
  updateMarginLabels();
  
  if (facingPages) {
    // Show facing pages inputs, hide single page inputs
    if (singlePageMargins) singlePageMargins.style.display = 'none';
    if (facingPagesMargins) facingPagesMargins.style.display = 'grid';
    
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
  const facingPagesCheckbox = document.getElementById('facingPages') as HTMLInputElement;
  const facingPages = facingPagesCheckbox?.checked ?? false;
  
  // Clone the SVG to avoid modifying the original
  const svgClone = svg.cloneNode(true) as SVGElement;
  
  // Calculate actual page dimensions in pixels (1mm = 3.779527559 pixels at 96 DPI)
  const MM_TO_PX = 3.779527559;
  const actualPageWidthPx = inputs.pageWidth * MM_TO_PX;
  const actualPageHeightPx = inputs.pageHeight * MM_TO_PX;
  const totalWidthPx = facingPages ? actualPageWidthPx * 2 : actualPageWidthPx;
  const headingHeight = facingPages ? 20 : 0;
  const totalHeightPx = actualPageHeightPx + headingHeight;
  
  // Get the viewBox from the original SVG
  const viewBox = svg.getAttribute('viewBox') || '0 0 400 400';
  
  // Set explicit width and height on the SVG for 1:1 scale
  svgClone.setAttribute('width', `${totalWidthPx}px`);
  svgClone.setAttribute('height', `${totalHeightPx}px`);
  svgClone.setAttribute('viewBox', viewBox);
  svgClone.removeAttribute('style'); // Remove any inline styles that might affect sizing
  
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
      width: ${totalWidthPx}px;
      height: ${totalHeightPx}px;
      max-width: 100%;
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
        ${inputs.textColumns && inputs.textColumns.length > 0 ? `<p><strong>Text starts:</strong> Column ${Math.min(...inputs.textColumns)}</p>` : ''}
        <p><strong>Scale:</strong> 1:1 (Actual size)</p>
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

/**
 * Saves all form settings to localStorage
 */
function saveSettings(): void {
  try {
    const settings: Record<string, string | boolean | number | number[]> = {};
    
    // Page dimensions
    const pageWidth = (document.getElementById('pageWidth') as HTMLInputElement)?.value || '';
    const pageHeight = (document.getElementById('pageHeight') as HTMLInputElement)?.value || '';
    const paperSizeSelect = (document.getElementById('paperSizeSelect') as HTMLSelectElement)?.value || '';
    const orientationToggle = (document.getElementById('orientationToggle') as HTMLInputElement)?.checked ?? false;
    
    settings.pageWidth = pageWidth;
    settings.pageHeight = pageHeight;
    settings.paperSizeSelect = paperSizeSelect;
    settings.orientationToggle = orientationToggle;
    
    // Margins
    const marginUnitToggle = (document.getElementById('marginUnitToggle') as HTMLInputElement)?.checked ?? false;
    settings.marginUnitToggle = marginUnitToggle;
    
    const topMargin = (document.getElementById('topMargin') as HTMLInputElement)?.value || '';
    const bottomMargin = (document.getElementById('bottomMargin') as HTMLInputElement)?.value || '';
    const leftMargin = (document.getElementById('leftMargin') as HTMLInputElement)?.value || '';
    const rightMargin = (document.getElementById('rightMargin') as HTMLInputElement)?.value || '';
    const innerMarginLeft = (document.getElementById('innerMarginLeft') as HTMLInputElement)?.value || '';
    const innerMarginRight = (document.getElementById('innerMarginRight') as HTMLInputElement)?.value || '';
    const outerMarginLeft = (document.getElementById('outerMarginLeft') as HTMLInputElement)?.value || '';
    const outerMarginRight = (document.getElementById('outerMarginRight') as HTMLInputElement)?.value || '';
    
    settings.topMargin = topMargin;
    settings.bottomMargin = bottomMargin;
    settings.leftMargin = leftMargin;
    settings.rightMargin = rightMargin;
    settings.innerMarginLeft = innerMarginLeft;
    settings.innerMarginRight = innerMarginRight;
    settings.outerMarginLeft = outerMarginLeft;
    settings.outerMarginRight = outerMarginRight;
    
    // Facing pages
    const facingPages = (document.getElementById('facingPages') as HTMLInputElement)?.checked ?? false;
    settings.facingPages = facingPages;
    
    // Columns
    const numCols = (document.getElementById('numCols') as HTMLInputElement)?.value || '';
    const gutterWidth = (document.getElementById('gutterWidth') as HTMLInputElement)?.value || '';
    settings.numCols = numCols;
    settings.gutterWidth = gutterWidth;
    
    // Column span slider
    const columnSpanSlider = document.getElementById('columnSpanSlider') as HTMLInputElement;
    if (columnSpanSlider) {
      settings.columnSpanValue = columnSpanSlider.value;
    }
    
    // Text start slider
    const textStartSlider = document.getElementById('textStartSlider') as HTMLInputElement;
    if (textStartSlider) {
      settings.textStartColumn = parseInt(textStartSlider.value, 10) || 1;
    }
    
    // Typography
    const typeSize = (document.getElementById('typeSize') as HTMLInputElement)?.value || '';
    const leading = (document.getElementById('leading') as HTMLInputElement)?.value || '';
    const fontFamily = (document.getElementById('fontFamily') as HTMLSelectElement)?.value || '';
    const hyphenation = (document.getElementById('hyphenation') as HTMLInputElement)?.checked ?? false;
    
    settings.typeSize = typeSize;
    settings.leading = leading;
    settings.fontFamily = fontFamily;
    settings.hyphenation = hyphenation;
    
    // Sample text
    const sampleText = (document.getElementById('sampleText') as HTMLTextAreaElement)?.value || '';
    settings.sampleText = sampleText;
    
    // Layer visibility
    const showMargins = (document.getElementById('showMargins') as HTMLInputElement)?.checked ?? true;
    const showColumns = (document.getElementById('showColumns') as HTMLInputElement)?.checked ?? true;
    const showText = (document.getElementById('showText') as HTMLInputElement)?.checked ?? true;
    const solidFills = (document.getElementById('solidFills') as HTMLInputElement)?.checked ?? false;
    
    settings.showMargins = showMargins;
    settings.showColumns = showColumns;
    settings.showText = showText;
    settings.solidFills = solidFills;
    
    // Sparkle toggle
    const sparkleToggle = (document.getElementById('sparkleToggle') as HTMLInputElement)?.checked ?? true;
    settings.sparkleEnabled = sparkleToggle;
    
    localStorage.setItem('compositorSettings', JSON.stringify(settings));
  } catch (e) {
    // Silently fail if localStorage is not available
    console.error('Failed to save settings:', e);
  }
}

/**
 * Loads all form settings from localStorage
 */
function loadSettings(): void {
  try {
    const savedSettings = localStorage.getItem('compositorSettings');
    const marginUnitToggle = document.getElementById('marginUnitToggle') as HTMLInputElement;
    
    // Margin unit - default to em (checked) if no saved settings
    if (marginUnitToggle) {
      if (!savedSettings) {
        marginUnitToggle.checked = true; // Default to em
        return;
      }
    }
    
    if (!savedSettings) return;
    
    const settings = JSON.parse(savedSettings);
    
    // Page dimensions
    if (settings.pageWidth) {
      const pageWidthInput = document.getElementById('pageWidth') as HTMLInputElement;
      if (pageWidthInput) pageWidthInput.value = settings.pageWidth;
    }
    if (settings.pageHeight) {
      const pageHeightInput = document.getElementById('pageHeight') as HTMLInputElement;
      if (pageHeightInput) pageHeightInput.value = settings.pageHeight;
    }
    if (settings.paperSizeSelect !== undefined) {
      const paperSizeSelect = document.getElementById('paperSizeSelect') as HTMLSelectElement;
      if (paperSizeSelect) paperSizeSelect.value = settings.paperSizeSelect;
    }
    if (settings.orientationToggle !== undefined) {
      const orientationToggle = document.getElementById('orientationToggle') as HTMLInputElement;
      if (orientationToggle) orientationToggle.checked = settings.orientationToggle;
    }
    
    // Margin unit - default to em (checked) unless explicitly saved as false
    if (marginUnitToggle) {
      // Only use saved setting if it's explicitly set to false (mm)
      // Default to em (checked) for all other cases
      if (settings.marginUnitToggle === false) {
        marginUnitToggle.checked = false; // User explicitly saved as mm
      } else {
        marginUnitToggle.checked = true; // Default to em
      }
    }
    
    // Margins
    if (settings.topMargin) {
      const topMarginInput = document.getElementById('topMargin') as HTMLInputElement;
      if (topMarginInput) topMarginInput.value = settings.topMargin;
    }
    if (settings.bottomMargin) {
      const bottomMarginInput = document.getElementById('bottomMargin') as HTMLInputElement;
      if (bottomMarginInput) bottomMarginInput.value = settings.bottomMargin;
    }
    if (settings.leftMargin) {
      const leftMarginInput = document.getElementById('leftMargin') as HTMLInputElement;
      if (leftMarginInput) leftMarginInput.value = settings.leftMargin;
    }
    if (settings.rightMargin) {
      const rightMarginInput = document.getElementById('rightMargin') as HTMLInputElement;
      if (rightMarginInput) rightMarginInput.value = settings.rightMargin;
    }
    if (settings.innerMarginLeft) {
      const innerMarginLeftInput = document.getElementById('innerMarginLeft') as HTMLInputElement;
      if (innerMarginLeftInput) innerMarginLeftInput.value = settings.innerMarginLeft;
    }
    if (settings.innerMarginRight) {
      const innerMarginRightInput = document.getElementById('innerMarginRight') as HTMLInputElement;
      if (innerMarginRightInput) innerMarginRightInput.value = settings.innerMarginRight;
    }
    if (settings.outerMarginLeft) {
      const outerMarginLeftInput = document.getElementById('outerMarginLeft') as HTMLInputElement;
      if (outerMarginLeftInput) outerMarginLeftInput.value = settings.outerMarginLeft;
    }
    if (settings.outerMarginRight) {
      const outerMarginRightInput = document.getElementById('outerMarginRight') as HTMLInputElement;
      if (outerMarginRightInput) outerMarginRightInput.value = settings.outerMarginRight;
    }
    
    // Facing pages
    if (settings.facingPages !== undefined) {
      const facingPagesCheckbox = document.getElementById('facingPages') as HTMLInputElement;
      if (facingPagesCheckbox) facingPagesCheckbox.checked = settings.facingPages;
    }
    
    // Columns
    if (settings.numCols) {
      const numColsInput = document.getElementById('numCols') as HTMLInputElement;
      if (numColsInput) numColsInput.value = settings.numCols;
    }
    if (settings.gutterWidth) {
      const gutterWidthInput = document.getElementById('gutterWidth') as HTMLInputElement;
      if (gutterWidthInput) gutterWidthInput.value = settings.gutterWidth;
    }
    
    // Typography
    if (settings.typeSize) {
      const typeSizeInput = document.getElementById('typeSize') as HTMLInputElement;
      if (typeSizeInput) typeSizeInput.value = settings.typeSize;
    }
    if (settings.leading) {
      const leadingInput = document.getElementById('leading') as HTMLInputElement;
      if (leadingInput) leadingInput.value = settings.leading;
    }
    if (settings.fontFamily) {
      const fontFamilySelect = document.getElementById('fontFamily') as HTMLSelectElement;
      if (fontFamilySelect) fontFamilySelect.value = settings.fontFamily;
    }
    if (settings.hyphenation !== undefined) {
      const hyphenationCheckbox = document.getElementById('hyphenation') as HTMLInputElement;
      if (hyphenationCheckbox) hyphenationCheckbox.checked = settings.hyphenation;
    }
    
    // Sample text
    if (settings.sampleText !== undefined) {
      const sampleTextInput = document.getElementById('sampleText') as HTMLTextAreaElement;
      if (sampleTextInput) sampleTextInput.value = settings.sampleText;
    }
    
    // Layer visibility
    if (settings.showMargins !== undefined) {
      const showMarginsCheckbox = document.getElementById('showMargins') as HTMLInputElement;
      if (showMarginsCheckbox) showMarginsCheckbox.checked = settings.showMargins;
    }
    if (settings.showColumns !== undefined) {
      const showColumnsCheckbox = document.getElementById('showColumns') as HTMLInputElement;
      if (showColumnsCheckbox) showColumnsCheckbox.checked = settings.showColumns;
    }
    if (settings.showText !== undefined) {
      const showTextCheckbox = document.getElementById('showText') as HTMLInputElement;
      if (showTextCheckbox) showTextCheckbox.checked = settings.showText;
    }
    if (settings.solidFills !== undefined) {
      const solidFillsCheckbox = document.getElementById('solidFills') as HTMLInputElement;
      if (solidFillsCheckbox) solidFillsCheckbox.checked = settings.solidFills;
    }
    
    // Update margin labels and inputs visibility after loading
    updateMarginLabels();
    updateMarginInputs();
    
    // Restore column span slider
    if (settings.columnSpanValue) {
      const columnSpanSlider = document.getElementById('columnSpanSlider') as HTMLInputElement;
      const columnSpanValue = document.getElementById('columnSpanValue');
      if (columnSpanSlider) {
        const numCols = parseInt((document.getElementById('numCols') as HTMLInputElement).value, 10) || 1;
        const savedValue = Math.min(parseInt(settings.columnSpanValue, 10), numCols); // Ensure value doesn't exceed max
        columnSpanSlider.value = savedValue.toString();
        if (columnSpanValue) {
          columnSpanValue.textContent = savedValue.toString();
        }
      }
    } else if (settings.columnSpan && Array.isArray(settings.columnSpan)) {
      // Legacy support: convert old checkbox-based settings to slider
      const columnSpanSlider = document.getElementById('columnSpanSlider') as HTMLInputElement;
      const columnSpanValue = document.getElementById('columnSpanValue');
      if (columnSpanSlider && settings.columnSpan.length > 0) {
        const spanCount = settings.columnSpan.length;
        const numCols = parseInt((document.getElementById('numCols') as HTMLInputElement).value, 10) || 1;
        const savedValue = Math.min(spanCount, numCols);
        columnSpanSlider.value = savedValue.toString();
        if (columnSpanValue) {
          columnSpanValue.textContent = savedValue.toString();
        }
      }
    }
    
    // Restore text start slider
    const textStartSlider = document.getElementById('textStartSlider') as HTMLInputElement;
    if (textStartSlider) {
      // Support both old textColumns array and new textStartColumn value
      if (settings.textStartColumn !== undefined) {
        textStartSlider.value = settings.textStartColumn.toString();
      } else if (settings.textColumns && Array.isArray(settings.textColumns) && settings.textColumns.length > 0) {
        // Migrate from old checkbox system - use first column
        textStartSlider.value = Math.min(...settings.textColumns).toString();
      }
      const textStartValue = document.getElementById('textStartValue');
      if (textStartValue) {
        textStartValue.textContent = textStartSlider.value;
      }
      updateTextStartSlider(); // Update max and validate
    }
    
    // Restore sparkle toggle
    if (settings.sparkleEnabled !== undefined) {
      const sparkleToggle = document.getElementById('sparkleToggle') as HTMLInputElement;
      if (sparkleToggle) {
        sparkleToggle.checked = settings.sparkleEnabled;
      }
    }
    
    // Trigger visualization update after all settings are loaded
    setTimeout(() => {
      updateVisualizationOnInputChange();
      updateWordsPerLine();
      updateColumnWidthDisplay();
    }, 200);
  } catch (e) {
    // Silently fail if localStorage is not available or data is corrupted
    console.error('Failed to load settings:', e);
    // Still trigger visualization with defaults
    setTimeout(() => {
      updateVisualizationOnInputChange();
      updateWordsPerLine();
      updateColumnWidthDisplay();
    }, 200);
  }
}

/**
 * Shows the introduction modal
 */
function showIntroModal(): void {
  const modal = document.getElementById('introModal');
  if (modal) {
    modal.classList.add('show');
  }
}

/**
 * Hides the introduction modal
 */
function hideIntroModal(): void {
  const modal = document.getElementById('introModal');
  if (modal) {
    modal.classList.remove('show');
  }
}

// Track if decorations have been initialized
let decorationsInitialized = false;

/**
 * Adds random letterpress decoration images to the visualization container
 */
function addLetterpressDecorations(): void {
  const container = document.getElementById('visualizationContainer');
  if (!container) return;
  
  // Only add decorations once on page load
  if (decorationsInitialized) return;
  
  // Check if decorations already exist
  if (container.querySelector('.letterpress-decoration')) {
    decorationsInitialized = true;
    return;
  }
  
  const decorations = [
    {
      src: 'images/compositor.jpg',
      alt: 'Composing stick with lead type',
      name: 'compositor',
      type: 'image'
    },
    {
      src: 'images/chase.jpeg',
      alt: 'Chase with type',
      name: 'chase',
      type: 'image'
    },
    {
      src: 'images/em.jpg',
      alt: 'Capital wooden M',
      name: 'em',
      type: 'image'
    }
  ];
  
  // Randomly decide if we should include an emoji (50% chance)
  const includeEmoji = Math.random() > 0.5;
  const emojis = ['💣', '🔥', '💥'];
  
  if (includeEmoji) {
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    decorations.push({
      src: randomEmoji,
      alt: 'Random emoji',
      name: 'emoji',
      type: 'emoji'
    });
  }
  
  // Shuffle decorations for random order
  const shuffledDecorations = decorations.sort(() => Math.random() - 0.5);
  
  shuffledDecorations.forEach((decoration, index) => {
    // Stagger appearance: each decoration appears 1 second after the previous one
    const appearanceDelay = index * 1000;
    
    setTimeout(() => {
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;
      
      let element: HTMLElement;
      
      if (decoration.type === 'emoji') {
        // Create emoji element
        element = document.createElement('div');
        element.textContent = decoration.src;
        element.className = 'letterpress-decoration letterpress-emoji';
        element.id = `decoration-${decoration.name}`;
        element.style.fontSize = '200px';
        element.style.textAlign = 'center';
        element.style.lineHeight = '1';
      } else {
        // Create image element
        const img = document.createElement('img');
        img.src = decoration.src;
        img.alt = decoration.alt;
        img.className = 'letterpress-decoration';
        img.id = `decoration-${decoration.name}`;
        
        // Handle image load errors gracefully
        img.onerror = () => {
          console.warn(`Failed to load decoration image: ${decoration.src}`);
          img.style.display = 'none';
        };
        
        element = img;
      }
      
      // Random position anywhere in the container
      const imageSize = decoration.type === 'emoji' ? 200 : 500;
      const padding = 50; // Padding from edges
      
      // Calculate available area for positioning
      const maxX = containerWidth - imageSize - padding;
      const maxY = containerHeight - imageSize - padding;
      
      // Random position within available bounds
      let x = padding + Math.random() * Math.max(0, maxX - padding);
      let y = padding + Math.random() * Math.max(0, maxY - padding);
      
      // Ensure values are valid
      x = Math.max(padding, Math.min(x, containerWidth - imageSize - padding));
      y = Math.max(padding, Math.min(y, containerHeight - imageSize - padding));
      
      element.style.left = `${x}px`;
      element.style.top = `${y}px`;
      
      // Random rotation between -15 and 15 degrees (only for images)
      if (decoration.type === 'image') {
        const rotation = (Math.random() * 30) - 15;
        element.style.transform = `rotate(${rotation}deg)`;
      }
      
      // Start with opacity 0 and fade in
      element.style.opacity = '0';
      container.appendChild(element);
      
      // Fade in after a brief moment
      setTimeout(() => {
        element.style.transition = 'opacity 0.3s ease-in';
        element.style.opacity = '1';
      }, 50);
      
      // Random display duration between 2-4 seconds after appearance
      const displayDuration = 2000 + Math.random() * 2000; // 2000-4000ms
      
      setTimeout(() => {
        if (element.parentNode && element.parentNode === container) {
          // Remove instantly without fade-out
          element.remove();
        }
      }, displayDuration);
    }, appearanceDelay);
  });
  
  decorationsInitialized = true;
}

export function initializeCalculator(): void {
  // Initialize footer menu toggle
  const footerMenuToggle = document.getElementById('footerMenuToggle');
  const footer = document.getElementById('footer');
  if (footerMenuToggle && footer) {
    footerMenuToggle.addEventListener('click', () => {
      footer.classList.toggle('expanded');
    });
  }

  // Prevent scroll propagation from container to body
  const container = document.querySelector('.container') as HTMLElement;
  if (container) {
    container.addEventListener('wheel', (e: Event) => {
      const wheelEvent = e as WheelEvent;
      const target = wheelEvent.target as HTMLElement;
      
      // Only prevent propagation if scrolling inside the container
      if (container.contains(target)) {
        // Allow the container to scroll, but prevent event from reaching body
        wheelEvent.stopPropagation();
      }
    }, { passive: true });
  }

  // Load saved settings first
  loadSettings();
  
  // Set em toggle default to checked after loading (will override if no saved setting)
  const defaultMarginUnitToggle = document.getElementById('marginUnitToggle') as HTMLInputElement;
  if (defaultMarginUnitToggle && !defaultMarginUnitToggle.checked) {
    // Only set if not already checked (no saved setting was loaded)
    const savedSettings = localStorage.getItem('compositorSettings');
    if (!savedSettings || !JSON.parse(savedSettings).marginUnitToggle) {
      defaultMarginUnitToggle.checked = true; // Default to em
    }
  }
  
  // Initialize orientation toggle state
  updateOrientationToggleState();
  
  // Add letterpress decorations (only if sparkle is enabled)
  const sparkleToggle = document.getElementById('sparkleToggle') as HTMLInputElement;
  if (sparkleToggle) {
    // Load saved sparkle setting
    const savedSettings = localStorage.getItem('compositorSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings.sparkleEnabled !== undefined) {
          sparkleToggle.checked = settings.sparkleEnabled;
        } else {
          sparkleToggle.checked = true; // Default to enabled
        }
      } catch (e) {
        sparkleToggle.checked = true; // Default to enabled
      }
    } else {
      sparkleToggle.checked = true; // Default to enabled
    }
    
    // Add decorations if enabled
    if (sparkleToggle.checked) {
      setTimeout(() => {
        addLetterpressDecorations();
      }, 100);
    }
    
    // Handle toggle change
    sparkleToggle.addEventListener('change', () => {
      saveSettings();
      // If enabling, add decorations; if disabling, remove them
      if (sparkleToggle.checked) {
        setTimeout(() => {
          addLetterpressDecorations();
        }, 100);
      } else {
        const container = document.getElementById('visualizationContainer');
        if (container) {
          const decorations = container.querySelectorAll('.letterpress-decoration');
          decorations.forEach(decoration => decoration.remove());
          decorationsInitialized = false; // Reset flag so decorations can be re-added if toggled back on
        }
      }
    });
  } else {
    // If toggle doesn't exist, add decorations by default
    setTimeout(() => {
      addLetterpressDecorations();
    }, 100);
  }
  
  // Initialize modal
  const modal = document.getElementById('introModal');
  const readMeLink = document.getElementById('readMeLink');
  const readMeLinkFixed = document.getElementById('readMeLinkFixed');
  const closeModal = document.getElementById('closeModal');
  
  const handleReadMeClick = (e: Event) => {
    e.preventDefault();
    showIntroModal();
  };
  
  if (readMeLink) {
    readMeLink.addEventListener('click', handleReadMeClick);
  }
  
  if (readMeLinkFixed) {
    readMeLinkFixed.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showIntroModal();
    });
  }
  
  if (closeModal) {
    closeModal.addEventListener('click', () => {
      hideIntroModal();
    });
  }
  
  // Close modal when clicking outside
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        hideIntroModal();
      }
    });
    
    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('show')) {
        hideIntroModal();
      }
    });
    
    // Show modal on page load (only if not previously dismissed)
    const modalDismissed = localStorage.getItem('introModalDismissed');
    if (!modalDismissed) {
      // Small delay to ensure page is loaded
      setTimeout(() => {
        showIntroModal();
      }, 100);
    }
  }
  
  // Save dismissal state when closing
  if (closeModal) {
    closeModal.addEventListener('click', () => {
      localStorage.setItem('introModalDismissed', 'true');
    });
  }
  
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        localStorage.setItem('introModalDismissed', 'true');
      }
    });
  }
  
  // Initialize margin inputs visibility
  updateMarginInputs();
  
  // Handle margin unit toggle
  const marginUnitToggle = document.getElementById('marginUnitToggle') as HTMLInputElement;
  if (marginUnitToggle) {
    let previousUnit: Unit = marginUnitToggle.checked ? 'em' : 'mm';
    marginUnitToggle.addEventListener('change', () => {
      const newUnit: Unit = marginUnitToggle.checked ? 'em' : 'mm';
      convertMarginValues(previousUnit, newUnit);
      updateMarginLabels();
      previousUnit = newUnit;
      // Update gutter helper text after unit change
      updateColumnWidthDisplay();
      updateVisualizationOnInputChange();
      saveSettings();
    });
  }
  
  // Handle gutter width input changes to update label
  const gutterWidthInput = document.getElementById('gutterWidth') as HTMLInputElement;
  if (gutterWidthInput) {
    gutterWidthInput.addEventListener('input', () => {
      updateMarginLabels();
      updateVisualizationOnInputChange();
      saveSettings();
    });
    gutterWidthInput.addEventListener('change', () => {
      updateMarginLabels();
      updateVisualizationOnInputChange();
      saveSettings();
    });
  }
  
  // Handle margin input changes to update labels with conversion values
  const marginInputs = [
    'topMargin',
    'bottomMargin',
    'leftMargin',
    'rightMargin',
    'innerMarginLeft',
    'innerMarginRight',
    'outerMarginLeft',
    'outerMarginRight'
  ];
  
  marginInputs.forEach(inputId => {
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (input) {
      input.addEventListener('input', () => {
        updateMarginLabels();
        updateVisualizationOnInputChange();
        saveSettings();
      });
      input.addEventListener('change', () => {
        updateMarginLabels();
        updateVisualizationOnInputChange();
        saveSettings();
      });
    }
  });

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
      saveSettings();
    });
  }
  
  // Add event listeners for facing pages margin inputs
  const facingPagesMarginInputs = ['innerMarginLeft', 'innerMarginRight', 'outerMarginLeft', 'outerMarginRight'];
  facingPagesMarginInputs.forEach(id => {
    const input = document.getElementById(id) as HTMLInputElement;
    if (input) {
      input.addEventListener('input', () => {
        updateMarginLabels();
        updateVisualizationOnInputChange();
        saveSettings();
      });
      input.addEventListener('change', () => {
        updateMarginLabels();
        updateVisualizationOnInputChange();
        saveSettings();
      });
    }
  });

  // Handle sample text input - update visualization when text changes
  const sampleTextInput = document.getElementById('sampleText') as HTMLTextAreaElement;
  if (sampleTextInput) {
    sampleTextInput.addEventListener('input', () => {
      updateVisualizationOnInputChange();
      saveSettings();
    });
    sampleTextInput.addEventListener('change', () => {
      updateVisualizationOnInputChange();
      saveSettings();
    });
  }

  // Handle layer visibility checkboxes
  const layerCheckboxes = ['showMargins', 'showColumns', 'showText', 'solidFills'];
  layerCheckboxes.forEach(id => {
    const checkbox = document.getElementById(id) as HTMLInputElement;
    if (checkbox) {
      checkbox.addEventListener('change', () => {
        updateVisualizationOnInputChange();
        saveSettings();
      });
    }
  });

  // Load default text on page open (only if no saved text exists)
  // Note: loadSettings() handles loading saved text, so we only set default if nothing was loaded
  if (sampleTextInput && !sampleTextInput.value) {
    sampleTextInput.value = DEFAULT_SAMPLE_TEXT;
  }

  // Handle load default text button
  const loadDefaultTextButton = document.getElementById('loadDefaultTextButton');
  if (loadDefaultTextButton && sampleTextInput) {
    loadDefaultTextButton.addEventListener('click', () => {
      sampleTextInput.value = DEFAULT_SAMPLE_TEXT;
      updateVisualizationOnInputChange();
      saveSettings();
    });
  }

  // Handle clear text button
  const clearTextButton = document.getElementById('clearTextButton');
  if (clearTextButton && sampleTextInput) {
    clearTextButton.addEventListener('click', () => {
      sampleTextInput.value = '';
      updateVisualizationOnInputChange();
      saveSettings();
    });
  }

  // Initialize column span slider
  updateColumnSpanSlider();
  
  // Handle column span slider
  const columnSpanSlider = document.getElementById('columnSpanSlider') as HTMLInputElement;
  if (columnSpanSlider) {
    const columnSpanValue = document.getElementById('columnSpanValue');
    columnSpanSlider.addEventListener('input', () => {
      if (columnSpanValue) {
        columnSpanValue.textContent = columnSpanSlider.value;
      }
      updateTextStartSlider();
      updateVisualizationOnInputChange();
      saveSettings();
    });
    columnSpanSlider.addEventListener('change', () => {
      updateTextStartSlider();
      updateVisualizationOnInputChange();
      saveSettings();
    });
  }
  
  // Initialize text start slider
  updateTextStartSlider();
  
  // Handle text start slider
  const textStartSlider = document.getElementById('textStartSlider') as HTMLInputElement;
  if (textStartSlider) {
    const textStartValue = document.getElementById('textStartValue');
    textStartSlider.addEventListener('input', () => {
      if (textStartValue) {
        textStartValue.textContent = textStartSlider.value;
      }
      updateVisualizationOnInputChange();
      saveSettings();
    });
    textStartSlider.addEventListener('change', () => {
      if (textStartValue) {
        textStartValue.textContent = textStartSlider.value;
      }
      updateVisualizationOnInputChange();
      saveSettings();
    });
  }
  
  // Handle number of columns change
  const numColsInput = document.getElementById('numCols') as HTMLInputElement;
  if (numColsInput) {
    numColsInput.addEventListener('input', () => {
      updateColumnSpanSlider();
      updateTextStartSlider();
      updateVisualizationOnInputChange();
      saveSettings();
    });
    numColsInput.addEventListener('change', () => {
      updateColumnSpanSlider();
      updateTextStartSlider();
      updateVisualizationOnInputChange();
      saveSettings();
    });
  }

  // Populate paper size dropdown
  populatePaperSizeDropdown();

  // Set gutter on load
  suggestGutter();

  // Get type size and leading inputs
  const typeSizeInput = document.getElementById('typeSize') as HTMLInputElement;
  const leadingInput = document.getElementById('leading') as HTMLInputElement;

  // Initialize leading to default value (type size + 2) if empty
  if (typeSizeInput && leadingInput && (!leadingInput.value || leadingInput.value === '')) {
    const typeSize = parseFloat(typeSizeInput.value);
    if (!isNaN(typeSize)) {
      leadingInput.value = (typeSize + 2).toFixed(1);
    }
  }

  // Recalculate gutter and words per line when type size changes
  if (typeSizeInput) {
    typeSizeInput.addEventListener('input', () => {
      suggestGutter();
      // Auto-update leading to type size + 2 if leading is empty
      if (leadingInput && (!leadingInput.value || leadingInput.value === '')) {
        const newTypeSize = parseFloat(typeSizeInput.value);
        leadingInput.value = (newTypeSize + 2).toFixed(1);
      }
      updateColumnWidthDisplay();
      updateWordsPerLine();
      updateMarginLabels();
      updateVisualizationOnInputChange();
      saveSettings();
    });
    typeSizeInput.addEventListener('change', () => {
      updateColumnWidthDisplay();
      updateWordsPerLine();
      updateMarginLabels();
      updateVisualizationOnInputChange();
      saveSettings();
    });
  }

  // Handle leading input
  if (leadingInput) {
    leadingInput.addEventListener('input', () => {
      updateVisualizationOnInputChange();
      saveSettings();
    });
    leadingInput.addEventListener('change', () => {
      updateVisualizationOnInputChange();
      saveSettings();
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
        applyPaperSize(target.value); // applyPaperSize already calls saveSettings
      } else {
        updateVisualizationOnInputChange();
        saveSettings();
      }
    });
  }
  
  // Handle custom page width/height inputs
  const pageWidthInput = document.getElementById('pageWidth') as HTMLInputElement;
  const pageHeightInput = document.getElementById('pageHeight') as HTMLInputElement;
  if (pageWidthInput && pageHeightInput) {
    const updateCustomSize = () => {
      if (paperSizeSelect) paperSizeSelect.value = ''; // Set to custom if dimensions are changed manually
      updateVisualizationOnInputChange();
      saveSettings();
    };
    pageWidthInput.addEventListener('input', updateCustomSize);
    pageWidthInput.addEventListener('change', updateCustomSize);
    pageHeightInput.addEventListener('input', updateCustomSize);
    pageHeightInput.addEventListener('change', updateCustomSize);
  }

  // Handle orientation toggle change
  const orientationToggle = document.getElementById('orientationToggle') as HTMLInputElement;
  if (orientationToggle) {
    orientationToggle.addEventListener('change', () => {
      // Update active state for icons
      updateOrientationToggleState();
      // If a paper size is selected, reapply it with new orientation
      if (paperSizeSelect && paperSizeSelect.value) {
        applyPaperSize(paperSizeSelect.value);
      } else {
        // Otherwise, swap current width and height
        updateOrientation();
        saveSettings();
      }
    });
  }

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
    fontFamilySelect.addEventListener('change', () => {
      updateVisualizationOnInputChange();
      saveSettings();
    });
  }

  // Handle hyphenation checkbox
  const hyphenationCheckbox = document.getElementById('hyphenation') as HTMLInputElement;
  if (hyphenationCheckbox) {
    hyphenationCheckbox.addEventListener('change', updateVisualizationOnInputChange);
  }

  // Initial visualization and words per line
  // Note: loadSettings() already triggers visualization updates after loading settings
  // Only update if no settings were loaded (first visit)
  const hasSavedSettings = localStorage.getItem('compositorSettings');
  if (!hasSavedSettings) {
    updateVisualizationOnInputChange();
    updateWordsPerLine();
  }

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
  
  // Initialize term modal (Verso/Recto)
  const termModal = document.getElementById('termModal') as HTMLElement;
  const termModalClose = document.getElementById('termModalClose') as HTMLElement;
  const termModalTitle = document.getElementById('termModalTitle') as HTMLElement;
  const termModalContent = document.getElementById('termModalContent') as HTMLElement;
  
  const termContent = `
    <div class="modal-section">
      <h3 class="modal-section-title">Verso</h3>
      <p class="modal-section-text">Verso refers to the left-hand page of an open book, typically an even-numbered page. In bookbinding terminology, verso means "the back of the leaf" and is the side that appears on the left when a book is open.</p>
      <p class="modal-section-text">In facing pages layouts, the verso page has its outer margin on the left edge and its inner margin (binding edge) on the right.</p>
    </div>
    <div class="modal-section">
      <h3 class="modal-section-title">Recto</h3>
      <p class="modal-section-text">Recto refers to the right-hand page of an open book, typically an odd-numbered page. In bookbinding terminology, recto means "the front of the leaf" and is the side that appears on the right when a book is open.</p>
      <p class="modal-section-text">In facing pages layouts, the recto page has its inner margin (binding edge) on the left and its outer margin on the right edge.</p>
    </div>
  `;
  
  // Add click handlers to page links
  const pageLinks = document.querySelectorAll('.page-link');
  pageLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      if (termModal && termModalTitle && termModalContent) {
        termModalTitle.textContent = 'Verso & Recto';
        termModalContent.innerHTML = termContent;
        termModal.classList.add('show');
      }
    });
  });
  
  if (termModalClose) {
    termModalClose.addEventListener('click', () => {
      if (termModal) termModal.classList.remove('show');
    });
  }
  
  // Close term modal when clicking outside
  if (termModal) {
    termModal.addEventListener('click', (e) => {
      if (e.target === termModal) {
        termModal.classList.remove('show');
      }
    });
  }
}

