/**
 * Metric: Products with a Product Model parent
 *
 * Calculates the percentage of sampled products that have a non-null `parent`
 * field, indicating they are variant products belonging to a product model.
 *
 * Products with no product model parent (simple products) have `parent: null`.
 * Variant products have `parent` set to the product model's code string.
 *
 * @apiDependency None — operates on pre-fetched product data from
 *               fetchProductSample.ts. The `parent` field is always present
 *               in the product_uuid_v1 response.
 */

import type { MetricContext, MetricResult, DebugEntry } from '../types';

/**
 * Calculates the percentage of sampled products with a Product Model parent.
 *
 * @param context - Shared metric context containing products, attributes, config.
 * @returns       MetricResult with numerator = products with a parent,
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
      label: 'Products with a Product Model parent',
      metricKey: 'hasParent' as const,
      caveat: 'No products were found in the sample window.',
      debugInfo,
    };
  }

  let numerator = 0;
  for (const product of products) {
    if (product.parent != null && product.parent !== '') {
      numerator++;
    }
  }

  const percentage = Math.round((numerator / denominator) * 1000) / 10;

  debugInfo.push({
    step: 'CALCULATE',
    message: `${numerator}/${denominator} products have a Product Model parent`,
    count: numerator,
  });

  if (config.DEBUG_MODE) {
    console.debug(`[HAS_PARENT] ${debugInfo[0].message}`);
  }

  return {
    numerator,
    denominator,
    percentage,
    label: 'Products with a Product Model parent',
    metricKey: 'hasParent' as const,
    caveat: `Based on ${denominator} products (first ${config.MAX_PRODUCT_PAGES * config.PRODUCTS_PAGE_SIZE} by API order).`,
    debugInfo,
  };
}
