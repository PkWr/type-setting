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

/**
 * Gets the currently selected unit
 */
function getCurrentUnit() {
  const unitSelect = document.getElementById('unitSelect') as HTMLSelectElement;
  return unitSelect?.value || 'mm';
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

  // Create SVG
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.classList.add('page-visualization');

  if (facingPages) {
    // TODO: Stage 1 - Facing pages will be added later
    // For now, just show single page
  }

  // STAGE 1: Basic page background and margins
  // Page background
  const pageRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  pageRect.setAttribute('x', pageOffsetX.toString());
  pageRect.setAttribute('y', pageOffsetY.toString());
  pageRect.setAttribute('width', singlePageWidth.toString());
  pageRect.setAttribute('height', visHeight.toString());
  pageRect.setAttribute('fill', '#ffffff');
  pageRect.setAttribute('stroke', '#000000');
  pageRect.setAttribute('stroke-width', '1');
  svg.appendChild(pageRect);

  // Margins area (only if margins layer is visible) - using keylines instead of fills
  if (layerVisibility.margins) {
    // Draw margin keylines (rectangles with strokes, no fill)
    const marginRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    marginRect.setAttribute('x', (pageOffsetX + scaledLeftMargin).toString());
    marginRect.setAttribute('y', (pageOffsetY + scaledTopMargin).toString());
    marginRect.setAttribute('width', (singlePageWidth - scaledLeftMargin - scaledRightMargin).toString());
    marginRect.setAttribute('height', (visHeight - scaledTopMargin - scaledBottomMargin).toString());
    marginRect.setAttribute('fill', 'none');
    marginRect.setAttribute('stroke', '#000000');
    marginRect.setAttribute('stroke-width', '1');
    svg.appendChild(marginRect);
  }

  // STAGE 2: Add column rectangles (keylines only, no fills)
  if (layerVisibility.columns && inputs.numCols > 0) {
    const textBoxX = pageOffsetX + scaledLeftMargin;
    const textBoxY = pageOffsetY + scaledTopMargin;
    const textBoxWidth = singlePageWidth - scaledLeftMargin - scaledRightMargin;
    const textBoxHeight = visHeight - scaledTopMargin - scaledBottomMargin;
    
    // Calculate column dimensions
    const scaledGutterWidth = inputs.gutterWidth * scaleX;
    const totalGutters = (inputs.numCols - 1) * scaledGutterWidth;
    const availableWidth = textBoxWidth - totalGutters;
    const columnWidth = availableWidth / inputs.numCols;
    
    // Draw each column as a rectangle with keyline only
    for (let i = 0; i < inputs.numCols; i++) {
      const colX = textBoxX + (i * (columnWidth + scaledGutterWidth));
      const colRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      colRect.setAttribute('x', colX.toString());
      colRect.setAttribute('y', textBoxY.toString());
      colRect.setAttribute('width', columnWidth.toString());
      colRect.setAttribute('height', textBoxHeight.toString());
      colRect.setAttribute('fill', 'none');
      colRect.setAttribute('stroke', '#000000');
      colRect.setAttribute('stroke-width', '1');
      svg.appendChild(colRect);
    }
    
    // Draw column dividers (vertical lines between columns)
    for (let i = 0; i < inputs.numCols - 1; i++) {
      const dividerX = textBoxX + ((i + 1) * columnWidth) + (i * scaledGutterWidth) + (scaledGutterWidth / 2);
      const divider = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      divider.setAttribute('x1', dividerX.toString());
      divider.setAttribute('y1', textBoxY.toString());
      divider.setAttribute('x2', dividerX.toString());
      divider.setAttribute('y2', (textBoxY + textBoxHeight).toString());
      divider.setAttribute('stroke', '#000000');
      divider.setAttribute('stroke-width', '1');
      svg.appendChild(divider);
    }
  }

  // Page dimensions label
  const labelText = `${inputs.pageWidth} × ${inputs.pageHeight} mm`;
  const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  label.setAttribute('x', (svgWidth / 2).toString());
  label.setAttribute('y', (svgHeight - 5).toString());
  label.setAttribute('font-size', '10');
  label.setAttribute('font-family', 'sans-serif');
  label.setAttribute('fill', '#64748b');
  label.setAttribute('text-anchor', 'middle');
  label.textContent = labelText;
  svg.appendChild(label);

  // Clear container and add new SVG
  container.innerHTML = '';
  container.appendChild(svg);
}
