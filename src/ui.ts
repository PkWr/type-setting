/**
 * UI Module for Typography Layout Calculator
 * Handles DOM manipulation and user interactions
 */

import { calculateGutterWidth, calculateLayout } from './calculator';
import { LayoutInputs, LayoutResults } from './types';

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
 * Initializes the calculator UI
 */
export function initializeCalculator(): void {
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
}

