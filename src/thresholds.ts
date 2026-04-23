/**
 * Metric thresholds and value statements for the Value Framework POC.
 *
 * Each metric has three threshold values that define colour bands:
 *   - red:   score below this value is in the red band
 *   - amber: score at or above `red` but below `green` is in the amber band
 *   - green: score at or above this value is in the green band
 *
 * Band logic (used for bar colour and which value statement to display):
 *   score < amber  → red band   → Value at Risk only
 *   score < green  → amber band → Value at Risk + Value Delivered
 *   score >= green → green band → Value Delivered only
 *
 * The `red` threshold marks the lower boundary of the amber band (i.e. the
 * minimum score to exit the red zone). The `amber` threshold marks the lower
 * boundary of the amber band proper. The `green` threshold marks when the
 * outcome is considered fully delivered.
 *
 * To change thresholds for a metric, edit only the values in METRIC_THRESHOLDS
 * below — no other file needs to change.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/** Unique identifier for each metric — used to look up thresholds. */
export type MetricKey =
  | 'completeness'
  | 'categorised'
  | 'structuredTypes'
  | 'hasParent'
  | 'hasAssociation'
  | 'hasAssetCollection';

/** The three percentage thresholds that define colour bands for a metric. */
export interface ThresholdBands {
  /**
   * Minimum score (0–100) for the red band.
   * Scores below this value are also treated as red.
   */
  red: number;
  /**
   * Minimum score (0–100) for the amber band.
   * Scores in [amber, green) are amber.
   */
  amber: number;
  /**
   * Minimum score (0–100) for the green band.
   * Scores at or above this are green.
   */
  green: number;
}

/** Value statements shown in the metric's insights modal. */
export interface ValueStatements {
  /** Shown when the metric is in the red or amber band. */
  valueAtRisk: string;
  /** Shown when the metric is in the amber or green band. */
  valueDelivered: string;
}

/** Full threshold + statement configuration for a single metric. */
export interface MetricThresholdConfig {
  thresholds: ThresholdBands;
  statements: ValueStatements;
}

/** The colour band a metric score falls into. */
export type ThresholdBand = 'red' | 'amber' | 'green';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Determines which colour band a percentage score falls into.
 *
 * @param pct        - Percentage score (0–100).
 * @param thresholds - Threshold configuration for the metric.
 * @returns            'red' | 'amber' | 'green'
 */
export function getBand(pct: number, thresholds: ThresholdBands): ThresholdBand {
  if (pct >= thresholds.green) return 'green';
  if (pct >= thresholds.amber) return 'amber';
  return 'red';
}

/** Hex colour for each band, used for progress bars and UI accents. */
export const BAND_COLOURS: Record<ThresholdBand, string> = {
  red: '#CB1119',
  amber: '#F0AB00',
  green: '#2DB87D',
};

// ─── Thresholds & value statements ───────────────────────────────────────────

/**
 * Per-metric threshold bands and value statements.
 *
 * Edit the numeric values here to adjust when a metric turns red / amber / green.
 * Edit the statement strings here to change the copy shown in insights modals.
 */
export const METRIC_THRESHOLDS: Record<MetricKey, MetricThresholdConfig> = {

  completeness: {
    thresholds: { red: 50, amber: 70, green: 90 },
    statements: {
      valueAtRisk:
        'You risk high cart abandonment rates. Any missing specification creates a moment of doubt. There is a low probability of a customer leaving your site to find a technical answer, then returning to buy.',
      valueDelivered:
        'Full completeness eliminates buyer hesitation. By ensuring every required attribute is present, you remove the information gaps that cause customers to abandon their carts.',
    },
  },

  categorised: {
    thresholds: { red: 50, amber: 70, green: 90 },
    statements: {
      valueAtRisk:
        "If products aren't categorized, they are invisible to customers browsing your menu trees. It is also harder to find related or alternative products.",
      valueDelivered:
        'Products correctly placed within a logical hierarchy are easier to find via site navigation and breadcrumbs, ensuring customers are exposed to more of your catalog.',
    },
  },

  structuredTypes: {
    thresholds: { red: 30, amber: 50, green: 70 },
    statements: {
      valueAtRisk:
        'You risk high bounce rates from lack of discoverability in your site search/filters. You risk losing every lead who uses your faceted navigation.',
      valueDelivered:
        'Structured data powers site search and faceted filtering. By allowing customers to accurately filter you decrease the discovery time, leading to a more satisfying customer experience.',
    },
  },

  hasParent: {
    thresholds: { red: 50, amber: 70, green: 90 },
    statements: {
      valueAtRisk:
        'Without parent-child modeling, you risk discoverability issues. Customers are forced to browse individual product pages rather than one consolidated page.',
      valueDelivered:
        'By grouping product variants under a parent structure, you provide a consolidated view that allows customers to explore all options on a single page.',
    },
  },

  hasAssociation: {
    thresholds: { red: 30, amber: 50, green: 70 },
    statements: {
      valueAtRisk:
        'By not linking items, you risk leaving potential revenue on the table. You are missing the add-on that turns a single-item sale into a high-value basket.',
      valueDelivered:
        'By providing cross-sells and up-sells, you transition the customer from buying a single item to purchasing a full solution, effectively building the basket at high intent touchpoints.',
    },
  },

  hasAssetCollection: {
    thresholds: { red: 50, amber: 80, green: 100 },
    statements: {
      valueAtRisk:
        'Products without rich asset collections are perceived as higher risk. You risk losing customers who require the visual proof needed for a confident purchase.',
      valueDelivered:
        'Visual proof is a great conversion tool. An asset collection builds trust, helping the customer visualize the product in their own life and reducing the perceived risk of purchase.',
    },
  },
};
