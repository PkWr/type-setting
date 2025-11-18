/**
 * Visualization Module for Typography Layout Calculator
 * Creates SVG-based visual representation of page layout
 */

import { LayoutInputs } from './types';
import { calculateLayout } from './calculator';

const VISUALIZATION_SIZE = 400; // Maximum size for the visualization in pixels
const MIN_MARGIN_VISUAL = 2; // Minimum margin size in pixels for visibility

/**
 * Updates the page layout visualization
 * @param inputs - Layout input parameters
 */
export function updateVisualization(inputs: LayoutInputs): void {
  const container = document.getElementById('visualizationContainer');
  if (!container) return;

  const results = calculateLayout(inputs);

  // Calculate scale to fit visualization
  const aspectRatio = inputs.pageHeight / inputs.pageWidth;
  let visWidth: number;
  let visHeight: number;

  if (aspectRatio > 1) {
    // Portrait orientation
    visHeight = VISUALIZATION_SIZE;
    visWidth = VISUALIZATION_SIZE / aspectRatio;
  } else {
    // Landscape orientation
    visWidth = VISUALIZATION_SIZE;
    visHeight = VISUALIZATION_SIZE * aspectRatio;
  }

  // Calculate scaled dimensions
  const scaleX = visWidth / inputs.pageWidth;
  const scaleY = visHeight / inputs.pageHeight;

  // Calculate scaled margins
  const scaledTopMargin = Math.max(inputs.topMargin * scaleY, MIN_MARGIN_VISUAL);
  const scaledBottomMargin = Math.max(inputs.bottomMargin * scaleY, MIN_MARGIN_VISUAL);
  const scaledLeftMargin = Math.max(inputs.leftMargin * scaleX, MIN_MARGIN_VISUAL);
  const scaledRightMargin = Math.max(inputs.rightMargin * scaleX, MIN_MARGIN_VISUAL);

  // Calculate text box area
  const textBoxX = scaledLeftMargin;
  const textBoxY = scaledTopMargin;
  const textBoxWidth = visWidth - scaledLeftMargin - scaledRightMargin;
  const textBoxHeight = visHeight - scaledTopMargin - scaledBottomMargin;

  // Calculate column positions
  const scaledGutterWidth = inputs.gutterWidth * scaleX;
  const scaledColumnWidth = results.columnWidth * scaleX;
  const totalGutters = (inputs.numCols - 1) * scaledGutterWidth;
  const availableWidth = textBoxWidth - totalGutters;
  const actualColumnWidth = availableWidth / inputs.numCols;

  // Create SVG
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${visWidth} ${visHeight}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.classList.add('page-visualization');

  // Page background
  const pageRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  pageRect.setAttribute('x', '0');
  pageRect.setAttribute('y', '0');
  pageRect.setAttribute('width', visWidth.toString());
  pageRect.setAttribute('height', visHeight.toString());
  pageRect.setAttribute('fill', '#ffffff');
  pageRect.setAttribute('stroke', '#1e293b');
  pageRect.setAttribute('stroke-width', '2');
  svg.appendChild(pageRect);

  // Margins area (semi-transparent overlay)
  const marginPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const marginD = `
    M 0,0
    L ${visWidth},0
    L ${visWidth},${visHeight}
    L 0,${visHeight}
    Z
    M ${scaledLeftMargin},${scaledTopMargin}
    L ${visWidth - scaledRightMargin},${scaledTopMargin}
    L ${visWidth - scaledRightMargin},${visHeight - scaledBottomMargin}
    L ${scaledLeftMargin},${visHeight - scaledBottomMargin}
    Z
  `;
  marginPath.setAttribute('d', marginD);
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
  for (let i = 0; i < inputs.numCols; i++) {
    const colX = textBoxX + (i * (actualColumnWidth + scaledGutterWidth));
    
    // Column rectangle
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

    // Column divider line
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

  // Page dimensions label
  addLabel(visWidth / 2, visHeight + 15, `${inputs.pageWidth} × ${inputs.pageHeight} mm`, 'page-dimensions');

  // Margin labels (if visible)
  if (scaledTopMargin > 5) {
    addLabel(visWidth / 2, scaledTopMargin / 2, `Top: ${inputs.topMargin}mm`, 'margin-label');
  }
  if (scaledLeftMargin > 5) {
    const leftLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    leftLabel.setAttribute('x', (scaledLeftMargin / 2).toString());
    leftLabel.setAttribute('y', (visHeight / 2).toString());
    leftLabel.setAttribute('font-size', '10');
    leftLabel.setAttribute('font-family', 'sans-serif');
    leftLabel.setAttribute('fill', '#64748b');
    leftLabel.setAttribute('text-anchor', 'middle');
    leftLabel.setAttribute('transform', `rotate(-90 ${scaledLeftMargin / 2} ${visHeight / 2})`);
    leftLabel.textContent = `Left: ${inputs.leftMargin}mm`;
    svg.appendChild(leftLabel);
  }

  // Clear container and add new SVG
  container.innerHTML = '';
  container.appendChild(svg);
}

