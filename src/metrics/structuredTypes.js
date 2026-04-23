import { CONFIG } from '../config.js';

export function calculate(context) {
  const { attributes } = context;
  const metricConfig = CONFIG.metrics.structuredTypes;
  const structuredTypes = new Set(CONFIG.structuredAttributeTypes);

  if (!attributes || attributes.length === 0) {
    return {
      numerator: 0, denominator: 0, percentage: null,
      label: metricConfig.label,
      caveat: 'No attributes found in this PIM instance.',
      debugInfo: {},
    };
  }

  const structuredBreakdown = {};
  const unstructuredBreakdown = {};

  for (const attr of attributes) {
    const type = attr.type ?? '';
    if (structuredTypes.has(type)) {
      structuredBreakdown[type] = (structuredBreakdown[type] || 0) + 1;
    } else {
      unstructuredBreakdown[type] = (unstructuredBreakdown[type] || 0) + 1;
    }
  }

  const numerator = Object.values(structuredBreakdown).reduce((sum, n) => sum + n, 0);
  const denominator = attributes.length;
  const percentage = Math.round((numerator / denominator) * 1000) / 10;

  return {
    numerator, denominator, percentage,
    label: metricConfig.label,
    caveat: `Structured types counted: date, identifier, measurement, multi-select, number, price, reference entity single link, reference entity multiple links, simple select, table, yes/no. Based on ${denominator} total attributes.`,
    debugInfo: {
      totalAttributes: denominator,
      structuredAttributes: numerator,
      unstructuredAttributes: denominator - numerator,
      structuredBreakdown,
      unstructuredBreakdown,
    },
  };
}
