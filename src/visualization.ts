/**
 * Visualization Module for Typography Layout Calculator
 * Creates SVG-based visual representation of page layout
 */

import { LayoutInputs } from './types.js';
import { calculateLayout } from './calculator.js';
import { Unit, convertFromMM, formatValue } from './units.js';

/**
 * Gets sample text from textarea
 */
function getSampleText(): string {
  const sampleTextInput = document.getElementById('sampleText') as HTMLTextAreaElement;
  return sampleTextInput?.value.trim() || '';
}

/**
 * Gets layer visibility states from checkboxes
 */
function getLayerVisibility(): { margins: boolean; columns: boolean; text: boolean } {
  const showMargins = (document.getElementById('showMargins') as HTMLInputElement)?.checked ?? true;
  const showColumns = (document.getElementById('showColumns') as HTMLInputElement)?.checked ?? true;
  const showText = (document.getElementById('showText') as HTMLInputElement)?.checked ?? true;
  return { margins: showMargins, columns: showColumns, text: showText };
}

/**
 * Gets the currently selected unit
 */
function getCurrentUnit(): Unit {
  const unitSelect = document.getElementById('unitSelect') as HTMLSelectElement;
  return (unitSelect?.value as Unit) || 'mm';
}

const VISUALIZATION_SIZE = 400; // Maximum size for the visualization in pixels
const MIN_MARGIN_VISUAL = 2; // Minimum margin size in pixels for visibility

/**
 * Checks if facing pages mode is enabled
 */
function isFacingPages(): boolean {
  const checkbox = document.getElementById('facingPages') as HTMLInputElement;
  return checkbox?.checked || false;
}

/**
 * Updates the page layout visualization
 * @param inputs - Layout input parameters
 */
