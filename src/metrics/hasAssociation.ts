/**
 * Metric: Products with an association or product link populated
 *
 * Calculates the percentage of sampled products that have at least one of:
 *   - A non-empty standard association (any association type, e.g. UPSELL,
 *     CROSSSELL, X_SELL, SUBSTITUTION, PACK) stored in `product.associations`
 *   - A non-empty product link attribute value stored in `product.values`
 *     (type pim_catalog_product_link, discovered dynamically from the attribute list)
 *
 * A product passes if EITHER condition is true (OR logic).
 * Association types and product link attribute codes are never hardcoded.
 *
 * @apiDependency None — operates on pre-fetched product and attribute data
 *               from fetchProductSample.ts and fetchAttributeList.ts.
 */

import type { MetricContext, MetricResult, DebugEntry } from '../types';

/**
 * Returns true if the product has at least one non-empty standard association.
 *
 * @param product - A Product from the SDK.
 * @returns       True if any association group contains at least one item.
 */
function hasAnyAssociation(product: Product): boolean {
  const associations = product.associations;
  if (!associations || typeof associations !== 'object') return false;

  for (const type of Object.keys(associations)) {
    const group = associations[type];
    if (!group) continue;
    if ((group.products?.length ?? 0) > 0) return true;
    if ((group.product_models?.length ?? 0) > 0) return true;
    if ((group.groups?.length ?? 0) > 0) return true;
  }

  return false;
}

/**
 * Returns true if the product has at least one non-empty product link
 * attribute value for any of the given attribute codes.
 *
 * Product link attribute values are arrays of linked product identifiers
 * stored in `product.values[attrCode][].data`.
 *
 * @param product          - A Product from the SDK.
 * @param productLinkCodes - Set of attribute codes with type pim_catalog_product_link.
 * @returns                True if any product link attribute has ≥1 linked product.
 */
function hasAnyProductLink(product: Product, productLinkCodes: Set<string>): boolean {
  const values = product.values ?? {};
  for (const code of productLinkCodes) {
    const entries = values[code];
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      // Product link data is an array of linked product identifiers/UUIDs.
      const linked = entry.data;
      if (Array.isArray(linked) && linked.length > 0) return true;
    }
  }
  return false;
}

/**
 * Calculates the percentage of sampled products with at least one association
 * or product link attribute populated.
 *
 * @param context - Shared metric context containing products, attributes, config.
 * @returns       MetricResult with numerator = products with ≥1 association or
 *                product link, denominator = total products in sample.
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
      label: 'Products with an association or product link populated',
      metricKey: 'hasAssociation' as const,
      caveat: 'No products were found in the sample.',
      debugInfo,
    };
  }

  // Discover product link attribute codes dynamically.
  const productLinkCodes = new Set(
    attributes
      .filter((a) => a.type === config.PRODUCT_LINK_ATTR_TYPE)
      .map((a) => a.code),
  );

  debugInfo.push({
    step: 'DISCOVER',
    message: `Found ${productLinkCodes.size} product link attribute(s)${productLinkCodes.size > 0 ? ': ' + [...productLinkCodes].join(', ') : ''}`,
    count: productLinkCodes.size,
  });

  if (config.DEBUG_MODE) {
    console.debug(`[HAS_ASSOCIATION] ${debugInfo[0].message}`);
  }

  let viaAssociation = 0;
  let viaProductLink = 0;
  let numerator = 0;

  for (const product of products) {
    const assoc = hasAnyAssociation(product);
    const link = productLinkCodes.size > 0 && hasAnyProductLink(product, productLinkCodes);
    if (assoc) viaAssociation++;
    if (link) viaProductLink++;
    if (assoc || link) numerator++;
  }

  const percentage = Math.round((numerator / denominator) * 1000) / 10;

  debugInfo.push({
    step: 'CALCULATE',
    message: `${numerator}/${denominator} products pass (${viaAssociation} via association, ${viaProductLink} via product link)`,
    count: numerator,
  });

  if (config.DEBUG_MODE) {
    console.debug(`[HAS_ASSOCIATION] ${debugInfo[debugInfo.length - 1].message}`);
  }

  const linkNote = productLinkCodes.size > 0
    ? `${productLinkCodes.size} product link attribute(s) and all association types checked dynamically.`
    : 'No product link attributes found in this catalog — associations only.';

  return {
    numerator,
    denominator,
    percentage,
    label: 'Products with an association or product link populated',
    metricKey: 'hasAssociation' as const,
    caveat: `${linkNote} Based on ${denominator} products (first ${config.MAX_PRODUCT_PAGES * config.PRODUCTS_PAGE_SIZE} by API order).`,
    debugInfo,
  };
}
