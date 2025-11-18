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
  fontFamily?: string; // Font family name
  numCols: number;
  gutterWidth: number;
  columnSpanStart?: number; // First column in span (1-indexed)
  columnSpanEnd?: number; // Last column in span (1-indexed)
  textColumns?: number[]; // Array of column indices where text appears (1-indexed)
  // Facing pages specific margins (optional)
  innerMarginLeft?: number; // Inner margin for left page (binding edge)
  innerMarginRight?: number; // Inner margin for right page (binding edge)
  outerMarginLeft?: number; // Outer margin for left page
  outerMarginRight?: number; // Outer margin for right page
}

export interface LayoutResults {
  textBoxWidth: number;
  columnWidth: number;
  gutterWidth: number;
  optimalColumnWidth: number;
}

