/**
 * MetricCard — renders a single MetricResult as a dashboard card.
 *
 * Displays the percentage as a large number, a progress bar, and the
 * numerator/denominator breakdown. Shows a caveat note below the bar.
 * When percentage is null, renders a "not available" state with the caveat.
 */

import React from 'react';
import type { MetricResult } from '../types';
import { CONFIG } from '../config';

interface MetricCardProps {
  result: MetricResult;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns a colour for the progress bar based on the percentage value. */
function barColour(pct: number): string {
  if (pct >= 80) return '#2DB87D'; // green
  if (pct >= 50) return '#F0AB00'; // amber
  return '#CB1119';                 // red
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

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Renders a single metric as a dashboard card with percentage, progress bar,
 * breakdown count, caveat, and optional debug log.
 *
 * @param result - The MetricResult to display.
 */
export function MetricCard({ result }: MetricCardProps): JSX.Element {
  const [showDebug, setShowDebug] = React.useState(false);
  const { percentage, numerator, denominator, label, caveat, debugInfo } = result;

  return (
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
                backgroundColor: barColour(percentage),
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
  );
}
