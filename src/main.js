/**
 * main.js — Conversions + Order Value
 *
 * Entry point for the "Conversions + Order Value" Custom Component.
 * Position: pim.activity.navigation.tab
 *
 * Orchestration:
 *   1. Wait for window.PIM (polling with exponential backoff)
 *   2. Fetch product sample + full attribute list in parallel
 *   3. Calculate all 6 metrics (isolated — one failure won't block others)
 *   4. Render the dashboard
 */

import { CONFIG } from './config.js';
import { debugLog, debugError, debugTime, debugTimeEnd } from './utils/logger.js';
import { fetchProductSample } from './data/fetchProductSample.js';
import { fetchAttributeList } from './data/fetchAttributeList.js';
import { calculate as calculateCompleteness }     from './metrics/completeness.js';
import { calculate as calculateCategorised }      from './metrics/categorised.js';
import { calculate as calculateStructuredTypes }  from './metrics/structuredTypes.js';
import { calculate as calculateHasParent }        from './metrics/hasParent.js';
import { calculate as calculateHasAssociation }   from './metrics/hasAssociation.js';
import { calculate as calculateHasAssetCollection } from './metrics/hasAssetCollection.js';
import { renderDashboard, renderLoading, renderError } from './renderer/dashboard.js';

// ── SDK Waiter ────────────────────────────────────────────────────────────────

function waitForPim(timeoutMs = 10_000) {
  return new Promise((resolve, reject) => {
    if (window.PIM) {
      resolve(window.PIM);
      return;
    }

    const startTime = Date.now();
    let interval = 100;

    const poll = () => {
      if (window.PIM) {
        debugLog('main', `PIM SDK detected after ${Date.now() - startTime}ms`);
        resolve(window.PIM);
        return;
      }
      if (Date.now() - startTime >= timeoutMs) {
        reject(
          new Error(
            `PIM SDK (window.PIM) was not available after ${timeoutMs / 1000}s. ` +
            'Ensure this script is loaded within an Akeneo Custom Component context.'
          )
        );
        return;
      }
      interval = Math.min(interval * 1.5, 500);
      setTimeout(poll, interval);
    };

    setTimeout(poll, interval);
  });
}

// ── Safe Metric Calculation ───────────────────────────────────────────────────

function safeCalculate(fn, context, metricKey) {
  try {
    return fn(context);
  } catch (err) {
    debugError(`metric.${metricKey}`, err);
    return {
      numerator: 0,
      denominator: 0,
      percentage: null,
      label: CONFIG.metrics[metricKey]?.label ?? metricKey,
      caveat: `Calculation error \u2014 see console for details.`,
      debugInfo: { error: err.message },
    };
  }
}

// ── Main Orchestration ────────────────────────────────────────────────────────

async function run(container) {
  renderLoading(container);

  const timings = {};
  const t0 = Date.now();

  // ── Phase 1: Fetch products + attributes in parallel ──
  let products, attributes;
  try {
    debugTime('fetchAll');
    const t1 = Date.now();
    [products, attributes] = await Promise.all([
      fetchProductSample(),
      fetchAttributeList(),
    ]);
    timings.fetch = Date.now() - t1;
    debugTimeEnd('fetchAll');
  } catch (err) {
    debugError('main.fetch', err);
    renderError(container, `Failed to load data from PIM: ${err.message}`);
    return;
  }

  if (products.length === 0) {
    renderError(container, 'No products found in this PIM instance. Cannot calculate metrics.');
    return;
  }

  debugLog('main', {
    productsFetched: products.length,
    attributesFetched: attributes.length,
  });

  const context = { products, attributes, config: CONFIG };

  // ── Phase 2: Calculate all metrics ──
  const t2 = Date.now();

  let completenessResults;
  try {
    completenessResults = calculateCompleteness(context);
  } catch (err) {
    debugError('metric.completeness', err);
    completenessResults = [{
      channelCode: 'error',
      numerator: 0,
      denominator: 0,
      percentage: null,
      caveat: `Calculation error: ${err.message}`,
      debugInfo: { error: err.message },
    }];
  }

  const categorisedResult      = safeCalculate(calculateCategorised,       context, 'categorised');
  const structuredTypesResult  = safeCalculate(calculateStructuredTypes,   context, 'structuredTypes');
  const hasParentResult        = safeCalculate(calculateHasParent,         context, 'hasParent');
  const hasAssociationResult   = safeCalculate(calculateHasAssociation,    context, 'hasAssociation');
  const hasAssetCollectionResult = safeCalculate(calculateHasAssetCollection, context, 'hasAssetCollection');

  timings.calculate = Date.now() - t2;

  // ── Phase 3: Render ──
  const t3 = Date.now();
  renderDashboard(container, {
    completenessResults,
    categorisedResult,
    structuredTypesResult,
    hasParentResult,
    hasAssociationResult,
    hasAssetCollectionResult,
    productCount: products.length,
    attributeCount: attributes.length,
    timings,
    config: CONFIG,
  });
  timings.render = Date.now() - t3;
  timings.total = Date.now() - t0;

  debugLog('main.timings', timings);
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

async function init() {
  if (!document.getElementById('root')) {
    document.body.innerHTML = '<div id="root"></div>';
  }
  const container = document.getElementById('root');

  try {
    await waitForPim();
    await run(container);
  } catch (err) {
    debugError('main.init', err);
    renderError(container, err.message);
  }
}

window.ConversionsOrderValue = { init };
init();
