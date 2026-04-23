/**
 * MetricCard — renders a single MetricResult as a dashboard card.
 *
 * Displays the percentage as a large number, a progress bar coloured by the
 * metric's threshold bands, the numerator/denominator breakdown, and a caveat.
 *
 * If the result includes a `metricKey`, a "View insights" button is shown.
 * Clicking it opens a modal with the Value at Risk and/or Value Delivered
 * statement appropriate for the current threshold band:
 *
 *   red band   (score < amber threshold)  → Value at Risk only
 *   amber band (amber ≤ score < green)    → Value at Risk + Value Delivered
 *   green band (score ≥ green threshold)  → Value Delivered only
 */

import React from 'react';
import type { MetricResult } from '../types';
import { CONFIG } from '../config';
import {
  METRIC_THRESHOLDS,
  getBand,
  BAND_COLOURS,
} from '../thresholds';
import type { ThresholdBand } from '../thresholds';

interface MetricCardProps {
  result: MetricResult;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the progress-bar colour for a given percentage score.
 * Uses per-metric thresholds when a metricKey is available, falling back to
 * legacy fixed thresholds otherwise.
 */
function resolveBarColour(pct: number, metricKey: MetricResult['metricKey']): string {
  if (metricKey && METRIC_THRESHOLDS[metricKey]) {
    const band = getBand(pct, METRIC_THRESHOLDS[metricKey].thresholds);
    return BAND_COLOURS[band];
  }
  // Legacy fallback (no metricKey configured)
  if (pct >= 80) return BAND_COLOURS.green;
  if (pct >= 50) return BAND_COLOURS.amber;
  return BAND_COLOURS.red;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e8e8e8',
  borderRadius: '6px',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#5a5a5a',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  margin: 0,
};

const percentageStyle: React.CSSProperties = {
  fontSize: '36px',
  fontWeight: 700,
  color: '#11324D',
  margin: 0,
  lineHeight: 1,
};

const naStyle: React.CSSProperties = {
  ...percentageStyle,
  fontSize: '24px',
  color: '#aaaaaa',
};

const breakdownStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#888888',
  margin: 0,
};

const caveatStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#aaaaaa',
  margin: 0,
  lineHeight: '1.5',
};

const bandButtonStyle = (band: 'red' | 'green'): React.CSSProperties => ({
  fontSize: '12px',
  color: BAND_COLOURS[band],
  background: 'none',
  border: `1px solid ${BAND_COLOURS[band]}`,
  borderRadius: '3px',
  padding: '4px 10px',
  cursor: 'pointer',
  fontWeight: 500,
});

const debugToggleStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#11324D',
  background: 'none',
  border: '1px solid #c7c7c7',
  borderRadius: '3px',
  padding: '2px 8px',
  cursor: 'pointer',
  alignSelf: 'flex-start',
};

const debugPanelStyle: React.CSSProperties = {
  backgroundColor: '#1e1e1e',
  borderRadius: '4px',
  padding: '10px 12px',
  fontSize: '11px',
  fontFamily: 'monospace',
  color: '#d4d4d4',
  overflowX: 'auto',
};

// ─── Modal styles ─────────────────────────────────────────────────────────────

const backdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  padding: '28px 32px',
  maxWidth: '520px',
  width: '90%',
  boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
};

const modalTitleStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  color: '#11324D',
  margin: 0,
};

const modalCloseStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '20px',
  color: '#888888',
  cursor: 'pointer',
  lineHeight: 1,
  padding: 0,
};

const statementBlockStyle = (band: ThresholdBand): React.CSSProperties => ({
  borderLeft: `4px solid ${BAND_COLOURS[band]}`,
  paddingLeft: '14px',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
});

const statementLabelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: '#5a5a5a',
  margin: 0,
};

const statementTextStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#333333',
  margin: 0,
  lineHeight: '1.6',
};

const bandPillStyle = (band: ThresholdBand): React.CSSProperties => ({
  display: 'inline-block',
  padding: '2px 10px',
  borderRadius: '10px',
  backgroundColor: BAND_COLOURS[band],
  color: '#ffffff',
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  alignSelf: 'flex-start',
});

// ─── Modal component ──────────────────────────────────────────────────────────

interface InsightsModalProps {
  label: string;
  percentage: number;
  metricKey: NonNullable<MetricResult['metricKey']>;
  onClose: () => void;
}

