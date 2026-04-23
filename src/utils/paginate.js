/**
 * paginate.js — generic page-number-based pagination helper.
 */

export async function fetchAllPages(lister, limit, maxPages, debugLabel, debugMode) {
  const all = [];
  for (let page = 1; page <= maxPages; page++) {
    let response;
    try {
      response = await lister({ page, limit });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to fetch ${debugLabel} (page ${page}): ${msg}`);
    }
    const items = response.items ?? [];
    all.push(...items);
    if (debugMode) {
      console.debug(`[PAGINATE] ${debugLabel} page ${page}/${maxPages} — ${items.length} items, total: ${all.length}`);
    }
    if (items.length === 0 || !response.links?.next) break;
  }
  return all;
}
