/**
 * CompletenessBreakdown — renders the per-channel completeness metric.
 *
 * Since completeness returns one result per channel, this component renders
 * a card per channel rather than a single MetricCard.
 */

import type { CompletenessChannelResult } from '../types';
import { MetricCard } from './MetricCard';
import type { MetricResult } from '../types';

interface CompletenessBreakdownProps {
  results: CompletenessChannelResult[];
}

/**
 * Converts a CompletenessChannelResult to the standard MetricResult shape
 * so it can be rendered by MetricCard.
 *
 * @param result - Per-channel completeness result.
 * @returns      MetricResult compatible with MetricCard.
 */
function toMetricResult(result: CompletenessChannelResult): MetricResult {
  return {
    numerator: result.numerator,
    denominator: result.denominator,
    percentage: result.percentage,
    label: `Completeness at 100% — ${result.channelCode}`,
    metricKey: 'completeness',
    caveat: result.caveat,
    debugInfo: result.debugInfo,
  };
}

/**
 * Renders one MetricCard per channel for the completeness metric.
 *
 * @param results - Array of per-channel completeness results.
 */
export function CompletenessBreakdown({ results }: CompletenessBreakdownProps): JSX.Element {
  if (results.length === 0) return <></>;

  if (results.length === 1) {
    return <MetricCard result={toMetricResult(results[0])} />;
  }

  return (
    <>
      {results.map((r) => (
        <MetricCard key={r.channelCode} result={toMetricResult(r)} />
      ))}
    </>
  );
}
