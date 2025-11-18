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
  const textBoxWidth = inputs.pageWidth - inputs.leftMargin - inputs.rightMargin;
  const totalGutterWidth = (inputs.numCols - 1) * inputs.gutterWidth;
  const columnWidth = (textBoxWidth - totalGutterWidth) / inputs.numCols;
  const optimalColumnWidth = BRINGHURST_COLUMN_MULTIPLIER * inputs.typeSize * PT_TO_MM;

  return {
    textBoxWidth,
    columnWidth,
    gutterWidth: inputs.gutterWidth,
    optimalColumnWidth,
  };
}

