/**
 * Visualization Module for Typography Layout Calculator
 * Creates SVG-based visual representation of page layout
 */
import { calculateLayout } from './calculator.js';
import { LayoutInputs } from './types.js';

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
function getLayerVisibility() {
  const showMargins = (document.getElementById('showMargins') as HTMLInputElement)?.checked ?? true;
  const showColumns = (document.getElementById('showColumns') as HTMLInputElement)?.checked ?? true;
  const showText = (document.getElementById('showText') as HTMLInputElement)?.checked ?? true;
  return { margins: showMargins, columns: showColumns, text: showText };
}

// Page dimensions and margins are always in mm, gutter is always in em
const PAGE_UNIT = 'mm';

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
 * Draws a single page with margins, columns, and text
 */
function drawPage(
  svg: SVGSVGElement,
  inputs: LayoutInputs,
  pageX: number,
  pageY: number,
  pageWidth: number,
  pageHeight: number,
  leftMargin: number,
  rightMargin: number,
  topMargin: number,
  bottomMargin: number,
  scaleX: number,
  scaleY: number,
  layerVisibility: { margins: boolean; columns: boolean; text: boolean }
): void {
  // Draw page background
  const pageRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  pageRect.setAttribute('x', pageX.toString());
  pageRect.setAttribute('y', pageY.toString());
  pageRect.setAttribute('width', pageWidth.toString());
  pageRect.setAttribute('height', pageHeight.toString());
  pageRect.setAttribute('fill', '#ffffff');
  pageRect.setAttribute('stroke', '#000000');
  pageRect.setAttribute('stroke-width', '0.5');
  svg.appendChild(pageRect);

  // Calculate scaled margins
  const scaledTopMargin = Math.max(topMargin * scaleY, MIN_MARGIN_VISUAL);
  const scaledBottomMargin = Math.max(bottomMargin * scaleY, MIN_MARGIN_VISUAL);
  const scaledLeftMargin = Math.max(leftMargin * scaleX, MIN_MARGIN_VISUAL);
  const scaledRightMargin = Math.max(rightMargin * scaleX, MIN_MARGIN_VISUAL);

  // Draw margin keylines
  if (layerVisibility.margins) {
    const marginRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    marginRect.setAttribute('x', (pageX + scaledLeftMargin).toString());
    marginRect.setAttribute('y', (pageY + scaledTopMargin).toString());
    marginRect.setAttribute('width', (pageWidth - scaledLeftMargin - scaledRightMargin).toString());
    marginRect.setAttribute('height', (pageHeight - scaledTopMargin - scaledBottomMargin).toString());
    marginRect.setAttribute('fill', 'none');
    marginRect.setAttribute('stroke', '#000000');
    marginRect.setAttribute('stroke-width', '0.5');
    svg.appendChild(marginRect);
  }

  // Draw columns
  if (layerVisibility.columns && inputs.numCols > 0) {
    const textBoxX = pageX + scaledLeftMargin;
    const textBoxY = pageY + scaledTopMargin;
    const textBoxWidth = pageWidth - scaledLeftMargin - scaledRightMargin;
    const textBoxHeight = pageHeight - scaledTopMargin - scaledBottomMargin;
    
    const scaledGutterWidth = inputs.gutterWidth * scaleX;
    const totalGutters = (inputs.numCols - 1) * scaledGutterWidth;
    const availableWidth = textBoxWidth - totalGutters;
    const columnWidth = availableWidth / inputs.numCols;
    
    for (let i = 0; i < inputs.numCols; i++) {
      const colX = textBoxX + (i * (columnWidth + scaledGutterWidth));
      const colRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      colRect.setAttribute('x', colX.toString());
      colRect.setAttribute('y', textBoxY.toString());
      colRect.setAttribute('width', columnWidth.toString());
      colRect.setAttribute('height', textBoxHeight.toString());
      colRect.setAttribute('fill', 'none');
      colRect.setAttribute('stroke', '#000000');
      colRect.setAttribute('stroke-width', '0.5');
      svg.appendChild(colRect);
    }
  }

  // Draw text
  if (layerVisibility.text) {
    const sampleText = getSampleText();
    if (sampleText && sampleText.trim().length > 0) {
      const textBoxX = pageX + scaledLeftMargin;
      const textBoxY = pageY + scaledTopMargin;
      const fullTextBoxWidth = pageWidth - scaledLeftMargin - scaledRightMargin;
      const textBoxHeight = pageHeight - scaledTopMargin - scaledBottomMargin;
      
      const scaledGutterWidth = inputs.gutterWidth * scaleX;
      const totalGutters = (inputs.numCols - 1) * scaledGutterWidth;
      const availableWidth = fullTextBoxWidth - totalGutters;
      const columnWidth = availableWidth / inputs.numCols;
      
      // Determine column span
      const columnSpanStart = inputs.columnSpanStart !== undefined ? inputs.columnSpanStart : 1;
      const columnSpanEnd = inputs.columnSpanEnd !== undefined ? inputs.columnSpanEnd : inputs.numCols;
      const spanCols = columnSpanEnd - columnSpanStart + 1;
      const spanGutters = Math.max(0, spanCols - 1);
      const spanWidth = (columnWidth * spanCols) + (scaledGutterWidth * spanGutters);
      
      // Determine which column text starts in
      const textColumns = inputs.textColumns && inputs.textColumns.length > 0 
        ? inputs.textColumns 
        : [columnSpanStart];
      
      const textStartColumn = Math.min(...textColumns);
      const textStartIndex = Math.max(0, textStartColumn - 1);
      
      // Calculate how many times the span can repeat across available columns
      const availableColsFromStart = inputs.numCols - textStartIndex;
      const numberOfSpans = Math.floor(availableColsFromStart / spanCols);
      
      // Calculate font size and line height
      const typeSizeMM = inputs.typeSize * 0.3528;
      const fontSizeSVG = typeSizeMM * scaleY;
      // Use leading if provided, otherwise default to type size + 2
      const leadingPt = inputs.leading !== undefined ? inputs.leading : inputs.typeSize + 2;
      const leadingMM = leadingPt * 0.3528;
      const lineHeight = leadingMM * scaleY;
      const padding = fontSizeSVG * 0.5;
      
      // Create text boxes for each span repetition
      for (let spanIndex = 0; spanIndex < numberOfSpans; spanIndex++) {
        const spanStartIndex = textStartIndex + (spanIndex * spanCols);
        const spanStartX = textBoxX + (spanStartIndex * (columnWidth + scaledGutterWidth));
        
        // Create text group for this span
        const textGroup = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
        textGroup.setAttribute('x', spanStartX.toString());
        textGroup.setAttribute('y', textBoxY.toString());
        textGroup.setAttribute('width', spanWidth.toString());
        textGroup.setAttribute('height', textBoxHeight.toString());
        
        // Add white background for text readability
        const textBgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        textBgRect.setAttribute('x', '0');
        textBgRect.setAttribute('y', '0');
        textBgRect.setAttribute('width', spanWidth.toString());
        textBgRect.setAttribute('height', textBoxHeight.toString());
        textBgRect.setAttribute('fill', '#ffffff');
        textGroup.appendChild(textBgRect);
        
        // Create text div
        const textDiv = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
        textDiv.style.fontSize = `${fontSizeSVG}px`;
        textDiv.style.lineHeight = `${lineHeight}px`;
        // Use selected font family or default to serif
        const fontFamily = inputs.fontFamily || 'serif';
        textDiv.style.fontFamily = fontFamily === 'serif' ? 'serif' : fontFamily === 'sans-serif' ? 'sans-serif' : fontFamily === 'monospace' ? 'monospace' : `'${fontFamily}', serif`;
        textDiv.style.color = '#000000';
        textDiv.style.width = '100%';
        textDiv.style.height = '100%';
        textDiv.style.padding = `${padding}px`;
        textDiv.style.boxSizing = 'border-box';
        textDiv.style.overflow = 'hidden';
        textDiv.style.wordWrap = 'break-word';
        textDiv.style.hyphens = inputs.hyphenation !== false ? 'auto' : 'none';
        textDiv.textContent = sampleText;
        
        textGroup.appendChild(textDiv);
        svg.appendChild(textGroup);
      }
    }
  }
}

