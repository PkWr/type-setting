/**
 * UI Module for Typography Layout Calculator
 * Handles DOM manipulation and user interactions
 */

import { calculateGutterWidth, calculateLayout } from './calculator.js';
import { LayoutInputs, LayoutResults } from './types.js';
import { PAPER_SIZES, getPaperSize, getDefaultPaperSize, PaperSize } from './paperSizes.js';
import { updateVisualization } from './visualization.js';

/**
 * Gets all input values from the form
 * @returns LayoutInputs object with form values
 */
function getFormInputs(): LayoutInputs {
  return {
    pageWidth: parseFloat((document.getElementById('pageWidth') as HTMLInputElement).value),
    pageHeight: parseFloat((document.getElementById('pageHeight') as HTMLInputElement).value),
    leftMargin: parseFloat((document.getElementById('leftMargin') as HTMLInputElement).value),
    rightMargin: parseFloat((document.getElementById('rightMargin') as HTMLInputElement).value),
    topMargin: parseFloat((document.getElementById('topMargin') as HTMLInputElement).value),
    bottomMargin: parseFloat((document.getElementById('bottomMargin') as HTMLInputElement).value),
    typeSize: parseFloat((document.getElementById('typeSize') as HTMLInputElement).value),
    numCols: parseInt((document.getElementById('numCols') as HTMLInputElement).value, 10),
    gutterWidth: parseFloat((document.getElementById('gutterWidth') as HTMLInputElement).value),
  };
}

/**
 * Suggests and sets gutter width based on type size
 */
export function suggestGutter(): void {
  const typeSize = parseFloat((document.getElementById('typeSize') as HTMLInputElement).value);
  const autoGutter = calculateGutterWidth(typeSize);
  const gutterInput = document.getElementById('gutterWidth') as HTMLInputElement;
  const noteSpan = document.getElementById('autoGutterNote');

  gutterInput.value = autoGutter.toFixed(2);
  if (noteSpan) {
    noteSpan.textContent = '1em (based on type size)';
  }
}

/**
 * Calculates and displays layout results
 */
export function calcLayout(): void {
  const inputs = getFormInputs();
  const results = calculateLayout(inputs);
  displayResults(results);
  updateVisualization(inputs);
}

/**
 * Updates visualization when inputs change
 */
function updateVisualizationOnInputChange(): void {
  try {
    const inputs = getFormInputs();
    updateVisualization(inputs);
  } catch (e) {
    // Silently fail if inputs are invalid
  }
}

/**
 * Displays calculation results in the results div
 * @param results - Layout calculation results
 */
function displayResults(results: LayoutResults): void {
  const resultsDiv = document.getElementById('resultsContent');
  if (!resultsDiv) return;

  const res = `
    <ul>
      <li><b>Text box width:</b> ${results.textBoxWidth.toFixed(1)} mm</li>
      <li><b>Column width:</b> ${results.columnWidth.toFixed(1)} mm each</li>
      <li><b>Gutter width:</b> ${results.gutterWidth.toFixed(2)} mm</li>
      <li><b>Optimal column width (Bringhurst):</b> ${results.optimalColumnWidth.toFixed(1)} mm</li>
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

  const widthInput = document.getElementById('pageWidth') as HTMLInputElement;
  const heightInput = document.getElementById('pageHeight') as HTMLInputElement;

  if (widthInput) widthInput.value = size.width.toString();
  if (heightInput) heightInput.value = size.height.toString();
}

/**
 * Initializes the calculator UI
 */
export function initializeCalculator(): void {
  // Populate paper size dropdown
  populatePaperSizeDropdown();

  // Set gutter on load
  suggestGutter();

  // Attach event listeners
  const calcButton = document.getElementById('calcButton');
  if (calcButton) {
    calcButton.addEventListener('click', calcLayout);
  }

  const suggestGutterButton = document.getElementById('suggestGutterButton');
  if (suggestGutterButton) {
    suggestGutterButton.addEventListener('click', suggestGutter);
  }

  // Recalculate gutter when type size changes
  const typeSizeInput = document.getElementById('typeSize') as HTMLInputElement;
  if (typeSizeInput) {
    typeSizeInput.addEventListener('input', suggestGutter);
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

  // Initial visualization
  updateVisualizationOnInputChange();
}

