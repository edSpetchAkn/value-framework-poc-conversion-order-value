/**
 * ValueFrameworkApp — root component for the Value Framework POC extension.
 *
 * Orchestrates data fetching and metric calculation for the
 * "Conversion & Order Value Increased" business outcome:
 *
 *   1. Completeness per channel at 100%
 *   2. Products categorised
 *   3. Attributes that are structured types
 *   4. Products with a Product Model parent
 *   5. Products with an association populated
 *   6. Products with an asset collection populated
 *
 * Data is fetched once on mount. All metric calculations are synchronous
 * and run on the pre-fetched data — no metric module makes API calls.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { CONFIG } from './config';
import { fetchProductSample } from './data/fetchProductSample';
import { fetchAttributeList } from './data/fetchAttributeList';
import { MetricCard } from './components/MetricCard';
import { CompletenessBreakdown } from './components/CompletenessBreakdown';
import * as completeness from './metrics/completeness';
import * as categorised from './metrics/categorised';
import * as structuredTypes from './metrics/structuredTypes';
import * as hasParent from './metrics/hasParent';
import * as hasAssociation from './metrics/hasAssociation';
import * as hasAssetCollection from './metrics/hasAssetCollection';
import type { MetricContext, MetricResult, CompletenessChannelResult } from './types';

// ─── Styles ───────────────────────────────────────────────────────────────────

const pageStyle: React.CSSProperties = {
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '32px 24px',
  color: '#11324D',
};

const headerStyle: React.CSSProperties = {
  marginBottom: '28px',
  paddingBottom: '20px',
  borderBottom: '1px solid #e8e8e8',
};

const titleStyle: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 700,
  color: '#11324D',
  margin: '0 0 6px 0',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#5a5a5a',
  margin: 0,
  lineHeight: '1.5',
};

const outcomeTagStyle: React.CSSProperties = {
  display: 'inline-block',
  marginTop: '10px',
  padding: '3px 10px',
  backgroundColor: '#EEF5FB',
  border: '1px solid #4CA8E0',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 600,
  color: '#11324D',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
  gap: '16px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#11324D',
  margin: '0 0 12px 0',
};

const sectionStyle: React.CSSProperties = {
  marginBottom: '28px',
};

const loadingStyle: React.CSSProperties = {
  padding: '40px 0',
  textAlign: 'center',
  color: '#5a5a5a',
  fontSize: '14px',
};

const errorStyle: React.CSSProperties = {
  padding: '12px 16px',
  backgroundColor: '#FDECEA',
  border: '1px solid #FACACA',
  borderRadius: '4px',
  color: '#CB1119',
  fontSize: '13px',
};

const sampleNoteStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#aaaaaa',
  margin: '0 0 24px 0',
};

const debugBadgeStyle: React.CSSProperties = {
  marginLeft: '10px',
  padding: '1px 8px',
  backgroundColor: '#3A3A3A',
  color: '#f0f0f0',
  borderRadius: '10px',
  fontSize: '11px',
  fontFamily: 'monospace',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardMetrics {
  completenessResults: CompletenessChannelResult[];
  categorisedResult: MetricResult;
  structuredTypesResult: MetricResult;
  hasParentResult: MetricResult;
  hasAssociationResult: MetricResult;
  hasAssetCollectionResult: MetricResult;
  productCount: number;
  attributeCount: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Root component for the Value Framework POC.
 *
 * Fetches products and attributes in parallel on mount, then calculates
 * all 6 metrics synchronously from the fetched data.
 *
 * @returns The complete dashboard UI.
 */
export function ValueFrameworkApp(): JSX.Element {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [attributes, setAttributes] = useState<Attribute[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch products and attributes in parallel on mount.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [fetchedProducts, fetchedAttributes] = await Promise.all([
          fetchProductSample(CONFIG),
          fetchAttributeList(CONFIG),
        ]);

        if (!cancelled) {
          setProducts(fetchedProducts);
          setAttributes(fetchedAttributes);
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          setError(msg);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, []);

  // Calculate all metrics synchronously once data is available.
  const metrics = useMemo<DashboardMetrics | null>(() => {
    if (!products || !attributes) return null;

    const context: MetricContext = { products, attributes, config: CONFIG };

    try {
      return {
        completenessResults: completeness.calculate(context),
        categorisedResult: categorised.calculate(context),
        structuredTypesResult: structuredTypes.calculate(context),
        hasParentResult: hasParent.calculate(context),
        hasAssociationResult: hasAssociation.calculate(context),
        hasAssetCollectionResult: hasAssetCollection.calculate(context),
        productCount: products.length,
        attributeCount: attributes.length,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Metric calculation failed: ${msg}`);
      return null;
    }
  }, [products, attributes]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={pageStyle}>
      {/* Header */}
      <header style={headerStyle}>
        <h1 style={titleStyle}>
          PIM Value Framework
          {CONFIG.DEBUG_MODE && <span style={debugBadgeStyle}>DEBUG</span>}
        </h1>
        <p style={subtitleStyle}>
          Maturity metrics for your product catalog — based on a sample of recently
          updated products.
        </p>
        <span style={outcomeTagStyle}>Conversion &amp; Order Value Increased</span>
      </header>

      {/* Loading state */}
      {isLoading && (
        <div style={loadingStyle} role="status" aria-live="polite">
          <p style={{ margin: '0 0 6px' }}>Loading catalog data…</p>
          <p style={{ margin: 0, fontSize: '12px', color: '#aaaaaa' }}>
            Fetching up to {CONFIG.MAX_PRODUCT_PAGES * CONFIG.PRODUCTS_PAGE_SIZE} products
            and all attributes
          </p>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div style={errorStyle} role="alert">
          <strong>Failed to load data:</strong> {error}
        </div>
      )}

      {/* Dashboard */}
      {metrics && !isLoading && (
        <>
          <p style={sampleNoteStyle}>
            Sample: {metrics.productCount.toLocaleString()} product
            {metrics.productCount !== 1 ? 's' : ''} (first {CONFIG.MAX_PRODUCT_PAGES * CONFIG.PRODUCTS_PAGE_SIZE} by API order)
            &nbsp;&middot;&nbsp;
            {metrics.attributeCount.toLocaleString()} total attributes
          </p>

          {/* Completeness per channel */}
          <section style={sectionStyle} aria-label="Completeness metrics">
            <h2 style={sectionTitleStyle}>Completeness at 100% — by channel</h2>
            <div style={gridStyle}>
              <CompletenessBreakdown results={metrics.completenessResults} />
            </div>
          </section>

          {/* Product-level metrics */}
          <section style={sectionStyle} aria-label="Product structure metrics">
            <h2 style={sectionTitleStyle}>Product structure</h2>
            <div style={gridStyle}>
              <MetricCard result={metrics.categorisedResult} />
              <MetricCard result={metrics.hasParentResult} />
              <MetricCard result={metrics.hasAssociationResult} />
              <MetricCard result={metrics.hasAssetCollectionResult} />
            </div>
          </section>

          {/* Catalog-level metrics */}
          <section style={sectionStyle} aria-label="Catalog structure metrics">
            <h2 style={sectionTitleStyle}>Catalog structure</h2>
            <div style={gridStyle}>
              <MetricCard result={metrics.structuredTypesResult} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
