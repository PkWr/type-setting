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
  const gutterWidth = parseFloat((document.getElementById('gutterWidth') as HTMLInputElement).value);

  return {
    pageWidth: convertToMM(pageWidth, unit, typeSize),
    pageHeight: convertToMM(pageHeight, unit, typeSize),
    leftMargin: convertToMM(leftMargin, unit, typeSize),
    rightMargin: convertToMM(rightMargin, unit, typeSize),
    topMargin: convertToMM(topMargin, unit, typeSize),
    bottomMargin: convertToMM(bottomMargin, unit, typeSize),
    typeSize, // Type size is always in points
    numCols: parseInt((document.getElementById('numCols') as HTMLInputElement).value, 10),
    gutterWidth: convertToMM(gutterWidth, unit, typeSize),
  };
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
    const wordsPerLine = calculateWordsPerLine(results.columnWidth, inputs.typeSize);
    
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
 * Applies a paper size to the width and height inputs
 * @param paperSizeName - Name of the paper size to apply
 */
function applyPaperSize(paperSizeName: string): void {
  const size = getPaperSize(paperSizeName);
  if (!size) return;

  const unit = getCurrentUnit();
  const typeSize = parseFloat((document.getElementById('typeSize') as HTMLInputElement).value);
  
  // Convert from mm to selected unit
  const width = convertFromMM(size.width, unit, typeSize);
  const height = convertFromMM(size.height, unit, typeSize);

  const widthInput = document.getElementById('pageWidth') as HTMLInputElement;
  const heightInput = document.getElementById('pageHeight') as HTMLInputElement;

  const decimals = unit === 'em' ? 3 : 2;
  if (widthInput) widthInput.value = width.toFixed(decimals);
  if (heightInput) heightInput.value = height.toFixed(decimals);
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

  // Handle load default text button
  const loadDefaultTextButton = document.getElementById('loadDefaultTextButton');
  if (loadDefaultTextButton && sampleTextInput) {
    loadDefaultTextButton.addEventListener('click', () => {
      sampleTextInput.value = DEFAULT_SAMPLE_TEXT;
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

  // Handle paper size selection
  const paperSizeSelect = document.getElementById('paperSizeSelect') as HTMLSelectElement;
  if (paperSizeSelect) {
    paperSizeSelect.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      if (target.value) {
        applyPaperSize(target.value);
      }
      updateVisualizationOnInputChange();
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

  // Initial visualization and words per line
  updateVisualizationOnInputChange();
  updateWordsPerLine();
}