/**
 * Updates the page layout visualization
 * @param inputs - Layout input parameters
 */
export function updateVisualization(inputs: LayoutInputs): void {
  const container = document.getElementById('visualizationContainer');
  if (!container) return;

  // Validate inputs
  if (!inputs.numCols || inputs.numCols <= 0 || isNaN(inputs.numCols)) {
    return;
  }
  if (isNaN(inputs.gutterWidth) || inputs.gutterWidth < 0) {
    return;
  }

  const facingPages = isFacingPages();
  const layerVisibility = getLayerVisibility();

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

  // For facing pages, show two pages side by side (flush, no gap)
  const visWidth = facingPages ? singlePageWidth * 2 : singlePageWidth;
  const visHeight = singlePageHeight;
  
  // SVG dimensions
  const svgWidth = visWidth;
  const svgHeight = visHeight;

  // Calculate scaled dimensions
  const scaleX = singlePageWidth / inputs.pageWidth;
  const scaleY = singlePageHeight / inputs.pageHeight;

  // Create SVG with viewBox
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
  svg.classList.add('page-visualization');
  
  // Sizing will be set in requestAnimationFrame after container dimensions are known

  if (facingPages) {
    // Draw two pages side by side (flush, no gap)
    // Use facing pages specific margins if available
    const innerMarginLeft = inputs.innerMarginLeft !== undefined ? inputs.innerMarginLeft : inputs.leftMargin;
    const innerMarginRight = inputs.innerMarginRight !== undefined ? inputs.innerMarginRight : inputs.leftMargin;
    const outerMarginLeft = inputs.outerMarginLeft !== undefined ? inputs.outerMarginLeft : inputs.rightMargin;
    const outerMarginRight = inputs.outerMarginRight !== undefined ? inputs.outerMarginRight : inputs.rightMargin;
    
    const leftPageX = 0;
    const rightPageX = singlePageWidth;
    
    // Left page: outer margin on left, inner margin on right
    drawPage(
      svg,
      inputs,
      leftPageX,
      0,
      singlePageWidth,
      singlePageHeight,
      outerMarginLeft,  // Left margin (outer)
      innerMarginLeft,  // Right margin (inner)
      inputs.topMargin,
      inputs.bottomMargin,
      scaleX,
      scaleY,
      layerVisibility
    );
    
    // Right page: inner margin on left, outer margin on right
    drawPage(
      svg,
      inputs,
      rightPageX,
      0,
      singlePageWidth,
      singlePageHeight,
      innerMarginRight,  // Left margin (inner)
      outerMarginRight,  // Right margin (outer)
      inputs.topMargin,
      inputs.bottomMargin,
      scaleX,
      scaleY,
      layerVisibility
    );
  } else {
    // Single page
    drawPage(
      svg,
      inputs,
      0,
      0,
      singlePageWidth,
      singlePageHeight,
      inputs.leftMargin,
      inputs.rightMargin,
      inputs.topMargin,
      inputs.bottomMargin,
      scaleX,
      scaleY,
      layerVisibility
    );
  }


  // Clear container and add new SVG
  container.innerHTML = '';
  container.appendChild(svg);

  // Calculate proper sizing based on container dimensions and SVG aspect ratio
  requestAnimationFrame(() => {
    const containerRect = container.getBoundingClientRect();
    const containerStyle = getComputedStyle(container);
    const containerWidth = containerRect.width - 
      (parseFloat(containerStyle.paddingLeft) || 0) - 
      (parseFloat(containerStyle.paddingRight) || 0);
    const containerHeight = containerRect.height - 
      (parseFloat(containerStyle.paddingTop) || 0) - 
      (parseFloat(containerStyle.paddingBottom) || 0);
    
    const svgAspectRatio = svgWidth / svgHeight;
    const isLandscape = svgAspectRatio > 1;
    
    if (isLandscape) {
      // Width is longer - fit by width using percentage sizing
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
    } else {
      // Height is longer - fit by height using explicit pixel dimensions
      const scale = containerHeight / svgHeight;
      const scaledWidth = svgWidth * scale;
      
      if (scaledWidth <= containerWidth) {
        // Height fits, width fits within container
        svg.setAttribute('width', `${scaledWidth}px`);
        svg.setAttribute('height', `${containerHeight}px`);
      } else {
        // Width would exceed container - fall back to fitting by width
        const widthScale = containerWidth / svgWidth;
        svg.setAttribute('width', `${containerWidth}px`);
        svg.setAttribute('height', `${svgHeight * widthScale}px`);
      }
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    }
    
    updateScaleIndicator(container, svg, inputs, facingPages);
  });
}

