/**
 * Attribute list fetcher.
 *
 * Fetches all attributes from the PIM, up to MAX_ATTRIBUTE_PAGES × 100.
 * Used by the structured-types metric (metric 3) and the asset collection
 * metric (metric 6) to identify attribute types without hardcoding codes.
 *
 * @param config - The CONFIG object from config.ts.
 * @returns      A flat array of all Attributes.
 *
 * @apiDependency PIM.api.attribute_v1.list — paginated, no search filter.
 */

import { fetchAllPages } from '../utils/paginate';
import type { CONFIG } from '../config';

/**
 * Fetches all attributes from the PIM catalog.
 *
 * Pagination hard-stops at `config.MAX_ATTRIBUTE_PAGES` (default: 20 × 100 =
 * 2,000 attributes). Sufficient for any realistic catalog.
 *
 * @param config - The CONFIG object from config.ts.
 * @returns      Array of Attributes with `code` and `type` populated.
 *
 * @apiDependency PIM.api.attribute_v1.list
 */
export async function fetchAttributeList(config: typeof CONFIG): Promise<Attribute[]> {
  if (config.DEBUG_MODE) {
    console.debug('[FETCH] fetchAttributeList — starting');
  }

  const attributes = await fetchAllPages<Attribute>(
    ({ page, limit }) => PIM.api.attribute_v1.list({ page, limit }),
    100,
    config.MAX_ATTRIBUTE_PAGES,
    'attributes',
    config.DEBUG_MODE,
  );

  if (config.DEBUG_MODE) {
    console.debug(`[FETCH] fetchAttributeList — total fetched: ${attributes.length}`);
  }

  return attributes;
}
