/**
 * Typography Layout Calculator Module
 * Handles calculations for typographic layouts based on Bringhurst principles
 */

import { LayoutInputs, LayoutResults } from './types.js';

const PT_TO_MM = 0.3528; // 1 point = 0.3528 mm
const BRINGHURST_COLUMN_MULTIPLIER = 33; // Multiplier for optimal column width calculation

/**
 * Calculates the optimal gutter width based on type size (1em)
 * @param typeSize - Type size in points
 * @returns Gutter width in millimeters
 */
export function calculateGutterWidth(typeSize: number): number {
  return typeSize * PT_TO_MM;
}

/**
 * Calculates layout dimensions based on input parameters
 * @param inputs - Layout input parameters
 * @returns Calculated layout results
 */
export function calculateLayout(inputs: LayoutInputs): LayoutResults {
  // Calculate full text box width (all columns)
  const fullTextBoxWidth = inputs.pageWidth - inputs.leftMargin - inputs.rightMargin;
  const totalGutterWidth = (inputs.numCols - 1) * inputs.gutterWidth;
  const columnWidth = (fullTextBoxWidth - totalGutterWidth) / inputs.numCols;
  
  // Calculate actual text box width based on column span
  let textBoxWidth = fullTextBoxWidth;
  if (inputs.columnSpanStart && inputs.columnSpanEnd) {
    const spanCols = inputs.columnSpanEnd - inputs.columnSpanStart + 1;
    const spanGutters = spanCols - 1;
    textBoxWidth = (columnWidth * spanCols) + (inputs.gutterWidth * spanGutters);
  }
  
  const optimalColumnWidth = BRINGHURST_COLUMN_MULTIPLIER * inputs.typeSize * PT_TO_MM;

  return {
    textBoxWidth,
    columnWidth,
    gutterWidth: inputs.gutterWidth,
    optimalColumnWidth,
  };
}

/**
 * Calculates the width of a column span
 * @param inputs - Layout input parameters
 * @returns Width of the spanned columns in millimeters
 */
export function calculateColumnSpanWidth(inputs: LayoutInputs): number {
  const textBoxWidth = inputs.pageWidth - inputs.leftMargin - inputs.rightMargin;
  const totalGutterWidth = (inputs.numCols - 1) * inputs.gutterWidth;
  const columnWidth = (textBoxWidth - totalGutterWidth) / inputs.numCols;
  
  if (inputs.columnSpanStart && inputs.columnSpanEnd) {
    const spanCols = inputs.columnSpanEnd - inputs.columnSpanStart + 1;
    const spanGutters = spanCols - 1;
    return (columnWidth * spanCols) + (inputs.gutterWidth * spanGutters);
  }
  
  return textBoxWidth;
}

