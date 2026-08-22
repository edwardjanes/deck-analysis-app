'use client';

import { C, FONT_SANS, FONT_MONO } from '@/lib/theme';
import { formatCurrency, formatPercent } from '@/lib/valuation/format';

interface ReportClientProps {
  snapshot: any;
  company: any;
}

export default function ReportClient({ snapshot, company }: ReportClientProps) {
  const { outputs: report } = snapshot;

  const handlePrint = () => {
    window.print();
  };

  const containerStyle: React.CSSProperties = {
    backgroundColor: C.bg,
    color: C.text,
    fontFamily: FONT_SANS,
    minHeight: '100vh',
    padding: '2rem',
  };

  const navStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    paddingBottom: '1rem',
    borderBottom: `1px solid ${C.border}`,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '1.8rem',
    fontWeight: 700,
  };

  const buttonStyle: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    border: 'none',
    backgroundColor: C.accent,
    color: C.bg,
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.9rem',
  };

  const sectionStyle: React.CSSProperties = {
    backgroundColor: C.panel,
    border: `1px solid ${C.border}`,
    borderRadius: '0.75rem',
    padding: '2rem',
    marginBottom: '2rem',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '1.3rem',
    fontWeight: 700,
    marginBottom: '1.5rem',
    color: C.accent,
    borderBottom: `2px solid ${C.border}`,
    paddingBottom: '1rem',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
    marginBottom: '2rem',
  };

  const metricBoxStyle: React.CSSProperties = {
    backgroundColor: C.bg,
    border: `1px solid ${C.border}`,
    borderRadius: '0.5rem',
    padding: '1.5rem',
    textAlign: 'center',
  };

  const metricLabelStyle: React.CSSProperties = {
    fontSize: '0.85rem',
    color: C.textMuted,
    marginBottom: '0.5rem',
    textTransform: 'uppercase',
    fontWeight: 600,
  };

  const metricValueStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: C.accent,
    fontFamily: FONT_MONO,
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '1rem',
  };

  const thStyle: React.CSSProperties = {
    backgroundColor: C.border,
    padding: '0.75rem',
    textAlign: 'left',
    fontWeight: 600,
    borderBottom: `1px solid ${C.border}`,
  };

  const tdStyle: React.CSSProperties = {
    padding: '0.75rem',
    borderBottom: `1px solid ${C.border}`,
  };

  return (
    <div style={containerStyle}>
      {/* Navigation */}
      <div style={navStyle}>
        <h1 style={titleStyle}>{company.name} Valuation Report</h1>
        <button onClick={handlePrint} style={buttonStyle}>
          📄 Export PDF
        </button>
      </div>

      {/* Executive Summary */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Executive Summary</h2>

        <div style={gridStyle}>
          <div style={metricBoxStyle}>
            <div style={metricLabelStyle}>Valuation</div>
            <div style={metricValueStyle}>{formatCurrency(report.weightedValuation)}</div>
          </div>

          <div style={metricBoxStyle}>
            <div style={metricLabelStyle}>Low Bound (−20%)</div>
            <div style={metricValueStyle}>{formatCurrency(report.lowBound)}</div>
          </div>

          <div style={metricBoxStyle}>
            <div style={metricLabelStyle}>High Bound (+20%)</div>
            <div style={metricValueStyle}>{formatCurrency(report.highBound)}</div>
          </div>
        </div>

        <p style={{ color: C.textMuted, fontSize: '0.9rem', lineHeight: 1.6 }}>
          This valuation was calculated using six complementary methods: Scorecard, Checklist, VC Method,
          DCF with Long-Term Growth, DCF with Exit Multiple, and Simple Multiples. Each method is weighted
          based on the company's stage ({company.stage}) and the quality of available data.
        </p>
      </div>

      {/* Method Weights & Results */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Valuation Methods</h2>

        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Method</th>
              <th style={thStyle}>Valuation</th>
              <th style={thStyle}>Weight</th>
              <th style={thStyle}>Contribution</th>
            </tr>
          </thead>
          <tbody>
            {report.perMethod.map((method: any) => (
              <tr key={method.method}>
                <td style={tdStyle}>{method.method}</td>
                <td style={tdStyle}>{formatCurrency(method.valuation)}</td>
                <td style={tdStyle}>{formatPercent(method.weight)}</td>
                <td style={tdStyle}>{formatCurrency(method.weightedContribution)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Discount Rate */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Key Assumptions</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <p style={{ color: C.textMuted, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              Discount Rate (CAPM)
            </p>
            <p style={{ fontSize: '1.3rem', fontWeight: 700, color: C.accent }}>
              {formatPercent(report.discountRate, 2)}
            </p>
          </div>

          <div>
            <p style={{ color: C.textMuted, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              Company Stage
            </p>
            <p style={{ fontSize: '1.3rem', fontWeight: 700, color: C.accent }}>
              {company.stage.charAt(0).toUpperCase() + company.stage.slice(1)}
            </p>
          </div>
        </div>
      </div>

      {/* Generated At */}
      <div style={{ textAlign: 'center', color: C.textMuted, fontSize: '0.85rem', marginTop: '3rem' }}>
        <p>Report generated on {new Date(report.generatedAt).toLocaleDateString()}</p>
        <p style={{ marginTop: '2rem', fontSize: '0.8rem' }}>
          This valuation is illustrative and based on the data you provided. It should not be considered
          financial advice. Consult with professional advisors before making investment decisions.
        </p>
      </div>
    </div>
  );
}