/**
 * Updates the scale indicator based on actual rendered SVG size
 */
function updateScaleIndicator(
  container: HTMLElement,
  svg: SVGSVGElement,
  inputs: LayoutInputs,
  facingPages: boolean
): void {
  const scaleIndicator = document.getElementById('scaleIndicator');
  if (!scaleIndicator || !container) return;

  // Get actual rendered SVG dimensions
  const svgRect = svg.getBoundingClientRect();
  const actualWidth = svgRect.width;
  const actualHeight = svgRect.height;
  
  // Calculate rendered page dimensions based on SVG aspect ratio
  const totalPageWidth = facingPages ? inputs.pageWidth * 2 : inputs.pageWidth;
  const pageAspectRatio = inputs.pageHeight / totalPageWidth;
  const svgAspectRatio = actualWidth / actualHeight;
  
  // Determine which dimension is constraining
  let renderedPageWidth: number;
  let renderedPageHeight: number;
  
  if (svgAspectRatio > pageAspectRatio) {
    // Height is constraining
    renderedPageHeight = actualHeight;
    renderedPageWidth = actualHeight / pageAspectRatio;
  } else {
    // Width is constraining
    renderedPageWidth = actualWidth;
    renderedPageHeight = actualWidth * pageAspectRatio;
  }
  
  // Calculate scale based on actual rendered size
  const singlePageWidth = facingPages ? renderedPageWidth / 2 : renderedPageWidth;
  const actualScaleX = singlePageWidth / inputs.pageWidth;
  
  // Update scale indicator
  if (actualScaleX < 1) {
    // Preview is smaller than reality
    const ratio = Math.round((1 / actualScaleX) * 100) / 100;
    scaleIndicator.textContent = `Scale: 1:${ratio.toFixed(2)}`;
  } else if (actualScaleX > 1) {
    // Preview is larger than reality
    const ratio = Math.round(actualScaleX * 100) / 100;
    scaleIndicator.textContent = `Scale: ${ratio.toFixed(2)}:1`;
  } else {
    scaleIndicator.textContent = 'Scale: 1:1';
  }
}
