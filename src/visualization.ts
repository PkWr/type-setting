/**
 * Visualization Module for Typography Layout Calculator
 * Creates SVG-based visual representation of page layout
 */

import { LayoutInputs } from './types.js';
import { calculateLayout } from './calculator.js';

/**
 * Gets sample text from textarea
 */
function getSampleText(): string {
  const sampleTextInput = document.getElementById('sampleText') as HTMLTextAreaElement;
  return sampleTextInput?.value.trim() || '';
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
  svg.setAttribute('viewBox', `0 0 ${visWidth} ${visHeight}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.classList.add('page-visualization');

  // Draw pages
  if (facingPages) {
    // Left page (even/left page)
    const leftPageX = 0;
    const leftPageTextX = leftPageX + leftPageOuterMargin;
    const leftPageTextWidth = singlePageWidth - leftPageOuterMargin - leftPageInnerMargin;
    
    // Right page (odd/right page)
    const rightPageX = singlePageWidth + gapBetweenPages;
    const rightPageTextX = rightPageX + rightPageInnerMargin;
    const rightPageTextWidth = singlePageWidth - rightPageInnerMargin - rightPageOuterMargin;

    // Draw left page
    const leftPageRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    leftPageRect.setAttribute('x', leftPageX.toString());
    leftPageRect.setAttribute('y', '0');
    leftPageRect.setAttribute('width', singlePageWidth.toString());
    leftPageRect.setAttribute('height', visHeight.toString());
    leftPageRect.setAttribute('fill', '#ffffff');
    leftPageRect.setAttribute('stroke', '#1e293b');
    leftPageRect.setAttribute('stroke-width', '2');
    svg.appendChild(leftPageRect);

    // Draw right page
    const rightPageRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rightPageRect.setAttribute('x', rightPageX.toString());
    rightPageRect.setAttribute('y', '0');
    rightPageRect.setAttribute('width', singlePageWidth.toString());
    rightPageRect.setAttribute('height', visHeight.toString());
    rightPageRect.setAttribute('fill', '#ffffff');
    rightPageRect.setAttribute('stroke', '#1e293b');
    rightPageRect.setAttribute('stroke-width', '2');
    svg.appendChild(rightPageRect);

    // Draw margins for left page
    const leftMarginPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    leftMarginPath.setAttribute('d', `
      M ${leftPageX},0 L ${leftPageX + singlePageWidth},0 L ${leftPageX + singlePageWidth},${visHeight} L ${leftPageX},${visHeight} Z
      M ${leftPageX + leftPageOuterMargin},${scaledTopMargin}
      L ${leftPageX + singlePageWidth - leftPageInnerMargin},${scaledTopMargin}
      L ${leftPageX + singlePageWidth - leftPageInnerMargin},${visHeight - scaledBottomMargin}
      L ${leftPageX + leftPageOuterMargin},${visHeight - scaledBottomMargin} Z
    `);
    leftMarginPath.setAttribute('fill', '#f1f5f9');
    leftMarginPath.setAttribute('fill-rule', 'evenodd');
    svg.appendChild(leftMarginPath);

    // Draw margins for right page
    const rightMarginPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    rightMarginPath.setAttribute('d', `
      M ${rightPageX},0 L ${rightPageX + singlePageWidth},0 L ${rightPageX + singlePageWidth},${visHeight} L ${rightPageX},${visHeight} Z
      M ${rightPageX + rightPageInnerMargin},${scaledTopMargin}
      L ${rightPageX + singlePageWidth - rightPageOuterMargin},${scaledTopMargin}
      L ${rightPageX + singlePageWidth - rightPageOuterMargin},${visHeight - scaledBottomMargin}
      L ${rightPageX + rightPageInnerMargin},${visHeight - scaledBottomMargin} Z
    `);
    rightMarginPath.setAttribute('fill', '#f1f5f9');
    rightMarginPath.setAttribute('fill-rule', 'evenodd');
    svg.appendChild(rightMarginPath);

    // Text box outlines
    const leftTextBoxRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    leftTextBoxRect.setAttribute('x', leftPageTextX.toString());
    leftTextBoxRect.setAttribute('y', scaledTopMargin.toString());
    leftTextBoxRect.setAttribute('width', leftPageTextWidth.toString());
    leftTextBoxRect.setAttribute('height', (visHeight - scaledTopMargin - scaledBottomMargin).toString());
    leftTextBoxRect.setAttribute('fill', 'none');
    leftTextBoxRect.setAttribute('stroke', '#64748b');
    leftTextBoxRect.setAttribute('stroke-width', '1.5');
    leftTextBoxRect.setAttribute('stroke-dasharray', '4,2');
    svg.appendChild(leftTextBoxRect);

    const rightTextBoxRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rightTextBoxRect.setAttribute('x', rightPageTextX.toString());
    rightTextBoxRect.setAttribute('y', scaledTopMargin.toString());
    rightTextBoxRect.setAttribute('width', rightPageTextWidth.toString());
    rightTextBoxRect.setAttribute('height', (visHeight - scaledTopMargin - scaledBottomMargin).toString());
    rightTextBoxRect.setAttribute('fill', 'none');
    rightTextBoxRect.setAttribute('stroke', '#64748b');
    rightTextBoxRect.setAttribute('stroke-width', '1.5');
    rightTextBoxRect.setAttribute('stroke-dasharray', '4,2');
    svg.appendChild(rightTextBoxRect);

    // Draw columns for both pages
    const drawColumns = (pageTextX: number, pageTextWidth: number) => {
      const textBoxHeight = visHeight - scaledTopMargin - scaledBottomMargin;
      const scaledGutterWidth = inputs.gutterWidth * scaleX;
      const totalGutters = (inputs.numCols - 1) * scaledGutterWidth;
      const availableWidth = pageTextWidth - totalGutters;
      const actualColumnWidth = availableWidth / inputs.numCols;
      const sampleText = getSampleText();
      const words = sampleText ? sampleText.split(/\s+/) : [];
      const wordsPerColumn = words.length > 0 ? Math.ceil(words.length / inputs.numCols) : 0;
      
      // Calculate font size in SVG units (scaled)
      const fontSizeSVG = (inputs.typeSize * scaleY) * 0.75; // Scale font size to fit visualization
      const lineHeight = fontSizeSVG * 1.5;
      const padding = fontSizeSVG * 0.5;

      for (let i = 0; i < inputs.numCols; i++) {
        const colX = pageTextX + (i * (actualColumnWidth + scaledGutterWidth));
        
        const colRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        colRect.setAttribute('x', colX.toString());
        colRect.setAttribute('y', scaledTopMargin.toString());
        colRect.setAttribute('width', actualColumnWidth.toString());
        colRect.setAttribute('height', textBoxHeight.toString());
        colRect.setAttribute('fill', '#e0e7ff');
        colRect.setAttribute('stroke', '#2563eb');
        colRect.setAttribute('stroke-width', '1');
        colRect.setAttribute('opacity', '0.6');
        svg.appendChild(colRect);

        // Add text to column if sample text exists
        if (words.length > 0) {
          const startIdx = i * wordsPerColumn;
          const endIdx = Math.min(startIdx + wordsPerColumn, words.length);
          const columnWords = words.slice(startIdx, endIdx);
          
          // Create text element with wrapping
          const textGroup = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
          textGroup.setAttribute('x', (colX + padding).toString());
          textGroup.setAttribute('y', (scaledTopMargin + padding).toString());
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

        if (i < inputs.numCols - 1) {
          const dividerX = colX + actualColumnWidth;
          const divider = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          divider.setAttribute('x1', dividerX.toString());
          divider.setAttribute('y1', scaledTopMargin.toString());
          divider.setAttribute('x2', dividerX.toString());
          divider.setAttribute('y2', (scaledTopMargin + textBoxHeight).toString());
          divider.setAttribute('stroke', '#2563eb');
          divider.setAttribute('stroke-width', '2');
          divider.setAttribute('stroke-dasharray', '3,3');
          svg.appendChild(divider);
        }
      }
    };

    drawColumns(leftPageTextX, leftPageTextWidth);
    drawColumns(rightPageTextX, rightPageTextWidth);

  } else {
    // Single page mode (existing code)
    const textBoxX = scaledLeftMargin;
    const textBoxY = scaledTopMargin;
    const textBoxWidth = singlePageWidth - scaledLeftMargin - scaledRightMargin;
    const textBoxHeight = visHeight - scaledTopMargin - scaledBottomMargin;

    // Page background
    const pageRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    pageRect.setAttribute('x', '0');
    pageRect.setAttribute('y', '0');
    pageRect.setAttribute('width', singlePageWidth.toString());
    pageRect.setAttribute('height', visHeight.toString());
    pageRect.setAttribute('fill', '#ffffff');
    pageRect.setAttribute('stroke', '#1e293b');
    pageRect.setAttribute('stroke-width', '2');
    svg.appendChild(pageRect);

    // Margins area
    const marginPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    marginPath.setAttribute('d', `
      M 0,0 L ${singlePageWidth},0 L ${singlePageWidth},${visHeight} L 0,${visHeight} Z
      M ${scaledLeftMargin},${scaledTopMargin}
      L ${singlePageWidth - scaledRightMargin},${scaledTopMargin}
      L ${singlePageWidth - scaledRightMargin},${visHeight - scaledBottomMargin}
      L ${scaledLeftMargin},${visHeight - scaledBottomMargin} Z
    `);
    marginPath.setAttribute('fill', '#f1f5f9');
    marginPath.setAttribute('fill-rule', 'evenodd');
    svg.appendChild(marginPath);

    // Text box area outline
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

    // Columns
    const scaledGutterWidth = inputs.gutterWidth * scaleX;
    const totalGutters = (inputs.numCols - 1) * scaledGutterWidth;
    const availableWidth = textBoxWidth - totalGutters;
    const actualColumnWidth = availableWidth / inputs.numCols;
    const sampleText = getSampleText();
    const words = sampleText ? sampleText.split(/\s+/) : [];
    const wordsPerColumn = words.length > 0 ? Math.ceil(words.length / inputs.numCols) : 0;
    
    // Calculate font size in SVG units (scaled)
    const fontSizeSVG = (inputs.typeSize * scaleY) * 0.75;
    const lineHeight = fontSizeSVG * 1.5;
    const padding = fontSizeSVG * 0.5;

    for (let i = 0; i < inputs.numCols; i++) {
      const colX = textBoxX + (i * (actualColumnWidth + scaledGutterWidth));
      
      const colRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      colRect.setAttribute('x', colX.toString());
      colRect.setAttribute('y', textBoxY.toString());
      colRect.setAttribute('width', actualColumnWidth.toString());
      colRect.setAttribute('height', textBoxHeight.toString());
      colRect.setAttribute('fill', '#e0e7ff');
      colRect.setAttribute('stroke', '#2563eb');
      colRect.setAttribute('stroke-width', '1');
      colRect.setAttribute('opacity', '0.6');
      svg.appendChild(colRect);

      // Add text to column if sample text exists
      if (words.length > 0) {
        const startIdx = i * wordsPerColumn;
        const endIdx = Math.min(startIdx + wordsPerColumn, words.length);
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

      if (i < inputs.numCols - 1) {
        const dividerX = colX + actualColumnWidth;
        const divider = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        divider.setAttribute('x1', dividerX.toString());
        divider.setAttribute('y1', textBoxY.toString());
        divider.setAttribute('x2', dividerX.toString());
        divider.setAttribute('y2', (textBoxY + textBoxHeight).toString());
        divider.setAttribute('stroke', '#2563eb');
        divider.setAttribute('stroke-width', '2');
        divider.setAttribute('stroke-dasharray', '3,3');
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
  addLabel(visWidth / 2, visHeight + 15, labelText, 'page-dimensions');

  // Clear container and add new SVG
  container.innerHTML = '';
  container.appendChild(svg);
}

