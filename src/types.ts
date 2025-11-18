/**
 * Type definitions for Typography Layout Calculator
 */

export interface LayoutInputs {
  pageWidth: number;
  pageHeight: number;
  leftMargin: number;
  rightMargin: number;
  topMargin: number;
  bottomMargin: number;
  typeSize: number;
  numCols: number;
  gutterWidth: number;
}

export interface LayoutResults {
  textBoxWidth: number;
  columnWidth: number;
  gutterWidth: number;
  optimalColumnWidth: number;
}

