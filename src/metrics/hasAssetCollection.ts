/**
 * Metric: Products with an asset collection populated
 *
 * Calculates the percentage of sampled products that have at least one
 * non-empty asset collection attribute value.
 *
 * Asset collection attribute codes are discovered dynamically from the
 * attribute list by filtering for type === CONFIG.ASSET_COLLECTION_ATTR_TYPE.
 * No attribute codes are hardcoded.
 *
 * A product counts if ANY of its asset collection attribute values contains
 * at least one asset code, across all locales and scopes.
 *
 * @apiDependency None — operates on pre-fetched product and attribute data
 *               from fetchProductSample.ts and fetchAttributeList.ts.
 */

import type { MetricContext, MetricResult, DebugEntry } from '../types';

/**
 * Calculates the percentage of sampled products with ≥1 asset collection
 * attribute populated.
 *
 * @param context - Shared metric context containing products, attributes, config.
 * @returns       MetricResult with numerator = products with asset data,
 *                denominator = total products in sample.
 */
export function calculate(context: MetricContext): MetricResult {
  const { products, attributes, config } = context;
  const debugInfo: DebugEntry[] = [];

  const denominator = products.length;

  if (denominator === 0) {
    debugInfo.push({ step: 'GUARD', message: 'No products in sample' });
    return {
      numerator: 0,
      denominator: 0,
      percentage: null,
      label: 'Products with an asset collection populated',
      caveat: 'No products were found in the sample window.',
      debugInfo,
    };
  }

  // Discover asset collection attribute codes dynamically.
  const assetCollectionCodes = new Set(
    attributes
      .filter((a) => a.type === config.ASSET_COLLECTION_ATTR_TYPE)
      .map((a) => a.code),
  );

  debugInfo.push({
    step: 'DISCOVER',
    message: `Found ${assetCollectionCodes.size} asset collection attribute(s): ${[...assetCollectionCodes].join(', ')}`,
    count: assetCollectionCodes.size,
  });

  if (config.DEBUG_MODE) {
    console.debug(`[HAS_ASSET_COLLECTION] ${debugInfo[0].message}`);
  }

  // If no asset collection attributes exist in this catalog, return null.
  if (assetCollectionCodes.size === 0) {
    return {
      numerator: 0,
      denominator,
      percentage: null,
      label: 'Products with an asset collection populated',
      caveat: 'No asset collection attributes (pim_catalog_asset_collection) were found in this catalog.',
      debugInfo,
    };
  }

  // Count products with at least one populated asset collection value.
  let numerator = 0;
  for (const product of products) {
    const values = product.values ?? {};
    let hasAsset = false;

    for (const code of assetCollectionCodes) {
      const entries = values[code];
      if (!Array.isArray(entries)) continue;

      for (const entry of entries) {
        // Asset collection data is an array of asset codes (string[]).
        const assetCodes = entry.data;
        if (Array.isArray(assetCodes) && assetCodes.length > 0) {
          hasAsset = true;
          break;
        }
      }

      if (hasAsset) break;
    }

    if (hasAsset) numerator++;
  }

  const percentage = Math.round((numerator / denominator) * 1000) / 10;

  debugInfo.push({
    step: 'CALCULATE',
    message: `${numerator}/${denominator} products have at least one asset collection populated`,
    count: numerator,
  });

  if (config.DEBUG_MODE) {
    console.debug(`[HAS_ASSET_COLLECTION] ${debugInfo[debugInfo.length - 1].message}`);
  }

  return {
    numerator,
    denominator,
    percentage,
    label: 'Products with an asset collection populated',
    caveat: `Checks ${assetCollectionCodes.size} asset collection attribute(s) discovered dynamically. Based on ${denominator} products (first ${config.MAX_PRODUCT_PAGES * config.PRODUCTS_PAGE_SIZE} by API order).`,
    debugInfo,
  };
}
