import { CONFIG } from '../config.js';

export function calculate(context) {
  const { products, attributes } = context;
  const metricConfig = CONFIG.metrics.hasAssociation;
  const productLinkTypes = new Set(CONFIG.productLinkAttributeTypes);

  if (!products || products.length === 0) {
    return {
      numerator: 0, denominator: 0, percentage: null,
      label: metricConfig.label,
      caveat: 'No products found in sample.',
      debugInfo: {},
    };
  }

  const productLinkAttributeCodes = (attributes || [])
    .filter((a) => productLinkTypes.has(a.type))
    .map((a) => a.code);

  const associationTypesFound = new Set();
  let productsWithAssociations = 0;
  let productsWithProductLinks = 0;
  let productsWithEither = 0;

  for (const product of products) {
    let hasAssoc = false;
    const assocs = product.associations;
    if (assocs && typeof assocs === 'object') {
      for (const typeCode of Object.keys(assocs)) {
        const data = assocs[typeCode];
        if (!data) continue;
        const hasProducts = Array.isArray(data.products) && data.products.length > 0;
        const hasModels = Array.isArray(data.product_models) && data.product_models.length > 0;
        if (hasProducts || hasModels) { hasAssoc = true; associationTypesFound.add(typeCode); }
      }
    }
    let hasLinks = false;
    if (productLinkAttributeCodes.length > 0) {
      const values = product.values;
      if (values && typeof values === 'object') {
        for (const code of productLinkAttributeCodes) {
          const entries = values[code];
          if (!Array.isArray(entries)) continue;
          const nonEmpty = entries.some((entry) => {
            const d = entry.data;
            return d !== null && d !== undefined && d !== '' && !(Array.isArray(d) && d.length === 0);
          });
          if (nonEmpty) { hasLinks = true; break; }
        }
      }
    }
    if (hasAssoc) productsWithAssociations++;
    if (hasLinks) productsWithProductLinks++;
    if (hasAssoc || hasLinks) productsWithEither++;
  }

  const numerator = productsWithEither;
  const denominator = products.length;
  const percentage = Math.round((numerator / denominator) * 1000) / 10;

  let caveat = null;
  if (!productLinkAttributeCodes.length) {
    caveat = 'No product link attributes found. Metric is based on associations only.';
  } else if (!associationTypesFound.size) {
    caveat = 'Metric is based on product link attributes only. No association data detected.';
  }

  return {
    numerator, denominator, percentage,
    label: metricConfig.label,
    caveat,
    debugInfo: {
      totalProducts: denominator,
      productsWithAssociations,
      productsWithProductLinks,
      productsWithEither: numerator,
      productLinkAttributeCodes,
      associationTypesFound: Array.from(associationTypesFound),
    },
  };
}
