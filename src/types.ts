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
  columnSpanStart?: number; // First column in span (1-indexed)
  columnSpanEnd?: number; // Last column in span (1-indexed)
  textColumns?: number[]; // Array of column indices where text appears (1-indexed)
}

export interface LayoutResults {
  textBoxWidth: number;
  columnWidth: number;
  gutterWidth: number;
  optimalColumnWidth: number;
}

