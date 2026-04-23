/// <reference types="vite/client" />

/**
 * Instance-agnostic configuration constants.
 *
 * All environment-specific values are defined here, populated from Vite
 * environment variables. No attribute codes, family codes, or channel codes
 * should appear anywhere else in the source — reference this module instead.
 *
 * Runtime overrides: copy .env.example to .env and set VITE_* values.
 */

export const CONFIG = {
  /**
   * When true, enables verbose console.debug output at each calculation step.
   * Set VITE_DEBUG_MODE=true in .env to enable.
   */
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true',

  /**
   * Number of products to fetch per page. Akeneo REST API maximum is 100.
   * Override via VITE_PRODUCTS_PAGE_SIZE in .env.
   */
  PRODUCTS_PAGE_SIZE: Math.min(Number(import.meta.env.VITE_PRODUCTS_PAGE_SIZE) || 100, 100),

  /**
   * Maximum number of product pages to fetch. Hard-stops the sample at
   * MAX_PRODUCT_PAGES × PRODUCTS_PAGE_SIZE products (default: 10 × 100 = 1,000).
   */
  MAX_PRODUCT_PAGES: 10,

  /**
   * How many days back to look when sampling recently-updated products.
   * The cutoff date is computed at runtime, never hardcoded.
   */
  SAMPLE_DAYS: 30,

  /**
   * Maximum attribute pages to fetch (no hard limit needed for attributes,
   * but capped to prevent infinite loops on misconfigured instances).
   * 20 × 100 = 2,000 attributes — sufficient for any realistic catalog.
   */
  MAX_ATTRIBUTE_PAGES: 20,

  /**
   * Preferred channel code for the completeness metric. The metric falls back
   * to the first channel discovered in the data if this code is not present.
   * Override via VITE_DEFAULT_CHANNEL in .env.
   */
  DEFAULT_CHANNEL: (import.meta.env.VITE_DEFAULT_CHANNEL as string) || 'ecommerce',

  /**
   * Akeneo attribute type codes considered "structured".
   * Structured = machine-readable, constrained values (not free text or media).
   *
   * Included: date, identifier, measurement, multi-select, number, price,
   *           reference entity single link, reference entity multiple links,
   *           simple select, table, yes/no (boolean).
   * Excluded: text, textarea, image, file, asset_collection, and any other
   *           types not in the above set.
   *
   * This list is a PIM platform constant — do not change unless Akeneo
   * renames these type codes.
   */
  STRUCTURED_ATTRIBUTE_TYPES: new Set([
    'pim_catalog_date',
    'pim_catalog_identifier',
    'pim_catalog_metric',
    'pim_catalog_multiselect',
    'pim_catalog_number',
    'pim_catalog_price_collection',
    'akeneo_reference_entity',
    'akeneo_reference_entity_collection',
    'pim_catalog_simpleselect',
    'pim_catalog_table',
    'pim_catalog_boolean',
  ]),

  /**
   * Akeneo type code for asset collection attributes.
   * Used by the asset collection metric to identify relevant attributes.
   * This is a PIM platform constant.
   */
  ASSET_COLLECTION_ATTR_TYPE: 'pim_catalog_asset_collection' as const,

  /**
   * Akeneo type code for product link attributes.
   * Used by the association/product-link metric alongside standard associations.
   * This is a PIM platform constant.
   */
  PRODUCT_LINK_ATTR_TYPE: 'pim_catalog_product_link' as const,
} as const;
