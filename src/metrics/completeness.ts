/**
 * Metric: Completeness per channel at 100%
 *
 * Calculates the percentage of sampled products that have 100% completeness
 * on each channel discovered in the data. Returns one result per channel.
 *
 * A product is 100% complete on a channel when ALL of its completeness entries
 * for that channel have `data === 100`. If a product has no completeness entries
 * for a channel, it is counted as not complete on that channel.
 *
 * Channels are discovered dynamically from the `completenesses` array on each
 * product — no channel codes are hardcoded. The preferred channel (from
 * CONFIG.DEFAULT_CHANNEL) is sorted first in the returned array.
 *
 * @apiDependency None — operates on pre-fetched product data with
 *               `withCompletenesses: true` from fetchProductSample.ts.
 */

import type { MetricContext, CompletenessChannelResult, DebugEntry } from '../types';

/**
 * Calculates per-channel completeness-at-100% for the sampled product set.
 *
 * @param context - Shared metric context containing products, attributes, config.
 * @returns       Array of CompletenessChannelResult, one per channel found in
 *                the data. Returns a single null-percentage result if no
 *                completeness data is present at all.
 */
export function calculate(context: MetricContext): CompletenessChannelResult[] {
  const { products, config } = context;
  const debugInfo: DebugEntry[] = [];

  // Guard: empty sample.
  if (products.length === 0) {
    debugInfo.push({ step: 'GUARD', message: 'No products in sample' });
    return [
      {
        channelCode: config.DEFAULT_CHANNEL,
        numerator: 0,
        denominator: 0,
        percentage: null,
        caveat: 'No products were found in the sample window. Expand the date range or check the PIM has recently-updated products.',
        debugInfo,
      },
    ];
  }

  // Discover all channel codes from the completeness data.
  const channelSet = new Set<string>();
  for (const product of products) {
    for (const c of product.completenesses ?? []) {
      if (c.scope) channelSet.add(c.scope);
    }
  }

  debugInfo.push({
    step: 'DISCOVER',
    message: `Discovered ${channelSet.size} channel(s) from completeness data: ${[...channelSet].join(', ')}`,
    count: channelSet.size,
  });

  if (config.DEBUG_MODE) {
    console.debug(`[COMPLETENESS] ${debugInfo[debugInfo.length - 1].message}`);
  }

  // Guard: no completeness data at all (withCompletenesses not working, or
  // products have no family so no required attributes).
  if (channelSet.size === 0) {
    debugInfo.push({ step: 'GUARD', message: 'No completeness data found on any product' });
    return [
      {
        channelCode: config.DEFAULT_CHANNEL,
        numerator: 0,
        denominator: products.length,
        percentage: null,
        caveat:
          'No completeness data was returned. This may mean the sampled products have no family assigned, or the withCompletenesses flag is not supported on this PIM version.',
        debugInfo,
      },
    ];
  }

  // Sort channels: preferred channel first, rest alphabetically.
  const channels = [...channelSet].sort((a, b) => {
    if (a === config.DEFAULT_CHANNEL) return -1;
    if (b === config.DEFAULT_CHANNEL) return 1;
    return a.localeCompare(b);
  });

  // Calculate per-channel results.
  return channels.map((channelCode) => {
    const channelDebug: DebugEntry[] = [...debugInfo];
    let complete = 0;

    for (const product of products) {
      const channelEntries = (product.completenesses ?? []).filter(
        (c) => c.scope === channelCode,
      );

      if (channelEntries.length === 0) {
        // No completeness data for this channel on this product → not complete.
        continue;
      }

      const allComplete = channelEntries.every((c) => c.data === 100);
      if (allComplete) complete++;
    }

    const denominator = products.length;
    const percentage = denominator > 0 ? Math.round((complete / denominator) * 1000) / 10 : null;

    channelDebug.push({
      step: 'CALCULATE',
      message: `Channel "${channelCode}": ${complete}/${denominator} products at 100% completeness`,
      count: complete,
    });

    if (config.DEBUG_MODE) {
      console.debug(`[COMPLETENESS] ${channelDebug[channelDebug.length - 1].message}`);
    }

    return {
      channelCode,
      numerator: complete,
      denominator,
      percentage,
      caveat:
        denominator > 0
          ? `Based on ${denominator} products (first ${config.MAX_PRODUCT_PAGES * config.PRODUCTS_PAGE_SIZE} by API order).`
          : null,
      debugInfo: channelDebug,
    };
  });
}