export function updateVisualization(inputs: LayoutInputs): void {
  const container = document.getElementById('visualizationContainer');
  if (!container) return;

  const facingPages = isFacingPages();
  const results = calculateLayout(inputs);
  const layerVisibility = getLayerVisibility();
  const unit = getCurrentUnit();
  const typeSize = inputs.typeSize;

  // Calculate scale to fit visualization
  const aspectRatio = inputs.pageHeight / inputs.pageWidth;
  let singlePageWidth: number;
  let singlePageHeight: number;

  if (aspectRatio > 1) {
    // Portrait orientation
    singlePageHeight = VISUALIZATION_SIZE;
    singlePageWidth = VISUALIZATION_SIZE / aspectRatio;
  } else {
    // Landscape orientation
    singlePageWidth = VISUALIZATION_SIZE;
    singlePageHeight = VISUALIZATION_SIZE * aspectRatio;
  }

  // For facing pages, show two pages side by side
  const gapBetweenPages = 20;
  const measurementPadding = 50; // Space for measurements around the page
  const visWidth = facingPages ? singlePageWidth * 2 + gapBetweenPages : singlePageWidth;
  const visHeight = singlePageHeight;
  
  // Expanded dimensions including measurement padding
  const svgWidth = visWidth + (measurementPadding * 2);
  const svgHeight = visHeight + (measurementPadding * 2);
  const pageOffsetX = measurementPadding;
  const pageOffsetY = measurementPadding;

  // Calculate scaled dimensions (scale based on single page)
  const scaleX = singlePageWidth / inputs.pageWidth;
  const scaleY = singlePageHeight / inputs.pageHeight;

  // Calculate scaled margins
  const scaledTopMargin = Math.max(inputs.topMargin * scaleY, MIN_MARGIN_VISUAL);
  const scaledBottomMargin = Math.max(inputs.bottomMargin * scaleY, MIN_MARGIN_VISUAL);
  const scaledLeftMargin = Math.max(inputs.leftMargin * scaleX, MIN_MARGIN_VISUAL);
  const scaledRightMargin = Math.max(inputs.rightMargin * scaleX, MIN_MARGIN_VISUAL);

  // For facing pages: left page uses leftMargin as outer, rightMargin as inner
  // Right page uses leftMargin as inner, rightMargin as outer
  const leftPageOuterMargin = facingPages ? scaledRightMargin : scaledLeftMargin;
  const leftPageInnerMargin = facingPages ? scaledLeftMargin : scaledRightMargin;
  const rightPageOuterMargin = facingPages ? scaledLeftMargin : scaledRightMargin;
  const rightPageInnerMargin = facingPages ? scaledRightMargin : scaledLeftMargin;

  // Create SVG
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.classList.add('page-visualization');

  // Draw pages
  if (facingPages) {
    // Left page (even/left page)
    const leftPageX = pageOffsetX;
    const leftPageTextX = leftPageX + leftPageOuterMargin;
    const leftPageTextWidth = singlePageWidth - leftPageOuterMargin - leftPageInnerMargin;
    
    // Right page (odd/right page)
    const rightPageX = pageOffsetX + singlePageWidth + gapBetweenPages;
    const rightPageTextX = rightPageX + rightPageInnerMargin;
    const rightPageTextWidth = singlePageWidth - rightPageInnerMargin - rightPageOuterMargin;

    // Draw left page
    const leftPageRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    leftPageRect.setAttribute('x', leftPageX.toString());
    leftPageRect.setAttribute('y', pageOffsetY.toString());
    leftPageRect.setAttribute('width', singlePageWidth.toString());
    leftPageRect.setAttribute('height', visHeight.toString());
    leftPageRect.setAttribute('fill', '#ffffff');
    leftPageRect.setAttribute('stroke', '#1e293b');
    leftPageRect.setAttribute('stroke-width', '2');
    svg.appendChild(leftPageRect);

    // Draw right page
    const rightPageRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rightPageRect.setAttribute('x', rightPageX.toString());
    rightPageRect.setAttribute('y', pageOffsetY.toString());
    rightPageRect.setAttribute('width', singlePageWidth.toString());
    rightPageRect.setAttribute('height', visHeight.toString());
    rightPageRect.setAttribute('fill', '#ffffff');
    rightPageRect.setAttribute('stroke', '#1e293b');
    rightPageRect.setAttribute('stroke-width', '2');
    svg.appendChild(rightPageRect);

    // Draw margins for left page
    if (layerVisibility.margins) {
      const leftMarginPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      leftMarginPath.setAttribute('d', `
        M ${leftPageX},${pageOffsetY} L ${leftPageX + singlePageWidth},${pageOffsetY} L ${leftPageX + singlePageWidth},${pageOffsetY + visHeight} L ${leftPageX},${pageOffsetY + visHeight} Z
        M ${leftPageX + leftPageOuterMargin},${pageOffsetY + scaledTopMargin}
        L ${leftPageX + singlePageWidth - leftPageInnerMargin},${pageOffsetY + scaledTopMargin}
        L ${leftPageX + singlePageWidth - leftPageInnerMargin},${pageOffsetY + visHeight - scaledBottomMargin}
        L ${leftPageX + leftPageOuterMargin},${pageOffsetY + visHeight - scaledBottomMargin} Z
      `);
      leftMarginPath.setAttribute('fill', '#f1f5f9');
      leftMarginPath.setAttribute('fill-rule', 'evenodd');
      svg.appendChild(leftMarginPath);
    }

    // Draw margins for right page
    if (layerVisibility.margins) {
      const rightMarginPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      rightMarginPath.setAttribute('d', `
        M ${rightPageX},${pageOffsetY} L ${rightPageX + singlePageWidth},${pageOffsetY} L ${rightPageX + singlePageWidth},${pageOffsetY + visHeight} L ${rightPageX},${pageOffsetY + visHeight} Z
        M ${rightPageX + rightPageInnerMargin},${pageOffsetY + scaledTopMargin}
        L ${rightPageX + singlePageWidth - rightPageOuterMargin},${pageOffsetY + scaledTopMargin}
        L ${rightPageX + singlePageWidth - rightPageOuterMargin},${pageOffsetY + visHeight - scaledBottomMargin}
        L ${rightPageX + rightPageInnerMargin},${pageOffsetY + visHeight - scaledBottomMargin} Z
      `);
      rightMarginPath.setAttribute('fill', '#f1f5f9');
      rightMarginPath.setAttribute('fill-rule', 'evenodd');
      svg.appendChild(rightMarginPath);
    }

    // Text box outlines are now drawn within drawColumns function

    // Draw columns for both pages
    const drawColumns = (pageTextX: number, pageTextWidth: number) => {
      const textBoxHeight = visHeight - scaledTopMargin - scaledBottomMargin;
      const scaledGutterWidth = inputs.gutterWidth * scaleX;
      const totalGutters = (inputs.numCols - 1) * scaledGutterWidth;
      const availableWidth = pageTextWidth - totalGutters;
      const actualColumnWidth = availableWidth / inputs.numCols;
      const sampleText = getSampleText();
      const words = sampleText ? sampleText.split(/\s+/) : [];
      
      // Calculate font size in SVG units (scaled)
      // Convert typeSize from points to mm (1pt = 0.3528mm), then scale by scaleY
      const typeSizeMM = inputs.typeSize * 0.3528;
      const fontSizeSVG = typeSizeMM * scaleY;
      const lineHeight = fontSizeSVG * 1.5;
      const padding = fontSizeSVG * 0.5;

      // Determine column span
      const columnSpanStart = inputs.columnSpanStart || 1;
      const columnSpanEnd = inputs.columnSpanEnd || inputs.numCols;
      const spanCols = columnSpanEnd - columnSpanStart + 1;
      
      // Get text columns (which columns text appears in)
      const textColumns = inputs.textColumns || [];
      const textColsCount = textColumns.length > 0 ? textColumns.length : spanCols;
      const wordsPerTextColumn = words.length > 0 ? Math.ceil(words.length / textColsCount) : 0;
      
      // Calculate text box position and width based on span
      const spanStartIndex = columnSpanStart - 1; // Convert to 0-indexed
      const spanTextBoxX = pageTextX + (spanStartIndex * (actualColumnWidth + scaledGutterWidth));
      const spanTextBoxWidth = (actualColumnWidth * spanCols) + (scaledGutterWidth * (spanCols - 1));
      
      // Draw text box outline for span
      const spanTextBoxRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      spanTextBoxRect.setAttribute('x', spanTextBoxX.toString());
      spanTextBoxRect.setAttribute('y', (pageOffsetY + scaledTopMargin).toString());
      spanTextBoxRect.setAttribute('width', spanTextBoxWidth.toString());
      spanTextBoxRect.setAttribute('height', textBoxHeight.toString());
      spanTextBoxRect.setAttribute('fill', 'none');
      spanTextBoxRect.setAttribute('stroke', '#64748b');
      spanTextBoxRect.setAttribute('stroke-width', '1.5');
      spanTextBoxRect.setAttribute('stroke-dasharray', '4,2');
      svg.appendChild(spanTextBoxRect);
      
      // Draw all columns (for reference)
      for (let i = 0; i < inputs.numCols; i++) {
        const colIndex = i + 1; // 1-indexed
        const colX = pageTextX + (i * (actualColumnWidth + scaledGutterWidth));
        const isInSpan = colIndex >= columnSpanStart && colIndex <= columnSpanEnd;
        const hasText = textColumns.length === 0 ? isInSpan : textColumns.includes(colIndex);
        
        if (layerVisibility.columns) {
          const colRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          colRect.setAttribute('x', colX.toString());
          colRect.setAttribute('y', (pageOffsetY + scaledTopMargin).toString());
          colRect.setAttribute('width', actualColumnWidth.toString());
          colRect.setAttribute('height', textBoxHeight.toString());
          colRect.setAttribute('fill', '#e0e7ff');
          colRect.setAttribute('stroke', '#2563eb');
          colRect.setAttribute('stroke-width', '1');
          colRect.setAttribute('opacity', isInSpan ? (hasText ? '0.6' : '0.4') : '0.2');
          svg.appendChild(colRect);
        }

        // Add text to column if sample text exists and column has text
        if (layerVisibility.text && words.length > 0 && hasText && isInSpan) {
          // Find index within text columns
          const textColIndex = textColumns.length > 0 
            ? textColumns.indexOf(colIndex)
            : colIndex - columnSpanStart;
          const startIdx = textColIndex * wordsPerTextColumn;
          const endIdx = Math.min(startIdx + wordsPerTextColumn, words.length);
          const columnWords = words.slice(startIdx, endIdx);
          
          // Create text element with wrapping
          const textGroup = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
          textGroup.setAttribute('x', (colX + padding).toString());
          textGroup.setAttribute('y', (pageOffsetY + scaledTopMargin + padding).toString());
          textGroup.setAttribute('width', (actualColumnWidth - padding * 2).toString());
          textGroup.setAttribute('height', (textBoxHeight - padding * 2).toString());
          
          const textDiv = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
          textDiv.style.fontSize = `${fontSizeSVG}px`;
          textDiv.style.lineHeight = `${lineHeight}px`;
          textDiv.style.fontFamily = 'serif';
          textDiv.style.color = '#1e293b';
          textDiv.style.width = '100%';
          textDiv.style.height = '100%';
          textDiv.style.overflow = 'hidden';
          textDiv.style.wordWrap = 'break-word';
          textDiv.style.hyphens = 'auto';
          textDiv.textContent = columnWords.join(' ');
          
          textGroup.appendChild(textDiv);
          svg.appendChild(textGroup);
        }

        if (layerVisibility.columns && i < inputs.numCols - 1) {
          const dividerX = colX + actualColumnWidth;
          const divider = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          divider.setAttribute('x1', dividerX.toString());
          divider.setAttribute('y1', (pageOffsetY + scaledTopMargin).toString());
          divider.setAttribute('x2', dividerX.toString());
          divider.setAttribute('y2', (pageOffsetY + scaledTopMargin + textBoxHeight).toString());
          divider.setAttribute('stroke', '#2563eb');
          divider.setAttribute('stroke-width', '2');
          divider.setAttribute('stroke-dasharray', '3,3');
          divider.setAttribute('opacity', isInSpan ? '1' : '0.3');
          svg.appendChild(divider);
        }
      }
    };

    drawColumns(leftPageTextX, leftPageTextWidth);
    drawColumns(rightPageTextX, rightPageTextWidth);

    // Add measurements for facing pages
    const measurementOffset = 12;
    
    /**
     * Adds a measurement line with label
     */
    const addMeasurement = (x1: number, y1: number, x2: number, y2: number, value: number, unit: Unit, offset: number = 8) => {
      const isHorizontal = Math.abs(y2 - y1) < Math.abs(x2 - x1);
      const lineColor = '#94a3b8';
      const lineWidth = 1;
      
      // Draw measurement line
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1.toString());
      line.setAttribute('y1', y1.toString());
      line.setAttribute('x2', x2.toString());
      line.setAttribute('y2', y2.toString());
      line.setAttribute('stroke', lineColor);
      line.setAttribute('stroke-width', lineWidth.toString());
      svg.appendChild(line);
      
      // Draw tick marks
      const tickLength = 4;
      if (isHorizontal) {
        // Top tick
        const topTick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        topTick.setAttribute('x1', x1.toString());
        topTick.setAttribute('y1', (y1 - offset).toString());
        topTick.setAttribute('x2', x1.toString());
        topTick.setAttribute('y2', (y1 - offset + tickLength).toString());
        topTick.setAttribute('stroke', lineColor);
        topTick.setAttribute('stroke-width', lineWidth.toString());
        svg.appendChild(topTick);
        
        // Bottom tick
        const bottomTick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        bottomTick.setAttribute('x1', x2.toString());
        bottomTick.setAttribute('y1', (y1 - offset).toString());
        bottomTick.setAttribute('x2', x2.toString());
        bottomTick.setAttribute('y2', (y1 - offset + tickLength).toString());
        bottomTick.setAttribute('stroke', lineColor);
        bottomTick.setAttribute('stroke-width', lineWidth.toString());
        svg.appendChild(bottomTick);
        
        // Label
        const labelX = (x1 + x2) / 2;
        const labelY = y1 - offset - 2;
        const decimals = unit === 'em' ? 3 : unit === 'mm' ? 1 : 2;
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', labelX.toString());
        label.setAttribute('y', labelY.toString());
        label.setAttribute('font-size', '10');
        label.setAttribute('font-family', 'sans-serif');
        label.setAttribute('fill', '#64748b');
        label.setAttribute('text-anchor', 'middle');
        label.textContent = `${formatValue(value, unit, decimals)}`;
        svg.appendChild(label);
      } else {
        // Left tick
        const leftTick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        leftTick.setAttribute('x1', (x1 - offset).toString());
        leftTick.setAttribute('y1', y1.toString());
        leftTick.setAttribute('x2', (x1 - offset + tickLength).toString());
        leftTick.setAttribute('y2', y1.toString());
        leftTick.setAttribute('stroke', lineColor);
        leftTick.setAttribute('stroke-width', lineWidth.toString());
        svg.appendChild(leftTick);
        
        // Right tick
        const rightTick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        rightTick.setAttribute('x1', (x1 - offset).toString());
        rightTick.setAttribute('y1', y2.toString());
        rightTick.setAttribute('x2', (x1 - offset + tickLength).toString());
        rightTick.setAttribute('y2', y2.toString());
        rightTick.setAttribute('stroke', lineColor);
        rightTick.setAttribute('stroke-width', lineWidth.toString());
        svg.appendChild(rightTick);
        
        // Label
        const labelX = x1 - offset - 2;
        const labelY = (y1 + y2) / 2;
        const decimals = unit === 'em' ? 3 : unit === 'mm' ? 1 : 2;
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', labelX.toString());
        label.setAttribute('y', labelY.toString());
        label.setAttribute('font-size', '10');
        label.setAttribute('font-family', 'sans-serif');
        label.setAttribute('fill', '#64748b');
        label.setAttribute('text-anchor', 'end');
        label.setAttribute('dominant-baseline', 'middle');
        label.textContent = `${formatValue(value, unit, decimals)}`;
        svg.appendChild(label);
      }
    };
    
    // Page width measurements (adjusted for pageOffset)
    addMeasurement(leftPageX, pageOffsetY - measurementOffset, leftPageX + singlePageWidth, pageOffsetY - measurementOffset, 
      convertFromMM(inputs.pageWidth, unit, typeSize), unit);
    addMeasurement(rightPageX, pageOffsetY - measurementOffset, rightPageX + singlePageWidth, pageOffsetY - measurementOffset,
      convertFromMM(inputs.pageWidth, unit, typeSize), unit);
    
    // Page height measurements
    addMeasurement(pageOffsetX - measurementOffset, pageOffsetY, pageOffsetX - measurementOffset, pageOffsetY + visHeight,
      convertFromMM(inputs.pageHeight, unit, typeSize), unit);
    
    // Margin measurements (left page)
    addMeasurement(leftPageX, pageOffsetY + scaledTopMargin - measurementOffset, leftPageX + leftPageOuterMargin, pageOffsetY + scaledTopMargin - measurementOffset,
      convertFromMM(inputs.rightMargin, unit, typeSize), unit);
    addMeasurement(leftPageX + singlePageWidth - leftPageInnerMargin, pageOffsetY + scaledTopMargin - measurementOffset, leftPageX + singlePageWidth, pageOffsetY + scaledTopMargin - measurementOffset,
      convertFromMM(inputs.leftMargin, unit, typeSize), unit);
    
    // Margin measurements (right page)
    addMeasurement(rightPageX, pageOffsetY + scaledTopMargin - measurementOffset, rightPageX + rightPageInnerMargin, pageOffsetY + scaledTopMargin - measurementOffset,
      convertFromMM(inputs.leftMargin, unit, typeSize), unit);
    addMeasurement(rightPageX + singlePageWidth - rightPageOuterMargin, pageOffsetY + scaledTopMargin - measurementOffset, rightPageX + singlePageWidth, pageOffsetY + scaledTopMargin - measurementOffset,
      convertFromMM(inputs.rightMargin, unit, typeSize), unit);
    
    // Top margin
    addMeasurement(pageOffsetX - measurementOffset, pageOffsetY, pageOffsetX - measurementOffset, pageOffsetY + scaledTopMargin,
      convertFromMM(inputs.topMargin, unit, typeSize), unit);
    
    // Bottom margin
    addMeasurement(pageOffsetX - measurementOffset, pageOffsetY + visHeight - scaledBottomMargin, pageOffsetX - measurementOffset, pageOffsetY + visHeight,
      convertFromMM(inputs.bottomMargin, unit, typeSize), unit);

  } else {
    // Single page mode (existing code)
    const fullTextBoxX = pageOffsetX + scaledLeftMargin;
    const textBoxY = pageOffsetY + scaledTopMargin;
    const fullTextBoxWidth = singlePageWidth - scaledLeftMargin - scaledRightMargin;
    const textBoxHeight = visHeight - scaledTopMargin - scaledBottomMargin;

    // Page background
    const pageRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    pageRect.setAttribute('x', pageOffsetX.toString());
    pageRect.setAttribute('y', pageOffsetY.toString());
    pageRect.setAttribute('width', singlePageWidth.toString());
    pageRect.setAttribute('height', visHeight.toString());
    pageRect.setAttribute('fill', '#ffffff');
    pageRect.setAttribute('stroke', '#1e293b');
    pageRect.setAttribute('stroke-width', '2');
    svg.appendChild(pageRect);

    // Margins area
    if (layerVisibility.margins) {
      const marginPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      marginPath.setAttribute('d', `
        M ${pageOffsetX},${pageOffsetY} L ${pageOffsetX + singlePageWidth},${pageOffsetY} L ${pageOffsetX + singlePageWidth},${pageOffsetY + visHeight} L ${pageOffsetX},${pageOffsetY + visHeight} Z
        M ${pageOffsetX + scaledLeftMargin},${pageOffsetY + scaledTopMargin}
        L ${pageOffsetX + singlePageWidth - scaledRightMargin},${pageOffsetY + scaledTopMargin}
        L ${pageOffsetX + singlePageWidth - scaledRightMargin},${pageOffsetY + visHeight - scaledBottomMargin}
        L ${pageOffsetX + scaledLeftMargin},${pageOffsetY + visHeight - scaledBottomMargin} Z
      `);
      marginPath.setAttribute('fill', '#f1f5f9');
      marginPath.setAttribute('fill-rule', 'evenodd');
      svg.appendChild(marginPath);
    }

    // Columns
    const scaledGutterWidth = inputs.gutterWidth * scaleX;
    const totalGutters = (inputs.numCols - 1) * scaledGutterWidth;
    const availableWidth = fullTextBoxWidth - totalGutters;
    const actualColumnWidth = availableWidth / inputs.numCols;
    const sampleText = getSampleText();
    const words = sampleText ? sampleText.split(/\s+/) : [];
    
    // Calculate font size in SVG units (scaled)
    // Convert typeSize from points to mm (1pt = 0.3528mm), then scale by scaleY
    const typeSizeMM = inputs.typeSize * 0.3528;
    const fontSizeSVG = typeSizeMM * scaleY;
    const lineHeight = fontSizeSVG * 1.5;
    const padding = fontSizeSVG * 0.5;

    // Determine column span
    const columnSpanStart = inputs.columnSpanStart || 1;
    const columnSpanEnd = inputs.columnSpanEnd || inputs.numCols;
    const spanCols = columnSpanEnd - columnSpanStart + 1;
    
    // Get text columns (which columns text appears in)
    const textColumns = inputs.textColumns || [];
    const textColsCount = textColumns.length > 0 ? textColumns.length : spanCols;
    const wordsPerTextColumn = words.length > 0 ? Math.ceil(words.length / textColsCount) : 0;
    
    // Calculate text box position and width based on span
    const spanStartIndex = columnSpanStart - 1; // Convert to 0-indexed
    const textBoxX = fullTextBoxX + (spanStartIndex * (actualColumnWidth + scaledGutterWidth));
    const textBoxWidth = (actualColumnWidth * spanCols) + (scaledGutterWidth * (spanCols - 1));
    
    // Draw text box outline for span
    const textBoxRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    textBoxRect.setAttribute('x', textBoxX.toString());
    textBoxRect.setAttribute('y', textBoxY.toString());
    textBoxRect.setAttribute('width', textBoxWidth.toString());
    textBoxRect.setAttribute('height', textBoxHeight.toString());
    textBoxRect.setAttribute('fill', 'none');
    textBoxRect.setAttribute('stroke', '#64748b');
    textBoxRect.setAttribute('stroke-width', '1.5');
    textBoxRect.setAttribute('stroke-dasharray', '4,2');
    svg.appendChild(textBoxRect);
    
    // Draw all columns (for reference)
    for (let i = 0; i < inputs.numCols; i++) {
      const colIndex = i + 1; // 1-indexed
      const colX = fullTextBoxX + (i * (actualColumnWidth + scaledGutterWidth));
      const isInSpan = colIndex >= columnSpanStart && colIndex <= columnSpanEnd;
      const hasText = textColumns.length === 0 ? isInSpan : textColumns.includes(colIndex);
      
      if (layerVisibility.columns) {
        const colRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        colRect.setAttribute('x', colX.toString());
        colRect.setAttribute('y', textBoxY.toString());
        colRect.setAttribute('width', actualColumnWidth.toString());
        colRect.setAttribute('height', textBoxHeight.toString());
        colRect.setAttribute('fill', '#e0e7ff');
        colRect.setAttribute('stroke', '#2563eb');
        colRect.setAttribute('stroke-width', '1');
        colRect.setAttribute('opacity', isInSpan ? (hasText ? '0.6' : '0.4') : '0.2');
        svg.appendChild(colRect);
      }

      // Add text to column if sample text exists and column has text
      if (layerVisibility.text && words.length > 0 && hasText && isInSpan) {
        // Find index within text columns
        const textColIndex = textColumns.length > 0 
          ? textColumns.indexOf(colIndex)
          : colIndex - columnSpanStart;
        const startIdx = textColIndex * wordsPerTextColumn;
        const endIdx = Math.min(startIdx + wordsPerTextColumn, words.length);
        const columnWords = words.slice(startIdx, endIdx);
        
        // Create text element with wrapping
        const textGroup = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
        textGroup.setAttribute('x', (colX + padding).toString());
        textGroup.setAttribute('y', (textBoxY + padding).toString());
        textGroup.setAttribute('width', (actualColumnWidth - padding * 2).toString());
        textGroup.setAttribute('height', (textBoxHeight - padding * 2).toString());
        
        const textDiv = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
        textDiv.style.fontSize = `${fontSizeSVG}px`;
        textDiv.style.lineHeight = `${lineHeight}px`;
        textDiv.style.fontFamily = 'serif';
        textDiv.style.color = '#1e293b';
        textDiv.style.width = '100%';
        textDiv.style.height = '100%';
        textDiv.style.overflow = 'hidden';
        textDiv.style.wordWrap = 'break-word';
        textDiv.style.hyphens = 'auto';
        textDiv.textContent = columnWords.join(' ');
        
        textGroup.appendChild(textDiv);
        svg.appendChild(textGroup);
      }

      if (layerVisibility.columns && i < inputs.numCols - 1) {
        const dividerX = colX + actualColumnWidth;
        const divider = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        divider.setAttribute('x1', dividerX.toString());
        divider.setAttribute('y1', textBoxY.toString());
        divider.setAttribute('x2', dividerX.toString());
        divider.setAttribute('y2', (textBoxY + textBoxHeight).toString());
        divider.setAttribute('stroke', '#2563eb');
        divider.setAttribute('stroke-width', '2');
        divider.setAttribute('stroke-dasharray', '3,3');
        divider.setAttribute('opacity', isInSpan ? '1' : '0.3');
        svg.appendChild(divider);
      }
    }
    
    // Add measurements for single page
    const measurementOffset = 15;
    
    /**
     * Adds a measurement line with label
     */
    const addMeasurement = (x1: number, y1: number, x2: number, y2: number, value: number, unit: Unit, offset: number = 8) => {
      const isHorizontal = Math.abs(y2 - y1) < Math.abs(x2 - x1);
      const lineColor = '#94a3b8';
      const lineWidth = 1;
      
      // Draw measurement line
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1.toString());
      line.setAttribute('y1', y1.toString());
      line.setAttribute('x2', x2.toString());
      line.setAttribute('y2', y2.toString());
      line.setAttribute('stroke', lineColor);
      line.setAttribute('stroke-width', lineWidth.toString());
      svg.appendChild(line);
      
      // Draw tick marks
      const tickLength = 4;
      if (isHorizontal) {
        // Top tick
        const topTick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        topTick.setAttribute('x1', x1.toString());
        topTick.setAttribute('y1', (y1 - offset).toString());
        topTick.setAttribute('x2', x1.toString());
        topTick.setAttribute('y2', (y1 - offset + tickLength).toString());
        topTick.setAttribute('stroke', lineColor);
        topTick.setAttribute('stroke-width', lineWidth.toString());
        svg.appendChild(topTick);
        
        // Bottom tick
        const bottomTick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        bottomTick.setAttribute('x1', x2.toString());
        bottomTick.setAttribute('y1', (y1 - offset).toString());
        bottomTick.setAttribute('x2', x2.toString());
        bottomTick.setAttribute('y2', (y1 - offset + tickLength).toString());
        bottomTick.setAttribute('stroke', lineColor);
        bottomTick.setAttribute('stroke-width', lineWidth.toString());
        svg.appendChild(bottomTick);
        
        // Label
        const labelX = (x1 + x2) / 2;
        const labelY = y1 - offset - 2;
        const decimals = unit === 'em' ? 3 : unit === 'mm' ? 1 : 2;
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', labelX.toString());
        label.setAttribute('y', labelY.toString());
        label.setAttribute('font-size', '10');
        label.setAttribute('font-family', 'sans-serif');
        label.setAttribute('fill', '#64748b');
        label.setAttribute('text-anchor', 'middle');
        label.textContent = `${formatValue(value, unit, decimals)}`;
        svg.appendChild(label);
      } else {
        // Left tick
        const leftTick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        leftTick.setAttribute('x1', (x1 - offset).toString());
        leftTick.setAttribute('y1', y1.toString());
        leftTick.setAttribute('x2', (x1 - offset + tickLength).toString());
        leftTick.setAttribute('y2', y1.toString());
        leftTick.setAttribute('stroke', lineColor);
        leftTick.setAttribute('stroke-width', lineWidth.toString());
        svg.appendChild(leftTick);
        
        // Right tick
        const rightTick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        rightTick.setAttribute('x1', (x1 - offset).toString());
        rightTick.setAttribute('y1', y2.toString());
        rightTick.setAttribute('x2', (x1 - offset + tickLength).toString());
        rightTick.setAttribute('y2', y2.toString());
        rightTick.setAttribute('stroke', lineColor);
        rightTick.setAttribute('stroke-width', lineWidth.toString());
        svg.appendChild(rightTick);
        
        // Label
        const labelX = x1 - offset - 2;
        const labelY = (y1 + y2) / 2;
        const decimals = unit === 'em' ? 3 : unit === 'mm' ? 1 : 2;
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', labelX.toString());
        label.setAttribute('y', labelY.toString());
        label.setAttribute('font-size', '10');
        label.setAttribute('font-family', 'sans-serif');
        label.setAttribute('fill', '#64748b');
        label.setAttribute('text-anchor', 'end');
        label.setAttribute('dominant-baseline', 'middle');
        label.textContent = `${formatValue(value, unit, decimals)}`;
        svg.appendChild(label);
      }
    };
    
    // Page width measurement (adjusted for pageOffset)
    addMeasurement(pageOffsetX, pageOffsetY - measurementOffset, pageOffsetX + singlePageWidth, pageOffsetY - measurementOffset,
      convertFromMM(inputs.pageWidth, unit, typeSize), unit);
    
    // Page height measurement
    addMeasurement(pageOffsetX - measurementOffset, pageOffsetY, pageOffsetX - measurementOffset, pageOffsetY + visHeight,
      convertFromMM(inputs.pageHeight, unit, typeSize), unit);
    
    // Margin measurements
    addMeasurement(pageOffsetX, pageOffsetY + scaledTopMargin - measurementOffset, pageOffsetX + scaledLeftMargin, pageOffsetY + scaledTopMargin - measurementOffset,
      convertFromMM(inputs.leftMargin, unit, typeSize), unit);
    addMeasurement(pageOffsetX + singlePageWidth - scaledRightMargin, pageOffsetY + scaledTopMargin - measurementOffset, pageOffsetX + singlePageWidth, pageOffsetY + scaledTopMargin - measurementOffset,
      convertFromMM(inputs.rightMargin, unit, typeSize), unit);
    
    // Top margin
    addMeasurement(pageOffsetX - measurementOffset, pageOffsetY, pageOffsetX - measurementOffset, pageOffsetY + scaledTopMargin,
      convertFromMM(inputs.topMargin, unit, typeSize), unit);
    
    // Bottom margin
    addMeasurement(pageOffsetX - measurementOffset, pageOffsetY + visHeight - scaledBottomMargin, pageOffsetX - measurementOffset, pageOffsetY + visHeight,
      convertFromMM(inputs.bottomMargin, unit, typeSize), unit);
    
    // Text box width (span width)
    addMeasurement(textBoxX, textBoxY + textBoxHeight + measurementOffset, textBoxX + textBoxWidth, textBoxY + textBoxHeight + measurementOffset,
      convertFromMM(results.textBoxWidth, unit, typeSize), unit);
    
    // Column width (if columns visible)
    if (layerVisibility.columns && inputs.numCols > 0) {
      const firstColX = fullTextBoxX;
      const firstColWidth = actualColumnWidth;
      addMeasurement(firstColX, textBoxY + textBoxHeight + measurementOffset + 12, firstColX + firstColWidth, textBoxY + textBoxHeight + measurementOffset + 12,
        convertFromMM(results.columnWidth, unit, typeSize), unit);
    }
    
    // Gutter width (if multiple columns)
    if (inputs.numCols > 1) {
      const gutterX = fullTextBoxX + actualColumnWidth;
      addMeasurement(gutterX, textBoxY + textBoxHeight + measurementOffset + 24, gutterX + inputs.gutterWidth * scaleX, textBoxY + textBoxHeight + measurementOffset + 24,
        convertFromMM(inputs.gutterWidth, unit, typeSize), unit);
    }
  }

  // Labels
  const addLabel = (x: number, y: number, text: string, className: string = '') => {
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', x.toString());
    label.setAttribute('y', y.toString());
    label.setAttribute('font-size', '10');
    label.setAttribute('font-family', 'sans-serif');
    label.setAttribute('fill', '#64748b');
    label.setAttribute('text-anchor', 'middle');
    if (className) label.setAttribute('class', className);
    label.textContent = text;
    svg.appendChild(label);
  };

  // Calculate and display scale indicator
  const sampleText = getSampleText();
  const scaleIndicator = document.getElementById('scaleIndicator');
  
  if (scaleIndicator) {
    // Calculate scale based on visualization size vs actual page size
    // Using approximate conversion: 1mm ≈ 3.78px at 96dpi
    const actualWidthPX = inputs.pageWidth * 3.78;
    const scaleFactor = visWidth / actualWidthPX;
    
    if (scaleFactor < 1 && sampleText) {
      // Find closest simple fraction
      const fractions = [
        { num: 1, den: 2, val: 0.5 },
        { num: 1, den: 3, val: 0.333 },
        { num: 1, den: 4, val: 0.25 },
        { num: 1, den: 5, val: 0.2 },
        { num: 2, den: 3, val: 0.667 },
        { num: 3, den: 4, val: 0.75 },
      ];
      
      let closest = fractions[0];
      let minDiff = Math.abs(scaleFactor - closest.val);
      
      for (const frac of fractions) {
        const diff = Math.abs(scaleFactor - frac.val);
        if (diff < minDiff) {
          minDiff = diff;
          closest = frac;
        }
      }
      
      if (minDiff < 0.15) {
        scaleIndicator.textContent = `Scale: 1/${Math.round(1 / closest.val)}`;
      } else {
        scaleIndicator.textContent = `Scale: ${scaleFactor.toFixed(2)}`;
      }
    } else {
      scaleIndicator.textContent = '';
    }
  }

  // Page dimensions label
  const labelText = facingPages 
    ? `Facing pages: ${inputs.pageWidth} × ${inputs.pageHeight} mm each`
    : `${inputs.pageWidth} × ${inputs.pageHeight} mm`;
  addLabel(svgWidth / 2, svgHeight - 5, labelText, 'page-dimensions');

  // Clear container and add new SVG
  container.innerHTML = '';
  container.appendChild(svg);
}

