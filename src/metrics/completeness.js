/**
 * completeness.js
 *
 * Calculates % of products with 100% completeness per channel.
 * Discovers channels dynamically; sorts preferred channel first.
 */

import { CONFIG } from '../config.js';

export function calculate(context) {
  const { products } = context;

  if (!products || products.length === 0) {
    return [{
      channelCode: 'unknown',
      numerator: 0,
      denominator: 0,
      percentage: null,
      caveat: 'No products found in sample.',
      debugInfo: {},
    }];
  }

  const channelMap = new Map();

  for (const product of products) {
    const completenesses = product.completenesses ?? [];
    for (const c of completenesses) {
      const ch = c.scope ?? c.channel ?? 'unknown';
      if (!channelMap.has(ch)) channelMap.set(ch, { total: 0, at100: 0 });
      const entry = channelMap.get(ch);
      entry.total++;
      if ((c.data ?? 0) >= 100) entry.at100++;
    }
  }

  if (channelMap.size === 0) {
    return [{
      channelCode: 'unknown',
      numerator: 0,
      denominator: products.length,
      percentage: null,
      caveat: 'No completeness data found. Ensure withCompletenesses is enabled.',
      debugInfo: { productsChecked: products.length },
    }];
  }

  const preferredChannel = CONFIG.api.defaultChannel;

  return Array.from(channelMap.entries())
    .sort(([a], [b]) => {
      if (a === preferredChannel) return -1;
      if (b === preferredChannel) return 1;
      return a.localeCompare(b);
    })
    .map(([channelCode, { total, at100 }]) => ({
      channelCode,
      numerator: at100,
      denominator: total,
      percentage: total > 0 ? Math.round((at100 / total) * 1000) / 10 : null,
      caveat: null,
      debugInfo: { channelCode, productsAt100: at100, totalProducts: total },
    }));
}
