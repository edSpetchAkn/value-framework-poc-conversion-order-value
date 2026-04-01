/**
 * Akeneo Extension SDK — Global Ambient Type Declarations
 *
 * Trimmed to the types used by this extension. All declarations are globally
 * ambient — visible across the entire project without any import statement.
 *
 * The global `PIM` variable is injected at runtime by the Akeneo PIM sandbox.
 */

// ─── Shared ───────────────────────────────────────────────────────────────────

interface ApiLink { href: string }

interface ApiLinks {
  self?: ApiLink;
  first?: ApiLink;
  previous?: ApiLink;
  next?: ApiLink;
}

interface PaginatedList<T> {
  items: T[];
  count?: number;
  currentPage?: number;
  links?: ApiLinks;
}

// ─── Attribute ────────────────────────────────────────────────────────────────

interface Attribute {
  code: string;
  type: string;
  group?: string | null;
  labels?: { [locale: string]: string };
  localizable?: boolean;
  scopable?: boolean;
  referenceDataName?: string | null;
  links?: ApiLinks;
}

interface AttributeListParams {
  page?: number;
  limit?: number;
  withCount?: boolean;
}

interface SdkApiAttribute {
  list: (params?: AttributeListParams) => Promise<PaginatedList<Attribute>>;
}

// ─── Product ──────────────────────────────────────────────────────────────────

/**
 * Per-channel/locale completeness entry returned when withCompletenesses=true.
 * `scope` = channel code, `locale` = locale code, `data` = percentage 0–100.
 */
interface Completeness {
  locale?: string;
  scope?: string;
  data?: number;
}

interface ProductAssociations {
  [associationType: string]: {
    groups?: string[];
    products?: string[];
    product_models?: string[];
  };
}

interface ProductValues {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [attributeCode: string]: Array<{ locale?: string | null; scope?: string | null; data: any }>;
}

interface Product {
  uuid: string;
  identifier?: string | null;
  enabled?: boolean;
  family?: string | null;
  categories?: string[];
  parent?: string | null;
  values?: ProductValues;
  associations?: ProductAssociations;
  completenesses?: Completeness[];
  created?: string;
  updated?: string;
  links?: ApiLinks;
}

interface ProductListParams {
  search?: unknown;
  page?: number;
  limit?: number;
  withCount?: boolean;
  withCompletenesses?: boolean;
}

interface SdkApiProductUuid {
  list: (params?: ProductListParams) => Promise<PaginatedList<Product>>;
}

// ─── Navigation & Context ─────────────────────────────────────────────────────

type PIM_USER = {
  username: string;
  uuid: string;
  first_name: string;
  last_name: string;
  groups: Array<{ id: number; name: string }>;
};

type BaseContext = {
  position: string;
  user: { catalog_locale: string; catalog_scope: string };
};

type PIM_CONTEXT = BaseContext & (
  | { product?: { uuid: string; identifier: string | null } }
  | { category?: { code: string } }
  | { productGrid?: { productUuids: string[]; productModelCodes: string[] } }
);

type EXTENSION_VARIABLES = Record<string | number, string | number | Array<string | number>>;

// ─── PIM SDK Root ─────────────────────────────────────────────────────────────

type PIM_SDK = {
  user: PIM_USER;
  context: PIM_CONTEXT;
  api: {
    attribute_v1: SdkApiAttribute;
    product_uuid_v1: SdkApiProductUuid;
    /** Additional namespaces available at runtime. */
    [key: string]: unknown;
  };
  navigate: {
    internal: (path: string) => void;
    external: (rawUrl: string) => void;
    refresh: () => void;
  };
  custom_variables: EXTENSION_VARIABLES;
};

// ─── Global ───────────────────────────────────────────────────────────────────

declare var PIM: PIM_SDK;
