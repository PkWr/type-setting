/**
 * Visualization Module for Typography Layout Calculator
 * Creates SVG-based visual representation of page layout
 */

import { LayoutInputs } from './types.js';
import { calculateLayout } from './calculator.js';
import { Unit } from './units.js';

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
  
  // Validate inputs to prevent NaN calculations
  if (!inputs.numCols || inputs.numCols <= 0 || isNaN(inputs.numCols)) {
    console.error('Invalid numCols:', inputs.numCols);
    return;
  }
  if (isNaN(inputs.gutterWidth) || inputs.gutterWidth < 0) {
    console.error('Invalid gutterWidth:', inputs.gutterWidth);
    return;
  }

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
  const visWidth = facingPages ? singlePageWidth * 2 + gapBetweenPages : singlePageWidth;
  const visHeight = singlePageHeight;
  
  // SVG dimensions match visualization size
  const svgWidth = visWidth;
  const svgHeight = visHeight;
  const pageOffsetX = 0;
  const pageOffsetY = 0;

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

  // Store textGroup to append at the end (after all other elements)
  let textGroupToAppend: SVGForeignObjectElement | null = null;

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
      const actualColumnWidth = inputs.numCols > 0 ? availableWidth / inputs.numCols : 0;
      const sampleText = getSampleText();
      const words = sampleText ? sampleText.split(/\s+/) : [];
      
      // Calculate font size in SVG units (scaled)
      // Convert typeSize from points to mm (1pt = 0.3528mm), then scale by scaleY
      const typeSizeMM = inputs.typeSize * 0.3528;
      const fontSizeSVG = typeSizeMM * scaleY;
      const lineHeight = fontSizeSVG * 1.5;
      const padding = fontSizeSVG * 0.5;

      // Determine column span
      // Only use defaults if columnSpanStart/End are explicitly undefined
      // If they're 0 or null, that means no span was selected
      const columnSpanStart = inputs.columnSpanStart !== undefined ? inputs.columnSpanStart : 1;
      const columnSpanEnd = inputs.columnSpanEnd !== undefined ? inputs.columnSpanEnd : inputs.numCols;
      const spanCols = columnSpanEnd - columnSpanStart + 1;
      
      // Get text columns (which columns text appears in)
      const textColumns = inputs.textColumns || [];
      const textColsCount = textColumns.length > 0 ? textColumns.length : spanCols;
      const wordsPerTextColumn = words.length > 0 ? Math.ceil(words.length / textColsCount) : 0;
      
      // Calculate text box position and width based on span
      const spanStartIndex = Math.max(0, columnSpanStart - 1); // Convert to 0-indexed, ensure non-negative
      const spanTextBoxX = pageTextX + (spanStartIndex * (actualColumnWidth + scaledGutterWidth));
      // Calculate width as: (columnWidth * spanCols) + (gutterWidth * spanGutters)
      // This ensures the text box spans the exact width of selected columns + gutters
      const spanGutters = Math.max(0, spanCols - 1);
      // For 2 columns: spanCols=2, spanGutters=1, so width = (colWidth * 2) + (gutterWidth * 1)
      const spanTextBoxWidth = (actualColumnWidth * spanCols) + (scaledGutterWidth * spanGutters);
      
      // Debug logging
      console.log('Facing pages - Text box calculation:', {
        columnSpanStart,
        columnSpanEnd,
        spanCols,
        spanGutters,
        spanStartIndex,
        pageTextX,
        actualColumnWidth,
        scaledGutterWidth,
        spanTextBoxX,
        spanTextBoxWidth,
        expectedWidth: `(${actualColumnWidth} * ${spanCols}) + (${scaledGutterWidth} * ${spanGutters}) = ${spanTextBoxWidth}`
      });
      
      // Validate values to prevent NaN
      if (isNaN(spanTextBoxX) || isNaN(spanTextBoxWidth) || isNaN(actualColumnWidth) || isNaN(scaledGutterWidth) || actualColumnWidth <= 0) {
        console.error('Invalid values in facing pages text box calculation:', { spanTextBoxX, spanTextBoxWidth, actualColumnWidth, scaledGutterWidth, columnSpanStart, columnSpanEnd, spanCols, spanGutters, inputs });
        return; // Skip rendering this page if values are invalid
      }
      
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
          // Remove fill when text is visible to prevent obscuring text
          // Only show fill when text layer is hidden
          if (!layerVisibility.text) {
            colRect.setAttribute('fill', '#e0e7ff');
            colRect.setAttribute('opacity', isInSpan ? (hasText ? '0.6' : '0.4') : '0.2');
          } else {
            colRect.setAttribute('fill', 'none');
          }
          colRect.setAttribute('stroke', '#2563eb');
          colRect.setAttribute('stroke-width', '1');
          svg.appendChild(colRect);
        }
      }

      // Render text across the full text box width, but only show in selected columns
      if (layerVisibility.text && words.length > 0) {
        // Determine which columns should show text
        const columnsToShowText = textColumns.length > 0 
          ? textColumns.filter(col => col >= columnSpanStart && col <= columnSpanEnd)
          : Array.from({ length: spanCols }, (_, i) => columnSpanStart + i);
        
        if (columnsToShowText.length > 0) {
          // Create a single text element that spans the full text box width
          // The textGroup should span the full width including gutters, with padding
          const textGroup = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
          textGroup.setAttribute('x', spanTextBoxX.toString()); // Start at text box edge, no padding offset
          textGroup.setAttribute('y', (pageOffsetY + scaledTopMargin).toString());
          textGroup.setAttribute('width', spanTextBoxWidth.toString()); // Full text box width
          textGroup.setAttribute('height', textBoxHeight.toString());
          
          // Debug logging for text rendering
          const expectedTotalWidth = (actualColumnWidth * columnsToShowText.length) + (scaledGutterWidth * (columnsToShowText.length - 1));
          console.log('Facing pages - Text rendering:', {
            columnsToShowText,
            spanTextBoxX,
            spanTextBoxWidth,
            textGroupWidth: spanTextBoxWidth,
            actualColumnWidth,
            scaledGutterWidth,
            padding,
            expectedTotalWidth,
            matches: Math.abs(spanTextBoxWidth - expectedTotalWidth) < 0.01 ? 'YES' : 'NO',
            difference: spanTextBoxWidth - expectedTotalWidth
          });
          
          // Create clipping path to only show text in selected columns
          const clipId = `textClip-${Math.random().toString(36).substr(2, 9)}`;
          const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
          clipPath.setAttribute('id', clipId);
          
          // Add rectangles for each column that should show text
          // Clipping coordinates are relative to the textGroup (which starts at spanTextBoxX)
          // The textGroup spans the full text box width, and clipping should align with column positions
          columnsToShowText.forEach(colIndex => {
            const colOffset = colIndex - columnSpanStart; // Offset within span (0-indexed)
            // Calculate clipX relative to textGroup origin (0,0)
            // Column positions: colOffset * (columnWidth + gutterWidth)
            const clipX = colOffset * (actualColumnWidth + scaledGutterWidth);
            const clipRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            // Position relative to textGroup origin
            // Column 1 (offset 0): x=0
            // Column 2 (offset 1): x=actualColumnWidth + scaledGutterWidth
            // Note: textDiv padding is internal, clipping is applied to textGroup
            clipRect.setAttribute('x', clipX.toString());
            clipRect.setAttribute('y', '0'); // Start from top of textGroup
            clipRect.setAttribute('width', actualColumnWidth.toString());
            clipRect.setAttribute('height', textBoxHeight.toString()); // Full height of textGroup
            clipPath.appendChild(clipRect);
            
            const clipEndX = clipX + actualColumnWidth;
            console.log(`Facing pages - Clip rect for column ${colIndex}:`, {
              colIndex,
              colOffset,
              clipX,
              clipEndX,
              width: actualColumnWidth,
              height: textBoxHeight,
              expectedX: colOffset === 0 ? '0' : `${actualColumnWidth} + ${scaledGutterWidth} = ${clipX}`,
              nextColumnStart: colOffset === 0 ? actualColumnWidth : null,
              gap: colOffset === 0 ? scaledGutterWidth : null,
              textGroupX: spanTextBoxX,
              textGroupWidth: spanTextBoxWidth
            });
          });
          
          svg.appendChild(clipPath);
          textGroup.setAttribute('clip-path', `url(#${clipId})`);
          
          // Add a white background rect behind the text to ensure it covers margin fills
          const textBgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          textBgRect.setAttribute('x', '0');
          textBgRect.setAttribute('y', '0');
          textBgRect.setAttribute('width', spanTextBoxWidth.toString());
          textBgRect.setAttribute('height', textBoxHeight.toString());
          textBgRect.setAttribute('fill', '#ffffff');
          textGroup.appendChild(textBgRect);
          
          const textDiv = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
          textDiv.style.fontSize = `${fontSizeSVG}px`;
          textDiv.style.lineHeight = `${lineHeight}px`;
          textDiv.style.fontFamily = 'serif';
          textDiv.style.color = '#1e293b';
          textDiv.style.width = '100%';
          textDiv.style.height = '100%';
          // Only apply vertical padding to avoid horizontal clipping issues
          // Horizontal padding would require adjusting clipping rectangles
          textDiv.style.paddingTop = `${padding}px`;
          textDiv.style.paddingBottom = `${padding}px`;
          textDiv.style.paddingLeft = '0';
          textDiv.style.paddingRight = '0';
          textDiv.style.boxSizing = 'border-box';
          textDiv.style.overflow = 'hidden';
          textDiv.style.wordWrap = 'break-word';
          textDiv.style.hyphens = 'auto';
          textDiv.textContent = getSampleText();
          
          textGroup.appendChild(textDiv);
          svg.appendChild(textGroup);
        }
      }

      // Draw column dividers
      for (let i = 0; i < inputs.numCols; i++) {
        const colIndex = i + 1; // 1-indexed
        const colX = pageTextX + (i * (actualColumnWidth + scaledGutterWidth));
        const isInSpan = colIndex >= columnSpanStart && colIndex <= columnSpanEnd;
        
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
    const actualColumnWidth = inputs.numCols > 0 ? availableWidth / inputs.numCols : 0;
    const sampleText = getSampleText();
    const words = sampleText ? sampleText.split(/\s+/) : [];
    
    // Calculate font size in SVG units (scaled)
    // Convert typeSize from points to mm (1pt = 0.3528mm), then scale by scaleY
    const typeSizeMM = inputs.typeSize * 0.3528;
    const fontSizeSVG = typeSizeMM * scaleY;
    const lineHeight = fontSizeSVG * 1.5;
    const padding = fontSizeSVG * 0.5;

    // Determine column span
    // Only use defaults if columnSpanStart/End are explicitly undefined
    // If they're 0 or null, that means no span was selected
    const columnSpanStart = inputs.columnSpanStart !== undefined ? inputs.columnSpanStart : 1;
    const columnSpanEnd = inputs.columnSpanEnd !== undefined ? inputs.columnSpanEnd : inputs.numCols;
    const spanCols = columnSpanEnd - columnSpanStart + 1;
    
    // Get text columns (which columns text appears in)
    const textColumns = inputs.textColumns || [];
    const textColsCount = textColumns.length > 0 ? textColumns.length : spanCols;
    const wordsPerTextColumn = words.length > 0 ? Math.ceil(words.length / textColsCount) : 0;
    
    // Calculate text box position and width based on span
    const spanStartIndex = Math.max(0, columnSpanStart - 1); // Convert to 0-indexed, ensure non-negative
    const textBoxX = fullTextBoxX + (spanStartIndex * (actualColumnWidth + scaledGutterWidth));
    // Calculate width as: (columnWidth * spanCols) + (gutterWidth * spanGutters)
    // This ensures the text box spans the exact width of selected columns + gutters
    const spanGutters = Math.max(0, spanCols - 1);
    // For 2 columns: spanCols=2, spanGutters=1, so width = (colWidth * 2) + (gutterWidth * 1)
    const textBoxWidth = (actualColumnWidth * spanCols) + (scaledGutterWidth * spanGutters);
    
    // Debug logging
    const textBoxEndX = textBoxX + textBoxWidth;
    const rightMarginEdge = pageOffsetX + singlePageWidth - scaledRightMargin;
    const leftMarginEdge = pageOffsetX + scaledLeftMargin;
    console.log('Single page - Text box calculation:', {
      columnSpanStart,
      columnSpanEnd,
      spanCols,
      spanGutters,
      spanStartIndex,
      pageOffsetX,
      scaledLeftMargin,
      scaledRightMargin,
      singlePageWidth,
      leftMarginEdge,
      rightMarginEdge,
      fullTextBoxX,
      actualColumnWidth,
      scaledGutterWidth,
      textBoxX,
      textBoxWidth,
      textBoxEndX,
      extendsBeyondRight: textBoxEndX > rightMarginEdge,
      extendsBeyondLeft: textBoxX < leftMarginEdge,
      expectedWidth: `(${actualColumnWidth} * ${spanCols}) + (${scaledGutterWidth} * ${spanGutters}) = ${textBoxWidth}`
    });
    
    // Validate values to prevent NaN
    if (isNaN(textBoxX) || isNaN(textBoxWidth) || isNaN(actualColumnWidth) || isNaN(scaledGutterWidth) || actualColumnWidth <= 0) {
      console.error('Invalid values in text box calculation:', { textBoxX, textBoxWidth, actualColumnWidth, scaledGutterWidth, columnSpanStart, columnSpanEnd, spanCols, spanGutters, inputs });
      // Don't return - just skip drawing the text box and columns
      return;
    }
    
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
          // Remove fill when text is visible to prevent obscuring text
          // Only show fill when text layer is hidden
          if (!layerVisibility.text) {
            colRect.setAttribute('fill', '#e0e7ff');
            colRect.setAttribute('opacity', isInSpan ? (hasText ? '0.6' : '0.4') : '0.2');
          } else {
            colRect.setAttribute('fill', 'none');
          }
          colRect.setAttribute('stroke', '#2563eb');
          colRect.setAttribute('stroke-width', '1');
          svg.appendChild(colRect);
        }
    }

    // Render text across the full text box width, but only show in selected columns
    if (layerVisibility.text && words.length > 0) {
      // Determine which columns should show text
      const columnsToShowText = textColumns.length > 0 
        ? textColumns.filter(col => col >= columnSpanStart && col <= columnSpanEnd)
        : Array.from({ length: spanCols }, (_, i) => columnSpanStart + i);
      
      if (columnsToShowText.length > 0) {
        // Create a single text element that spans the full text box width
        // The textGroup should span the full width including gutters, with padding applied via CSS
        // Constrain textGroup to not extend beyond margins
        const rightMarginEdge = pageOffsetX + singlePageWidth - scaledRightMargin;
        const constrainedTextBoxX = Math.max(textBoxX, pageOffsetX + scaledLeftMargin);
        const constrainedTextBoxWidth = Math.min(textBoxWidth, rightMarginEdge - constrainedTextBoxX);
        const textGroupEndX = constrainedTextBoxX + constrainedTextBoxWidth;
        
        const textGroup = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
        textGroup.setAttribute('x', constrainedTextBoxX.toString()); // Constrained to not extend beyond left margin
        textGroup.setAttribute('y', textBoxY.toString());
        textGroup.setAttribute('width', constrainedTextBoxWidth.toString()); // Constrained to not extend beyond right margin
        textGroup.setAttribute('height', textBoxHeight.toString());
        
        // Debug logging for text rendering
        const expectedTotalWidth = (actualColumnWidth * columnsToShowText.length) + (scaledGutterWidth * (columnsToShowText.length - 1));
        const column1End = actualColumnWidth;
        const column2Start = actualColumnWidth + scaledGutterWidth;
        const column2End = column2Start + actualColumnWidth;
        console.log('Single page - Text rendering:', {
          columnsToShowText,
          textBoxX,
          textBoxWidth,
          constrainedTextBoxX,
          constrainedTextBoxWidth,
          textGroupEndX,
          rightMarginEdge,
          leftMarginEdge: pageOffsetX + scaledLeftMargin,
          wasConstrained: constrainedTextBoxX !== textBoxX || constrainedTextBoxWidth !== textBoxWidth,
          textGroupWidth: constrainedTextBoxWidth,
          actualColumnWidth,
          scaledGutterWidth,
          padding,
          expectedTotalWidth,
          matches: Math.abs(textBoxWidth - expectedTotalWidth) < 0.01 ? 'YES' : 'NO',
          difference: textBoxWidth - expectedTotalWidth,
          column1End,
          column2Start,
          column2End,
          totalShouldBe: column2End,
          verification: `Column1(0-${column1End}) + Gutter(${column1End}-${column2Start}) + Column2(${column2Start}-${column2End}) = ${column2End}`,
          // Column positions relative to constrainedTextBoxX
          col1AbsoluteStart: constrainedTextBoxX,
          col1AbsoluteEnd: constrainedTextBoxX + actualColumnWidth,
          col2AbsoluteStart: constrainedTextBoxX + column2Start,
          col2AbsoluteEnd: constrainedTextBoxX + column2End,
          gutterAbsoluteStart: constrainedTextBoxX + column1End,
          gutterAbsoluteEnd: constrainedTextBoxX + column2Start
        });
        
        // Create clipping path to only show text in selected columns
        const clipId = `textClip-${Math.random().toString(36).substr(2, 9)}`;
        const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
        clipPath.setAttribute('id', clipId);
        
        // Add rectangles for each column that should show text
        // Clipping coordinates are relative to the textGroup (which starts at constrainedTextBoxX)
        // Need to account for the offset between textBoxX and constrainedTextBoxX
        const textGroupOffset = constrainedTextBoxX - textBoxX;
        columnsToShowText.forEach(colIndex => {
          const colOffset = colIndex - columnSpanStart; // Offset within span (0-indexed)
          // Calculate clipX relative to textGroup origin (0,0)
          // Column positions: colOffset * (columnWidth + gutterWidth) - textGroupOffset
          const clipX = (colOffset * (actualColumnWidth + scaledGutterWidth)) - textGroupOffset;
          const clipRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          // Position relative to textGroup origin
          // Column 1 (offset 0): x=0
          // Column 2 (offset 1): x=actualColumnWidth + scaledGutterWidth
          // Note: textDiv padding is internal, clipping is applied to textGroup
          clipRect.setAttribute('x', Math.max(0, clipX).toString()); // Don't allow negative x
          clipRect.setAttribute('y', '0'); // Start from top of textGroup
          clipRect.setAttribute('width', actualColumnWidth.toString());
          clipRect.setAttribute('height', textBoxHeight.toString()); // Full height of textGroup
          clipPath.appendChild(clipRect);
          
          const clipEndX = clipX + actualColumnWidth;
          console.log(`Single page - Clip rect for column ${colIndex}:`, {
            colIndex,
            colOffset,
            clipX,
            clipEndX,
            width: actualColumnWidth,
            height: textBoxHeight,
            textGroupOffset,
            expectedX: colOffset === 0 ? `0 - ${textGroupOffset} = ${clipX}` : `${actualColumnWidth} + ${scaledGutterWidth} - ${textGroupOffset} = ${clipX}`,
            nextColumnStart: colOffset === 0 ? actualColumnWidth : null,
            gap: colOffset === 0 ? scaledGutterWidth : null,
            textGroupX: constrainedTextBoxX,
            textGroupWidth: constrainedTextBoxWidth
          });
        });
        
        svg.appendChild(clipPath);
        textGroup.setAttribute('clip-path', `url(#${clipId})`);
        
        // Add a white background rect behind the text to ensure it covers margin fills
        const textBgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        textBgRect.setAttribute('x', '0');
        textBgRect.setAttribute('y', '0');
        textBgRect.setAttribute('width', constrainedTextBoxWidth.toString());
        textBgRect.setAttribute('height', textBoxHeight.toString());
        textBgRect.setAttribute('fill', '#ffffff');
        textGroup.appendChild(textBgRect);
        
        const textDiv = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
        textDiv.style.fontSize = `${fontSizeSVG}px`;
        textDiv.style.lineHeight = `${lineHeight}px`;
        textDiv.style.fontFamily = 'serif';
        textDiv.style.color = '#1e293b';
        textDiv.style.width = '100%';
        textDiv.style.height = '100%';
        // Only apply vertical padding to avoid horizontal clipping issues
        // Horizontal padding would require adjusting clipping rectangles
        textDiv.style.paddingTop = `${padding}px`;
        textDiv.style.paddingBottom = `${padding}px`;
        textDiv.style.paddingLeft = '0';
        textDiv.style.paddingRight = '0';
        textDiv.style.boxSizing = 'border-box';
        textDiv.style.overflow = 'hidden';
        textDiv.style.wordWrap = 'break-word';
        textDiv.style.hyphens = 'auto';
        textDiv.textContent = getSampleText();
        
        textGroup.appendChild(textDiv);
        // Store textGroup to append at the end (after dividers and labels)
        textGroupToAppend = textGroup;
      }
    }

    // Draw column dividers
    for (let i = 0; i < inputs.numCols; i++) {
      const colIndex = i + 1; // 1-indexed
      const colX = fullTextBoxX + (i * (actualColumnWidth + scaledGutterWidth));
      const isInSpan = colIndex >= columnSpanStart && colIndex <= columnSpanEnd;
      
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

  // Append textGroup last so it appears on top of all other elements (dividers, labels, etc.)
  if (textGroupToAppend) {
    svg.appendChild(textGroupToAppend);
  }

  // Clear container and add new SVG
  container.innerHTML = '';
  container.appendChild(svg);
}

