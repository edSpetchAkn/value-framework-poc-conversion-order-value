import { fetchAllPages } from '../utils/paginate.js';
import { CONFIG } from '../config.js';

export async function fetchAttributeList() {
  return fetchAllPages(
    ({ page, limit }) => globalThis.PIM.api.attribute_v1.list({ page, limit }),
    100,
    CONFIG.api.maxAttributePages,
    'attributes',
    CONFIG.debugMode,
  );
}
