/**
 * Metric: Structured attribute types
 *
 * Calculates the percentage of attributes in the PIM catalog that are a
 * "structured" type — meaning their values are constrained and machine-readable
 * rather than free-form text or media.
 *
 * Structured types (from CONFIG.STRUCTURED_ATTRIBUTE_TYPES):
 *   pim_catalog_identifier, pim_catalog_number, pim_catalog_boolean,
 *   pim_catalog_metric, pim_catalog_simpleselect, pim_catalog_multiselect,
 *   pim_catalog_price_collection, pim_catalog_date
 *
 * Unstructured (not counted): text, textarea, image, file, asset_collection,
 *   reference_entity, table, and any other types not in the above set.
 *
 * The denominator is the TOTAL attribute count — not just product attributes.
 * This includes attributes used by product models, reference entities, etc.
 *
 * @apiDependency None — operates on pre-fetched attribute data from
 *               fetchAttributeList.ts.
 */

import type { MetricContext, MetricResult, DebugEntry } from '../types';

/**
 * Calculates the percentage of catalog attributes that are structured types.
 *
 * @param context - Shared metric context containing products, attributes, config.
 * @returns       MetricResult with numerator = structured attributes,
 *                denominator = total attributes.
 */
export function calculate(context: MetricContext): MetricResult {
  const { attributes, config } = context;
  const debugInfo: DebugEntry[] = [];

  const denominator = attributes.length;

  if (denominator === 0) {
    debugInfo.push({ step: 'GUARD', message: 'No attributes returned from PIM' });
    return {
      numerator: 0,
      denominator: 0,
      percentage: null,
      label: 'Attributes that are structured types',
      caveat: 'No attributes were returned. Check that the PIM API is accessible and the attribute list endpoint is responding.',
      debugInfo,
    };
  }

  // Count by type for debug visibility.
  const typeCounts = new Map<string, number>();
  let numerator = 0;

  for (const attr of attributes) {
    const type = attr.type ?? '';
    typeCounts.set(type, (typeCounts.get(type) ?? 0) + 1);
    if (config.STRUCTURED_ATTRIBUTE_TYPES.has(type)) {
      numerator++;
    }
  }

  const percentage = Math.round((numerator / denominator) * 1000) / 10;

  debugInfo.push({
    step: 'CALCULATE',
    message: `${numerator}/${denominator} attributes are structured types`,
    count: numerator,
  });

  if (config.DEBUG_MODE) {
    const breakdown = [...typeCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => `${type}: ${count}`)
      .join(', ');
    console.debug(`[STRUCTURED_TYPES] ${debugInfo[0].message}`);
    console.debug(`[STRUCTURED_TYPES] Type breakdown: ${breakdown}`);
  }

  return {
    numerator,
    denominator,
    percentage,
    label: 'Attributes that are structured types',
    caveat: `Structured types counted: identifier, number, boolean, metric, simpleselect, multiselect, price, date. Based on ${denominator} total attributes.`,
    debugInfo,
  };
}
