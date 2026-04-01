/**
 * Generic page-number-based pagination utility.
 *
 * Fetches items from an Akeneo REST API endpoint that uses page-number
 * pagination (products, attributes). Stops when:
 *   - The response has no `links.next` (last page), OR
 *   - The page returned 0 items (guard against empty last page), OR
 *   - `maxPages` has been reached (hard stop).
 *
 * @param lister    - A function that calls the SDK API with `{ page, limit }`.
 *                    Must be a closure with all non-pagination params already bound.
 * @param limit     - Items per page (max 100 for Akeneo APIs).
 * @param maxPages  - Hard-stop page cap. Fetching stops after this many pages
 *                    regardless of whether more data exists.
 * @param debugLabel - Human-readable label used in console.debug output.
 * @param debugMode  - When true, logs each page fetch to console.debug.
 * @returns          A flat array of all fetched items.
 */
export async function fetchAllPages<T>(
  lister: (params: { page: number; limit: number }) => Promise<PaginatedList<T>>,
  limit: number,
  maxPages: number,
  debugLabel: string,
  debugMode: boolean,
): Promise<T[]> {
  const all: T[] = [];

  for (let page = 1; page <= maxPages; page++) {
    let response: PaginatedList<T>;

    try {
      response = await lister({ page, limit });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to fetch ${debugLabel} (page ${page}): ${msg}`);
    }

    const items = response.items ?? [];
    all.push(...items);

    if (debugMode) {
      console.debug(
        `[PAGINATE] ${debugLabel} page ${page}/${maxPages} — ${items.length} items, running total: ${all.length}`,
      );
    }

    // Early exit: no more data or no next-page link.
    if (items.length === 0 || !response.links?.next) break;
  }

  return all;
}
