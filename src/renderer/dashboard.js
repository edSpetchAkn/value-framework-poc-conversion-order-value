/**
 * dashboard.js — Conversions + Order Value
 *
 * Main layout renderer. Composes the header, three metric sections,
 * and optional debug panel.
 *
 * Sections:
 *   1. Completeness at 100% — by channel (per-channel cards)
 *   2. Product structure (categorised, hasParent, hasAssociation, hasAssetCollection)
 *   3. Catalogue structure (structuredTypes)
 *
 * Exports:
 *   renderLoading(container)
 *   renderError(container, message)
 *   renderDashboard(container, opts)
 */

import { renderMetricCard } from './metricCard.js';
import { renderDebugPanel } from './debugPanel.js';

function ensureGlobalStyles() {
  if (document.getElementById('cov-styles')) return;
  const style = document.createElement('style');
  style.id = 'cov-styles';
  style.textContent = `
    @keyframes cov-spin {
      to { transform: rotate(360deg); }
    }
    @media (max-width: 768px) {
      .cov-grid { grid-template-columns: 1fr !important; }
    }
  `;
  document.head.appendChild(style);
}

/**
 * @param {HTMLElement} container
 */
export function renderLoading(container) {
  ensureGlobalStyles();
  container.innerHTML = '';

  const wrap = document.createElement('div');
  Object.assign(wrap.style, {
    padding: '32px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: '#67768a',
    fontSize: '14px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  });

  const spinner = document.createElement('div');
  Object.assign(spinner.style, {
    width: '18px',
    height: '18px',
    border: '2px solid #e8ebf0',
    borderTopColor: '#f5a623',
    borderRadius: '50%',
    flexShrink: '0',
    animation: 'cov-spin 0.8s linear infinite',
  });

  wrap.appendChild(spinner);
  wrap.appendChild(document.createTextNode('Loading Conversions + Order Value data\u2026'));
  container.appendChild(wrap);
}

/**
 * @param {HTMLElement} container
 * @param {string}      message
 */
export function renderError(container, message) {
  container.innerHTML = '';

  const box = document.createElement('div');
  Object.assign(box.style, {
    margin: '24px',
    padding: '20px',
    background: '#fdf3f2',
    border: '1px solid #d4574e44',
    borderRadius: '6px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  });

  const title = document.createElement('div');
  Object.assign(title.style, {
    fontSize: '14px',
    fontWeight: '700',
    color: '#d4574e',
    marginBottom: '6px',
  });
  title.textContent = 'Conversions + Order Value \u2014 Error';

  const detail = document.createElement('div');
  Object.assign(detail.style, {
    fontSize: '13px',
    color: '#67768a',
    lineHeight: '1.5',
  });
  detail.textContent = message;

  box.appendChild(title);
  box.appendChild(detail);
  container.appendChild(box);
}

/**
 * Renders a section heading + card grid.
 *
 * @param {string}        title
 * @param {HTMLElement[]} cards
 * @returns {HTMLElement}
 */
function renderSection(title, cards) {
  const section = document.createElement('div');
  Object.assign(section.style, { marginBottom: '28px' });

  const heading = document.createElement('h3');
  Object.assign(heading.style, {
    margin: '0 0 12px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#11324d',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  });
  heading.textContent = title;

  const grid = document.createElement('div');
  grid.className = 'cov-grid';
  Object.assign(grid.style, {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  });

  for (const card of cards) grid.appendChild(card);

  section.appendChild(heading);
  section.appendChild(grid);
  return section;
}

/**
 * Renders the full Conversions + Order Value dashboard.
 *
 * @param {HTMLElement} container
 * @param {Object} opts
 * @param {Array}  opts.completenessResults      - Per-channel completeness result objects
 * @param {Object} opts.categorisedResult
 * @param {Object} opts.structuredTypesResult
 * @param {Object} opts.hasParentResult
 * @param {Object} opts.hasAssociationResult
 * @param {Object} opts.hasAssetCollectionResult
 * @param {number} opts.productCount             - Products in sample
 * @param {number} opts.attributeCount           - Attributes fetched
 * @param {Object} opts.timings                  - { fetch, calculate, render, total } ms
 * @param {Object} opts.config                   - The CONFIG object
 */
export function renderDashboard(container, {
  completenessResults,
  categorisedResult,
  structuredTypesResult,
  hasParentResult,
  hasAssociationResult,
  hasAssetCollectionResult,
  productCount,
  attributeCount,
  timings,
  config,
}) {
  ensureGlobalStyles();
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  Object.assign(wrapper.style, {
    padding: '24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    color: '#11324d',
    maxWidth: '1100px',
    boxSizing: 'border-box',
  });

  // ── Header ──
  const header = document.createElement('div');
  Object.assign(header.style, {
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '2px solid #f0f2f5',
  });

  const title = document.createElement('h2');
  Object.assign(title.style, {
    margin: '0 0 4px',
    fontSize: '22px',
    fontWeight: '700',
    color: '#11324d',
    letterSpacing: '-0.3px',
  });
  title.textContent = 'Conversions + Order Value';

  const breadcrumb = document.createElement('div');
  Object.assign(breadcrumb.style, {
    fontSize: '11px',
    fontWeight: '700',
    color: '#9452ba',
    letterSpacing: '0.3px',
    textTransform: 'uppercase',
    marginBottom: '10px',
  });
  breadcrumb.textContent =
    `${config.valueFramework.businessGoal} \u203a ${config.valueFramework.businessOutcome}`;

  const subtitle = document.createElement('div');
  Object.assign(subtitle.style, {
    fontSize: '13px',
    color: '#67768a',
    lineHeight: '1.6',
    maxWidth: '680px',
    marginBottom: '12px',
  });
  subtitle.textContent =
    'These metrics measure how well your product data drives buying confidence \u2014 ' +
    'from completeness and discoverability to rich media and cross-sell associations.';

  const isSample = productCount >= config.api.sampleMaxProducts;
  const sampleNotice = document.createElement('div');
  Object.assign(sampleNotice.style, {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    background: '#f5f7fb',
    border: '1px solid #e8ebf0',
    borderRadius: '12px',
    fontSize: '11px',
    color: '#67768a',
  });
  sampleNotice.textContent = isSample
    ? `Based on a sample of ${productCount.toLocaleString()} products (catalogue may be larger)`
    : `Based on all ${productCount.toLocaleString()} products`;

  header.appendChild(title);
  header.appendChild(breadcrumb);
  header.appendChild(subtitle);
  header.appendChild(sampleNotice);
  wrapper.appendChild(header);

  // ── Section 1: Completeness at 100% by channel ──
  const completenessCards = completenessResults.map((r) =>
    renderMetricCard(r, 'completeness', config, `Channel: ${r.channelCode}`)
  );
  wrapper.appendChild(renderSection('Completeness at 100% \u2014 by channel', completenessCards));

  // ── Section 2: Product structure ──
  const productStructureCards = [
    renderMetricCard(categorisedResult,     'categorised',     config),
    renderMetricCard(hasParentResult,       'hasParent',       config),
    renderMetricCard(hasAssociationResult,  'hasAssociation',  config),
    renderMetricCard(hasAssetCollectionResult, 'hasAssetCollection', config),
  ];
  wrapper.appendChild(renderSection('Product structure', productStructureCards));

  // ── Section 3: Catalogue structure ──
  wrapper.appendChild(renderSection('Catalogue structure', [
    renderMetricCard(structuredTypesResult, 'structuredTypes', config),
  ]));

  // ── Debug panel ──
  if (config.debugMode) {
    wrapper.appendChild(
      renderDebugPanel({
        completenessResults,
        categorisedResult,
        structuredTypesResult,
        hasParentResult,
        hasAssociationResult,
        hasAssetCollectionResult,
        productCount,
        attributeCount,
        timings,
        config,
      })
    );
  }

  container.appendChild(wrapper);
}
