import { CONFIG } from '../config.js';

export function calculate(context) {
  const { products } = context;
  const metricConfig = CONFIG.metrics.categorised;

  if (!products || products.length === 0) {
    return {
      numerator: 0, denominator: 0, percentage: null,
      label: metricConfig.label,
      caveat: 'No products found in sample.',
      debugInfo: {},
    };
  }

  const categorised = products.filter((p) => Array.isArray(p.categories) && p.categories.length > 0);
  const numerator = categorised.length;
  const denominator = products.length;
  const percentage = Math.round((numerator / denominator) * 1000) / 10;

  return {
    numerator, denominator, percentage,
    label: metricConfig.label,
    caveat: null,
    debugInfo: {
      totalProducts: denominator,
      categorisedProducts: numerator,
      uncategorisedProducts: denominator - numerator,
    },
  };
}