function InsightsModal({ label, percentage, metricKey, onClose }: InsightsModalProps): JSX.Element {
  const config = METRIC_THRESHOLDS[metricKey];
  const band = getBand(percentage, config.thresholds);
  const { valueAtRisk, valueDelivered } = config.statements;
  const { red, amber, green } = config.thresholds;

  const showAtRisk = band === 'red' || band === 'amber';
  const showDelivered = band === 'amber' || band === 'green';

  return (
    <div style={backdropStyle} onClick={onClose} role="dialog" aria-modal="true" aria-label="Metric insights">
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <p style={modalTitleStyle}>{label}</p>
          <button style={modalCloseStyle} onClick={onClose} aria-label="Close">×</button>
        </div>

        {/* Score + band */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px', fontWeight: 700, color: BAND_COLOURS[band], lineHeight: 1 }}>
            {percentage.toFixed(1)}%
          </span>
          <span style={bandPillStyle(band)}>{band}</span>
        </div>

        {/* Threshold reference */}
        <p style={{ fontSize: '11px', color: '#aaaaaa', margin: 0 }}>
          Thresholds — Red: {red}% &nbsp;·&nbsp; Amber: {amber}% &nbsp;·&nbsp; Green: {green}%
        </p>

        {/* Value statements */}
        {showAtRisk && (
          <div style={statementBlockStyle('red')}>
            <p style={statementLabelStyle}>Value at Risk</p>
            <p style={statementTextStyle}>{valueAtRisk}</p>
          </div>
        )}
        {showDelivered && (
          <div style={statementBlockStyle('green')}>
            <p style={statementLabelStyle}>Value Delivered</p>
            <p style={statementTextStyle}>{valueDelivered}</p>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Renders a single metric as a dashboard card with percentage, progress bar,
 * breakdown count, caveat, and optional insights modal.
 *
 * @param result - The MetricResult to display.
 */
export function MetricCard({ result }: MetricCardProps): JSX.Element {
  const [showDebug, setShowDebug] = React.useState(false);
  const [showModal, setShowModal] = React.useState(false);
  const { percentage, numerator, denominator, label, caveat, debugInfo, metricKey } = result;

  return (
    <>
      <div style={cardStyle}>
        <p style={labelStyle}>{label}</p>

        {percentage !== null ? (
          <>
            <p style={percentageStyle}>{percentage.toFixed(1)}%</p>

            {/* Progress bar */}
            <div style={{ backgroundColor: '#f0f0f0', borderRadius: '3px', height: '6px' }}>
              <div
                style={{
                  width: `${Math.min(percentage, 100)}%`,
                  height: '100%',
                  backgroundColor: resolveBarColour(percentage, metricKey),
                  borderRadius: '3px',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>

            <p style={breakdownStyle}>
              {numerator.toLocaleString()} / {denominator.toLocaleString()} products
            </p>
          </>
        ) : (
          <p style={naStyle}>N/A</p>
        )}

        {caveat && <p style={caveatStyle}>{caveat}</p>}

        {/* Band-labelled buttons — only when a metricKey and valid percentage exist */}
        {metricKey && percentage !== null && (() => {
          const band = getBand(percentage, METRIC_THRESHOLDS[metricKey].thresholds);
          return (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(band === 'red' || band === 'amber') && (
                <button style={bandButtonStyle('red')} onClick={() => setShowModal(true)}>
                  Value at Risk
                </button>
              )}
              {(band === 'amber' || band === 'green') && (
                <button style={bandButtonStyle('green')} onClick={() => setShowModal(true)}>
                  Value Delivered
                </button>
              )}
            </div>
          );
        })()}

        {CONFIG.DEBUG_MODE && debugInfo.length > 0 && (
          <>
            <button style={debugToggleStyle} onClick={() => setShowDebug((v) => !v)}>
              {showDebug ? 'Hide debug' : 'Show debug'}
            </button>
            {showDebug && (
              <div style={debugPanelStyle}>
                {debugInfo.map((entry, i) => (
                  <div key={i} style={{ marginBottom: '4px' }}>
                    <span style={{ color: '#569cd6' }}>[{entry.step}]</span>{' '}
                    {entry.message}
                    {entry.count !== undefined && (
                      <span style={{ color: '#b5cea8' }}> ({entry.count})</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Insights modal */}
      {showModal && metricKey && percentage !== null && (
        <InsightsModal
          label={label}
          percentage={percentage}
          metricKey={metricKey}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
