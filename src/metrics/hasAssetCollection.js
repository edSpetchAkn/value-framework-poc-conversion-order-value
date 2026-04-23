import { CONFIG } from '../config.js';

export function calculate(context) {
  const { products, attributes } = context;
  const metricConfig = CONFIG.metrics.hasAssetCollection;

  const assetCollectionCodes = (attributes || [])
    .filter((a) => a.type === CONFIG.assetCollectionAttributeType)
    .map((a) => a.code);

  if (assetCollectionCodes.length === 0) {
    return {
      numerator: null, denominator: products ? products.length : 0, percentage: null,
      label: metricConfig.label,
      caveat: 'No asset collection attributes found in this PIM instance. This metric is not applicable.',
      debugInfo: { assetCollectionCodes: [] },
    };
  }

  if (!products || products.length === 0) {
    return {
      numerator: 0, denominator: 0, percentage: null,
      label: metricConfig.label,
      caveat: 'No products found in sample.',
      debugInfo: { assetCollectionCodes },
    };
  }

  let withAssets = 0;
  const withoutUuids = [];

  for (const product of products) {
    const values = product.values;
    let hasAssets = false;
    if (values && typeof values === 'object') {
      for (const code of assetCollectionCodes) {
        const entries = values[code];
        if (!Array.isArray(entries)) continue;
        if (entries.some((entry) => Array.isArray(entry.data) && entry.data.length > 0)) {
          hasAssets = true;
          break;
        }
      }
    }
    if (hasAssets) { withAssets++; } else { withoutUuids.push(product.uuid); }
  }

  const numerator = withAssets;
  const denominator = products.length;
  const percentage = Math.round((numerator / denominator) * 1000) / 10;

  return {
    numerator, denominator, percentage,
    label: metricConfig.label,
    caveat: null,
    debugInfo: {
      totalProducts: denominator,
      productsWithAssets: numerator,
      productsWithoutAssets: denominator - numerator,
      assetCollectionCodes,
      exampleWithoutUuids: withoutUuids.slice(0, 5),
    },
  };
}
