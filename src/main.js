/**
 * main.js — Conversions + Order Value
 *
 * Entry point for the "Conversions + Order Value" Custom Component.
 * Position: pim.activity.navigation.tab
 *
 * Orchestration:
 *   Phase 1 — fetch attributes + product families in parallel, render shell with dropdown
 *   Phase 2 — fetch all products for the selected family, calculate all metrics, render
 *             Re-runs on every family change.
 */

import { CONFIG } from './config.js';
import { debugLog, debugError, debugTime, debugTimeEnd } from './utils/logger.js';
import { fetchProductsByFamily } from './data/fetchProductSample.js';
import { fetchAttributeList } from './data/fetchAttributeList.js';
import { calculate as calculateCompleteness }     from './metrics/completeness.js';
import { calculate as calculateCategorised }      from './metrics/categorised.js';
import { calculate as calculateStructuredTypes }  from './metrics/structuredTypes.js';
import { calculate as calculateHasParent }        from './metrics/hasParent.js';
import { calculate as calculateHasAssociation }   from './metrics/hasAssociation.js';
import { calculate as calculateHasAssetCollection } from './metrics/hasAssetCollection.js';
import {
  renderLoading,
  renderError,
  renderShell,
  renderMetricsLoading,
  renderMetrics,
  renderMetricsError,
} from './renderer/dashboard.js';

// ── SDK Waiter ────────────────────────────────────────────────────────────────

function waitForPim(timeoutMs = 10_000) {
  return new Promise((resolve, reject) => {
    if (window.PIM) { resolve(window.PIM); return; }

    const startTime = Date.now();
    let interval = 100;

    const poll = () => {
      if (window.PIM) {
        debugLog('main', `PIM SDK detected after ${Date.now() - startTime}ms`);
        resolve(window.PIM);
        return;
      }
      if (Date.now() - startTime >= timeoutMs) {
        reject(new Error(
          `PIM SDK (window.PIM) was not available after ${timeoutMs / 1000}s. ` +
          'Ensure this script is loaded within an Akeneo Custom Component context.'
        ));
        return;
      }
      interval = Math.min(interval * 1.5, 500);
      setTimeout(poll, interval);
    };

    setTimeout(poll, interval);
  });
}

// ── Schema Fetching ───────────────────────────────────────────────────────────

async function fetchAllFamilies() {
  debugTime('fetchFamilies');
  const all = [];
  let page = 1;

  while (true) {
    const response = await globalThis.PIM.api.family_v1.list({ page, limit: 100 });
    const items = response.items ?? [];
    all.push(...items);
    debugLog('fetchFamilies', `Page ${page}: ${items.length} families (total: ${all.length})`);
    if (items.length === 0 || !response.links?.next) break;
    page++;
  }

  debugTimeEnd('fetchFamilies');
  return all;
}

// ── Metric Visibility ─────────────────────────────────────────────────────────

function getEnabledMetrics(allKeys) {
  try {
    const vars = globalThis.PIM.custom_variables ?? {};
    const raw = Array.isArray(vars)
      ? vars.find(v => v.code === 'enabled_metrics')?.value
      : vars.enabled_metrics;
    if (typeof raw === 'string' && raw.trim().length > 0) {
      const requested = new Set(raw.split(',').map(k => k.trim()).filter(Boolean));
      const valid = allKeys.filter(k => requested.has(k));
      if (valid.length > 0) {
        debugLog('main.enabledMetrics', valid);
        return new Set(valid);
      }
    }
  } catch (_) {}
  return new Set(allKeys);
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
      caveat: 'Calculation error — see console for details.',
      debugInfo: { error: err.message },
    };
  }
}

// ── Phase 2: Fetch products + calculate + render ──────────────────────────────

async function runMetrics(metricsArea, { attributes, families, familyCode }) {
  renderMetricsLoading(metricsArea);

  const userLocale = globalThis.PIM.context?.user?.catalog_locale ?? 'en_US';
  const family = families.find(f => f.code === familyCode);
  const familyLabel = familyCode === '__none__'
    ? 'No family'
    : (family?.labels?.[userLocale] ?? family?.labels?.['en_US'] ?? familyCode);

  const timings = {};
  const t0 = Date.now();

  let products;
  try {
    const t1 = Date.now();
    debugTime('fetchProducts');
    products = await fetchProductsByFamily(familyCode);
    debugTimeEnd('fetchProducts');
    timings.fetch = Date.now() - t1;
  } catch (err) {
    debugError('runMetrics.fetch', err);
    renderMetricsError(metricsArea, err.message);
    return;
  }

  debugLog('runMetrics', { familyCode, productsFetched: products.length });

  const context = { products, attributes, config: CONFIG };

  const ALL_KEYS = ['completeness', 'categorised', 'structuredTypes', 'hasParent', 'hasAssociation', 'hasAssetCollection'];
  const enabledKeys = getEnabledMetrics(ALL_KEYS);

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

  const categorisedResult        = safeCalculate(calculateCategorised,        context, 'categorised');
  const structuredTypesResult    = safeCalculate(calculateStructuredTypes,    context, 'structuredTypes');
  const hasParentResult          = safeCalculate(calculateHasParent,          context, 'hasParent');
  const hasAssociationResult     = safeCalculate(calculateHasAssociation,     context, 'hasAssociation');
  const hasAssetCollectionResult = safeCalculate(calculateHasAssetCollection, context, 'hasAssetCollection');

  timings.calculate = Date.now() - t2;

  const t3 = Date.now();
  renderMetrics(metricsArea, {
    completenessResults,
    categorisedResult,
    structuredTypesResult,
    hasParentResult,
    hasAssociationResult,
    hasAssetCollectionResult,
    enabledKeys,
    productCount: products.length,
    familyLabel,
    attributeCount: attributes.length,
    timings,
    config: CONFIG,
  });
  timings.render = Date.now() - t3;
  timings.total  = Date.now() - t0;

  debugLog('runMetrics.timings', { familyCode, ...timings });
}

// ── Phase 1: Fetch schema + render shell ──────────────────────────────────────

async function run(container) {
  renderLoading(container);

  let attributes, families;
  try {
    debugTime('fetchSchema');
    [attributes, families] = await Promise.all([
      fetchAttributeList(),
      fetchAllFamilies(),
    ]);
    debugTimeEnd('fetchSchema');
  } catch (err) {
    debugError('run.fetch', err);
    renderError(container, `Failed to load data from PIM: ${err.message}`);
    return;
  }

  debugLog('run', { attributesFetched: attributes.length, familiesFetched: families.length });

  const userLocale = globalThis.PIM.context?.user?.catalog_locale ?? 'en_US';

  const { metricsArea, defaultFamilyCode } = renderShell(container, {
    families,
    userLocale,
    config: CONFIG,
    onFamilyChange: (familyCode) => {
      runMetrics(metricsArea, { attributes, families, familyCode });
    },
  });

  await runMetrics(metricsArea, { attributes, families, familyCode: defaultFamilyCode });
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
    const c = document.getElementById('root');
    if (c) renderError(c, err.message);
  }
}

window.ConversionsOrderValue = { init };
init();
