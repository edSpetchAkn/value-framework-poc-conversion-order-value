/**
 * Metric: Products categorised
 *
 * Calculates the percentage of sampled products that have at least one
 * category assigned. Products with an empty `categories` array or no
 * `categories` field are counted as uncategorised.
 *
 * @apiDependency None — operates on pre-fetched product data from
 *               fetchProductSample.ts. The `categories` field is always
 *               present in the product_uuid_v1 response.
 */

import type { MetricContext, MetricResult, DebugEntry } from '../types';

/**
 * Calculates the percentage of sampled products with at least one category.
 *
 * @param context - Shared metric context containing products, attributes, config.
 * @returns       MetricResult with numerator = categorised products,
 *                denominator = total products in sample.
 */
export function calculate(context: MetricContext): MetricResult {
  const { products, config } = context;
  const debugInfo: DebugEntry[] = [];

  const denominator = products.length;

  if (denominator === 0) {
    debugInfo.push({ step: 'GUARD', message: 'No products in sample' });
    return {
      numerator: 0,
      denominator: 0,
      percentage: null,
      label: 'Products categorised',
      caveat: 'No products were found in the sample window.',
      debugInfo,
    };
  }

  let numerator = 0;
  for (const product of products) {
    if (Array.isArray(product.categories) && product.categories.length > 0) {
      numerator++;
    }
  }

  const percentage = Math.round((numerator / denominator) * 1000) / 10;

  debugInfo.push({
    step: 'CALCULATE',
    message: `${numerator}/${denominator} products have at least one category`,
    count: numerator,
  });

  if (config.DEBUG_MODE) {
    console.debug(`[CATEGORISED] ${debugInfo[0].message}`);
  }

  return {
    numerator,
    denominator,
    percentage,
    label: 'Products categorised',
    caveat: `Based on ${denominator} products (first ${config.MAX_PRODUCT_PAGES * config.PRODUCTS_PAGE_SIZE} by API order).`,
    debugInfo,
  };
}
