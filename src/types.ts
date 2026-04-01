/**
 * Shared type definitions for the Value Framework POC.
 *
 * This is the single source of truth for data shapes flowing through the
 * metric pipeline. Import from here — do not redeclare these types elsewhere.
 */

import type { CONFIG } from './config';

// ─── Metric result shapes ─────────────────────────────────────────────────────

/** A single structured debug log entry produced during metric calculation. */
export interface DebugEntry {
  /** Short identifier for the calculation step (e.g. "SAMPLE", "CALCULATE"). */
  step: string;
  /** Human-readable description of what happened at this step. */
  message: string;
  /** Optional numeric count associated with the entry. */
  count?: number;
}

/**
 * Standard result shape returned by every metric module's `calculate()`.
 *
 * When `percentage` is null, the metric could not be calculated — the
 * `caveat` field will always be non-null in that case to explain why.
 */
export interface MetricResult {
  /** Number of products (or attributes) that match the metric criterion. */
  numerator: number;
  /** Total number of products (or attributes) evaluated. */
  denominator: number;
  /**
   * Calculated percentage (0–100), rounded to one decimal place.
   * Null when the metric cannot be calculated (e.g. empty sample, missing data).
   */
  percentage: number | null;
  /** Short display label for the metric (e.g. "Products categorised"). */
  label: string;
  /**
   * Human-readable explanation of why percentage is null, or a note about
   * sampling limitations when the result may not be fully representative.
   * Always non-null when percentage is null.
   */
  caveat: string | null;
  /** Structured debug log entries populated during calculation. */
  debugInfo: DebugEntry[];
}

/**
 * Per-channel result for the completeness metric.
 * The completeness metric returns one of these per channel discovered in the data.
 */
export interface CompletenessChannelResult {
  /** The Akeneo channel code (e.g. "ecommerce", "print"). */
  channelCode: string;
  /** Number of products with 100% completeness on this channel. */
  numerator: number;
  /** Total products in the sample. */
  denominator: number;
  /**
   * Percentage of products at 100% completeness on this channel.
   * Null if no completeness data was found for this channel.
   */
  percentage: number | null;
  /** Explanation when percentage is null. */
  caveat: string | null;
  /** Structured debug log entries. */
  debugInfo: DebugEntry[];
}

// ─── Metric context ───────────────────────────────────────────────────────────

/**
 * Shared context passed to every metric `calculate()` function.
 *
 * Products and attributes are pre-fetched by the dashboard and passed in,
 * so metric modules make no API calls of their own.
 */
export interface MetricContext {
  /** Sampled products (up to MAX_PRODUCT_PAGES × PRODUCTS_PAGE_SIZE). */
  products: Product[];
  /** Full attribute list from the PIM (up to MAX_ATTRIBUTE_PAGES × 100). */
  attributes: Attribute[];
  /** CONFIG values from the environment. */
  config: typeof CONFIG;
}
