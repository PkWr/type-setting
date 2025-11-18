/**
 * Units Module for Typography Layout Calculator
 * Handles unit conversions and descriptions
 */

export type Unit = 'mm' | 'pt' | 'em' | 'pc';

export interface UnitInfo {
  name: string;
  abbreviation: string;
  description: string;
  conversionToMM: number; // Conversion factor: 1 unit = X mm
}

export const UNITS: Record<Unit, UnitInfo> = {
  mm: {
    name: 'Millimeters',
    abbreviation: 'mm',
    description: 'Metric unit, standard for print design (1mm = 0.03937 inches)',
    conversionToMM: 1,
  },
  pt: {
    name: 'Points',
    abbreviation: 'pt',
    description: 'Typography unit, 1/72 inch (1pt = 0.3528mm, standard for font sizes)',
    conversionToMM: 0.3528,
  },
  em: {
    name: 'Ems',
    abbreviation: 'em',
    description: 'Relative to font size, 1em = current font size (typographic spacing)',
    conversionToMM: 0.3528, // Default: 1em = 1pt = 0.3528mm, but will be dynamic based on type size
  },
  pc: {
    name: 'Picas',
    abbreviation: 'pc',
    description: 'Typography unit, 12 points (1pc = 12pt = 4.2336mm)',
    conversionToMM: 4.2336,
  },
};

/**
 * Converts millimeters to the specified unit
 * @param valueMM - Value in millimeters
 * @param unit - Target unit
 * @param typeSize - Type size in points (required for em conversion)
 * @returns Converted value
 */
export function convertFromMM(valueMM: number, unit: Unit, typeSize: number = 12): number {
  if (unit === 'em') {
    // 1em = typeSize in points = typeSize * 0.3528 mm
    const emInMM = typeSize * 0.3528;
    return valueMM / emInMM;
  }
  return valueMM / UNITS[unit].conversionToMM;
}

/**
 * Converts value from specified unit to millimeters
 * @param value - Value in source unit
 * @param unit - Source unit
 * @param typeSize - Type size in points (required for em conversion)
 * @returns Value in millimeters
 */
export function convertToMM(value: number, unit: Unit, typeSize: number = 12): number {
  if (unit === 'em') {
    // 1em = typeSize in points = typeSize * 0.3528 mm
    const emInMM = typeSize * 0.3528;
    return value * emInMM;
  }
  return value * UNITS[unit].conversionToMM;
}

/**
 * Formats a value with unit abbreviation
 * @param value - Value to format
 * @param unit - Unit abbreviation
 * @param decimals - Number of decimal places
 * @returns Formatted string
 */
export function formatValue(value: number, unit: Unit, decimals: number = 2): string {
  return `${value.toFixed(decimals)} ${UNITS[unit].abbreviation}`;
}

