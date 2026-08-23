'use client';

import { C, FONT_SANS, FONT_MONO } from '@/lib/theme';
import { formatCurrency, formatPercent } from '@/lib/valuation/format';
import { STAGE_DEFAULT_WEIGHTS, SCORECARD_CRITERIA_WEIGHTS, CHECKLIST_CRITERIA_WEIGHTS } from '@/lib/valuation/referenceData';
import { diffParameters } from '@/lib/valuation/diff';
import { buildDefaultParameters } from '@/lib/valuation/defaults';

interface ReportClientProps {
  snapshot: any;
  company: any;
}

export default function ReportClient({ snapshot, company }: ReportClientProps) {
  const { outputs: report, inputs } = snapshot;
  const snapshotCompany = inputs.company || company;

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
    breakInside: 'avoid',
  };

  const coverPageStyle: React.CSSProperties = {
    ...sectionStyle,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '60vh',
    textAlign: 'center',
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

  const barChartContainerStyle: React.CSSProperties = {
    marginTop: '1.5rem',
    marginBottom: '1.5rem',
  };

  // Helper: Simple bar chart using inline SVG
  const BarChart = ({ data, label }: { data: { name: string; value: number }[]; label?: string }) => {
    if (!data || data.length === 0) return <p style={{ color: C.textMuted }}>No data available</p>;

    const maxValue = Math.max(...data.map(d => d.value));
    const width = 600;
    const height = 200;
    const barHeight = height / (data.length + 1);
    const barWidth = width * 0.8;

    return (
      <div style={barChartContainerStyle}>
        <svg width={width} height={height} style={{ border: `1px solid ${C.border}`, borderRadius: '0.5rem' }}>
          {data.map((item, idx) => {
            const barLength = (item.value / maxValue) * barWidth;
            const y = idx * barHeight + barHeight / 2;
            return (
              <g key={idx}>
                <rect x={60} y={y - barHeight / 4} width={barLength} height={barHeight / 2} fill={C.accent} opacity={0.8} />
                <text x={5} y={y + 4} fontSize="12" fill={C.text}>{item.name}</text>
                <text x={barWidth + 70} y={y + 4} fontSize="12" fill={C.text}>{formatCurrency(item.value)}</text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  const getLastYearFinancials = () => {
    if (!inputs.financials) return null;
    return inputs.financials.find((f: any) => f.yearOffset === -1);
  };

  const getEbitda = (yearOffset: number) => {
    const fcfe = report.fcfeByYear?.find((f: any) => f.yearOffset === yearOffset);
    return fcfe?.ebitda || 0;
  };

  const getEbit = (yearOffset: number) => {
    const fcfe = report.fcfeByYear?.find((f: any) => f.yearOffset === yearOffset);
    return fcfe?.ebit || 0;
  };

  const lastYearFinancials = getLastYearFinancials();
  const lastYearRevenue = lastYearFinancials?.revenue || 0;
  const lastYearEbitda = getEbitda(-1);

  return (
    <div style={containerStyle}>
      {/* Navigation */}
      <div style={navStyle}>
        <h1 style={titleStyle}>{snapshotCompany.name} Valuation Report</h1>
        <button onClick={handlePrint} style={buttonStyle}>
          📄 Export PDF
        </button>
      </div>

      {/* 1. Cover Page */}
      <div className="print-section-break" style={coverPageStyle}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Valuation Report</h1>
        <h2 style={{ fontSize: '1.8rem', color: C.accent, marginBottom: '2rem' }}>{snapshotCompany.name}</h2>
        <p style={{ fontSize: '1rem', marginBottom: '3rem' }}>
          As of {new Date(snapshot.created_at).toLocaleDateString()}
        </p>
        <p style={{ color: C.textMuted, fontSize: '0.9rem' }}>
          Generated on {new Date(report.generatedAt).toLocaleDateString()}
        </p>
        <p style={{ color: C.textMuted, fontSize: '0.85rem', marginTop: '2rem' }}>
          Prepared via Source Capital Valuation Engine
        </p>
      </div>

      {/* 2. About This Report */}
      <div className="print-section-break" style={sectionStyle}>
        <h2 style={sectionTitleStyle}>About This Report</h2>
        <p style={{ lineHeight: 1.7, fontSize: '0.95rem', color: C.textMuted }}>
          This valuation report synthesizes six complementary income and market-based approaches to startup valuation: the Scorecard Method (comparing against regional benchmarks), the Checklist Method (assessing business quality criteria), the VC Method (reverse-engineering from exit scenarios), DCF with Long-Term Growth (projecting sustainable terminal cash flow), DCF with Exit Multiple (using comparable company multiples for terminal value), and Simple Multiples (direct comparable company comparison). The final valuation represents a weighted average across these methods, with weights assigned based on the company's development stage and data quality. Discount rates are calculated using the Capital Asset Pricing Model (CAPM), blending the risk-free rate, industry beta, and equity risk premium for the company's country.
        </p>
      </div>

      {/* 3. Company Summary */}
      <div className="print-section-break" style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Company Summary</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          <div>
            <p style={{ color: C.textMuted, fontSize: '0.85rem', marginBottom: '0.5rem' }}>Company Name</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{snapshotCompany.name}</p>
          </div>
          <div>
            <p style={{ color: C.textMuted, fontSize: '0.85rem', marginBottom: '0.5rem' }}>Stage</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{snapshotCompany.stage.charAt(0).toUpperCase() + snapshotCompany.stage.slice(1)}</p>
          </div>
          <div>
            <p style={{ color: C.textMuted, fontSize: '0.85rem', marginBottom: '0.5rem' }}>Industry</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{snapshotCompany.industry}</p>
          </div>
          <div>
            <p style={{ color: C.textMuted, fontSize: '0.85rem', marginBottom: '0.5rem' }}>Country</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{snapshotCompany.country}</p>
          </div>
          <div>
            <p style={{ color: C.textMuted, fontSize: '0.85rem', marginBottom: '0.5rem' }}>Founded</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{snapshotCompany.started_year}</p>
          </div>
          <div>
            <p style={{ color: C.textMuted, fontSize: '0.85rem', marginBottom: '0.5rem' }}>Incorporated</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{snapshotCompany.incorporated_year || '—'}</p>
          </div>
          <div>
            <p style={{ color: C.textMuted, fontSize: '0.85rem', marginBottom: '0.5rem' }}>Founders</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{snapshotCompany.founders_count}</p>
          </div>
          <div>
            <p style={{ color: C.textMuted, fontSize: '0.85rem', marginBottom: '0.5rem' }}>Founder Capital Committed</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{snapshotCompany.founders_committed_capital ? formatCurrency(snapshotCompany.founders_committed_capital) : '—'}</p>
          </div>
          <div>
            <p style={{ color: C.textMuted, fontSize: '0.85rem', marginBottom: '0.5rem' }}>Employees</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{snapshotCompany.employees_count}</p>
          </div>
          <div>
            <p style={{ color: C.textMuted, fontSize: '0.85rem', marginBottom: '0.5rem' }}>Business Model</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{snapshotCompany.business_model || '—'}</p>
          </div>
          <div>
            <p style={{ color: C.textMuted, fontSize: '0.85rem', marginBottom: '0.5rem' }}>Business Activity</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{snapshotCompany.business_activity || '—'}</p>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <p style={{ color: C.textMuted, fontSize: '0.85rem', marginBottom: '0.5rem' }}>Description</p>
            <p style={{ fontSize: '1rem', fontWeight: 500, lineHeight: 1.5 }}>{snapshotCompany.description || '—'}</p>
          </div>
        </div>

        <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: `1px solid ${C.border}` }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Latest Operating Performance</h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Metric</th>
                <th style={thStyle}>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={tdStyle}>Revenue</td>
                <td style={tdStyle}>{formatCurrency(lastYearRevenue)}</td>
              </tr>
              <tr>
                <td style={tdStyle}>EBITDA</td>
                <td style={tdStyle}>{formatCurrency(lastYearEbitda)}</td>
              </tr>
              <tr>
                <td style={tdStyle}>EBITDA Margin</td>
                <td style={tdStyle}>{lastYearRevenue > 0 ? formatPercent(lastYearEbitda / lastYearRevenue) : '—'}</td>
              </tr>
              <tr>
                <td style={tdStyle}>Cash in Hand</td>
                <td style={tdStyle}>{inputs.balanceSheet?.cash_and_equivalents ? formatCurrency(inputs.balanceSheet.cash_and_equivalents) : '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Forecasts Summary */}
      <div className="print-section-break" style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Forecasts Summary</h2>

        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', marginTop: '2rem' }}>Revenue & Costs Forecast</h3>
        <BarChart
          data={(inputs.financials || [])
            .filter((f: any) => f.yearOffset >= 1)
            .slice(0, 5)
            .map((f: any) => ({
              name: `Year +${f.yearOffset}`,
              value: f.revenue,
            }))}
        />

        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', marginTop: '2rem' }}>FCFE Forecast</h3>
        <BarChart
          data={(report.fcfeByYear || [])
            .filter((f: any) => f.yearOffset >= 1)
            .map((f: any) => ({
              name: `Year +${f.yearOffset}`,
              value: f.fcfe,
            }))}
        />
      </div>

      {/* 5. Funding Rounds & Ownership */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Funding Rounds & Ownership</h2>

        {inputs.fundingRounds && inputs.fundingRounds.length > 0 && (
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Funding History</h3>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Round</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Investment</th>
                  <th style={thStyle}>Post-Money/Cap</th>
                </tr>
              </thead>
              <tbody>
                {inputs.fundingRounds.map((round: any, idx: number) => (
                  <tr key={idx}>
                    <td style={tdStyle}>{round.round_name}</td>
                    <td style={tdStyle}>{round.closed_date ? new Date(round.closed_date).toLocaleDateString() : '—'}</td>
                    <td style={tdStyle}>{formatCurrency(round.investment_amount)}</td>
                    <td style={tdStyle}>{formatCurrency(round.post_money_or_cap)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {inputs.capTable && inputs.capTable.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Cap Table</h3>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Shareholder</th>
                  <th style={thStyle}>Ownership %</th>
                </tr>
              </thead>
              <tbody>
                {inputs.capTable.map((shareholder: any, idx: number) => (
                  <tr key={idx}>
                    <td style={tdStyle}>{shareholder.shareholder_name}</td>
                    <td style={tdStyle}>{formatPercent(shareholder.share_percent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Valuation Summary (Enhanced) */}
      <div className="print-section-break" style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Valuation Summary</h2>

        <div style={gridStyle}>
          <div style={metricBoxStyle}>
            <div style={metricLabelStyle}>Valuation</div>
            <div style={metricValueStyle}>{formatCurrency(report.weightedValuation)}</div>
          </div>

          <div style={metricBoxStyle}>
            <div style={metricLabelStyle}>Low Bound (−9.6%)</div>
            <div style={metricValueStyle}>{formatCurrency(report.lowBound)}</div>
          </div>

          <div style={metricBoxStyle}>
            <div style={metricLabelStyle}>High Bound (+9.6%)</div>
            <div style={metricValueStyle}>{formatCurrency(report.highBound)}</div>
          </div>
        </div>

        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', marginTop: '2rem' }}>Method Comparison</h3>
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

      {/* 7. Scorecard Method */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Scorecard Method</h2>
        <p style={{ color: C.textMuted, fontSize: '0.9rem', marginBottom: '1rem' }}>
          The Scorecard Method compares the company against industry benchmarks for factors like team strength, opportunity size, competitive position, product/IP, partnerships, and funding requirements.
        </p>

        {report.methodResults?.scorecard?.criteria && (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Criterion</th>
                <th style={thStyle}>Weight</th>
                <th style={thStyle}>Score</th>
              </tr>
            </thead>
            <tbody>
              {report.methodResults.scorecard.criteria.map((c: any, idx: number) => (
                <tr key={idx}>
                  <td style={tdStyle}>{c.key}</td>
                  <td style={tdStyle}>{formatPercent(c.weight)}</td>
                  <td style={tdStyle}>{c.score.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: C.bg, borderRadius: '0.5rem' }}>
          <p style={{ color: C.textMuted, fontSize: '0.85rem' }}>Regional Baseline (Average Pre-Money):</p>
          <p style={{ fontSize: '1.3rem', fontWeight: 700, color: C.accent }}>
            {formatCurrency(inputs.parameters?.scorecard?.average_pre_money_valuation || 0)}
          </p>
          <p style={{ color: C.textMuted, fontSize: '0.85rem', marginTop: '1rem' }}>Scorecard Valuation:</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: C.accent }}>
            {formatCurrency(report.methodResults?.scorecard?.valuation || 0)}
          </p>
        </div>
      </div>

      {/* 8. Checklist Method */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Checklist Method</h2>
        <p style={{ color: C.textMuted, fontSize: '0.9rem', marginBottom: '1rem' }}>
          The Checklist Method assigns scores to five key dimensions: Team, Idea, Product/IP, Relationships, and Operating Stage. The weighted sum is then capped at the maximum valuation for the company's region.
        </p>

        {report.methodResults?.checklist?.criteria && (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Criterion</th>
                <th style={thStyle}>Weight</th>
                <th style={thStyle}>Score</th>
                <th style={thStyle}>Achieved Value</th>
              </tr>
            </thead>
            <tbody>
              {report.methodResults.checklist.criteria.map((c: any, idx: number) => (
                <tr key={idx}>
                  <td style={tdStyle}>{c.key}</td>
                  <td style={tdStyle}>{formatPercent(c.weight)}</td>
                  <td style={tdStyle}>{c.score.toFixed(2)}</td>
                  <td style={tdStyle}>{formatCurrency(c.achievedValue || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: C.bg, borderRadius: '0.5rem' }}>
          <p style={{ color: C.textMuted, fontSize: '0.85rem' }}>Maximum Valuation (Regional):</p>
          <p style={{ fontSize: '1.3rem', fontWeight: 700, color: C.accent }}>
            {formatCurrency(inputs.parameters?.checklist?.max_valuation || 0)}
          </p>
          <p style={{ color: C.textMuted, fontSize: '0.85rem', marginTop: '1rem' }}>Checklist Valuation:</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: C.accent }}>
            {formatCurrency(report.methodResults?.checklist?.valuation || 0)}
          </p>
        </div>
      </div>

      {/* 9. Qualitative Traits Summary */}
      <div className="print-section-break" style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Qualitative Assessment</h2>
        {inputs.questionnaire && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: C.accent }}>Team</h3>
              <table style={tableStyle}>
                <tbody>
                  <tr><td style={tdStyle}>Team Size</td><td style={tdStyle}>{inputs.questionnaire.team_size || '—'}</td></tr>
                  <tr><td style={tdStyle}>Has CTO</td><td style={tdStyle}>{inputs.questionnaire.team_has_cto ? 'Yes' : 'No'}</td></tr>
                  <tr><td style={tdStyle}>Has Business Lead</td><td style={tdStyle}>{inputs.questionnaire.team_has_business_lead ? 'Yes' : 'No'}</td></tr>
                  <tr><td style={tdStyle}>Prior Exits</td><td style={tdStyle}>{inputs.questionnaire.team_prior_exits ? 'Yes' : 'No'}</td></tr>
                </tbody>
              </table>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: C.accent }}>Business Model</h3>
              <table style={tableStyle}>
                <tbody>
                  <tr><td style={tdStyle}>Business Model Type</td><td style={tdStyle}>{inputs.questionnaire.business_model_type || '—'}</td></tr>
                  <tr><td style={tdStyle}>Recurring Revenue</td><td style={tdStyle}>{inputs.questionnaire.recurring_revenue ? 'Yes' : 'No'}</td></tr>
                  <tr><td style={tdStyle}>TAM Size</td><td style={tdStyle}>{inputs.questionnaire.tam_size ? formatCurrency(inputs.questionnaire.tam_size) : '—'}</td></tr>
                  <tr><td style={tdStyle}>Market Growth Rate</td><td style={tdStyle}>{inputs.questionnaire.market_growth_rate ? formatPercent(inputs.questionnaire.market_growth_rate) : '—'}</td></tr>
                </tbody>
              </table>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: C.accent }}>Product & Market</h3>
              <table style={tableStyle}>
                <tbody>
                  <tr><td style={tdStyle}>Product Status</td><td style={tdStyle}>{inputs.questionnaire.product_status || '—'}</td></tr>
                  <tr><td style={tdStyle}>Has Customers</td><td style={tdStyle}>{inputs.questionnaire.has_customers ? 'Yes' : 'No'}</td></tr>
                  <tr><td style={tdStyle}>Product-Market Fit</td><td style={tdStyle}>{inputs.questionnaire.product_market_fit ? 'Yes' : 'No'}</td></tr>
                </tbody>
              </table>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: C.accent }}>IP & Legal</h3>
              <table style={tableStyle}>
                <tbody>
                  <tr><td style={tdStyle}>Has Patents</td><td style={tdStyle}>{inputs.questionnaire.has_patents ? 'Yes' : 'No'}</td></tr>
                  <tr><td style={tdStyle}>Has IP</td><td style={tdStyle}>{inputs.questionnaire.has_ip ? 'Yes' : 'No'}</td></tr>
                  <tr><td style={tdStyle}>IP Protection Stage</td><td style={tdStyle}>{inputs.questionnaire.ip_protection_stage || '—'}</td></tr>
                  <tr><td style={tdStyle}>Legal Risks</td><td style={tdStyle}>{inputs.questionnaire.legal_risks ? 'Yes' : 'No'}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 10. VC Method */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>VC Method</h2>
        <p style={{ color: C.textMuted, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          The VC Method projects a terminal valuation based on exit multiples, then discounts it back using a required return rate commensurate with the company's stage.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          <div>
            <p style={{ color: C.textMuted, fontSize: '0.85rem' }}>Exit Multiple</p>
            <p style={{ fontSize: '1.3rem', fontWeight: 700, color: C.accent }}>
              {(inputs.parameters?.vc_method?.industry_multiple ?? 0).toFixed(2)}x
            </p>
          </div>
          <div>
            <p style={{ color: C.textMuted, fontSize: '0.85rem' }}>Required ROI</p>
            <p style={{ fontSize: '1.3rem', fontWeight: 700, color: C.accent }}>
              {formatPercent(inputs.parameters?.vc_method?.required_roi || 0, 0)}
            </p>
          </div>
        </div>

        <div style={{ padding: '1rem', backgroundColor: C.bg, borderRadius: '0.5rem' }}>
          <p style={{ color: C.textMuted, fontSize: '0.85rem' }}>VC Method Valuation:</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: C.accent }}>
            {formatCurrency(report.methodResults?.vc?.valuation || 0)}
          </p>
        </div>
      </div>

      {/* 11. DCF with LTG */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>DCF with Long-Term Growth</h2>
        <p style={{ color: C.textMuted, fontSize: '0.9rem', marginBottom: '1rem' }}>
          The DCF-LTG method projects free cash flows over 5 years and assumes a steady-state terminal value growing at a long-term rate perpetually.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <p style={{ color: C.textMuted, fontSize: '0.85rem' }}>Discount Rate</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 700, color: C.accent }}>{formatPercent(report.discountRate, 2)}</p>
          </div>
          <div>
            <p style={{ color: C.textMuted, fontSize: '0.85rem' }}>Terminal Growth Rate</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 700, color: C.accent }}>
              {formatPercent(inputs.parameters?.dcf_ltg?.terminal_growth_rate || 0, 2)}
            </p>
          </div>
          <div>
            <p style={{ color: C.textMuted, fontSize: '0.85rem' }}>Discounted FCF Sum</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 700, color: C.accent }}>
              {formatCurrency(report.methodResults?.dcfLtg?.discountedFcfSum || 0)}
            </p>
          </div>
          <div>
            <p style={{ color: C.textMuted, fontSize: '0.85rem' }}>Terminal Value (Discounted)</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 700, color: C.accent }}>
              {formatCurrency(report.methodResults?.dcfLtg?.discountedTerminalValue || 0)}
            </p>
          </div>
        </div>

        <div style={{ padding: '1rem', backgroundColor: C.bg, borderRadius: '0.5rem' }}>
          <p style={{ color: C.textMuted, fontSize: '0.85rem' }}>DCF-LTG Valuation:</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: C.accent }}>
            {formatCurrency(report.methodResults?.dcfLtg?.valuation || 0)}
          </p>
        </div>
      </div>

      {/* 12. DCF with Multiples */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>DCF with Exit Multiple</h2>
        <p style={{ color: C.textMuted, fontSize: '0.9rem', marginBottom: '1rem' }}>
          The DCF-Multiple method uses an industry-specific exit multiple applied to a future revenue or EBITDA figure to set the terminal value.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <p style={{ color: C.textMuted, fontSize: '0.85rem' }}>Exit Multiple</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 700, color: C.accent }}>
              {(inputs.parameters?.dcf_multiple?.exit_multiple ?? 0).toFixed(2)}x
            </p>
          </div>
          <div>
            <p style={{ color: C.textMuted, fontSize: '0.85rem' }}>Discount Rate</p>
            <p style={{ fontSize: '1.2rem', fontWeight: 700, color: C.accent }}>{formatPercent(report.discountRate, 2)}</p>
          </div>
        </div>

        <div style={{ padding: '1rem', backgroundColor: C.bg, borderRadius: '0.5rem' }}>
          <p style={{ color: C.textMuted, fontSize: '0.85rem' }}>DCF-Multiple Valuation:</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: C.accent }}>
            {formatCurrency(report.methodResults?.dcfMultiple?.valuation || 0)}
          </p>
        </div>
      </div>

      {/* 13. Multiples Method */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Simple Multiples Method</h2>
        <p style={{ color: C.textMuted, fontSize: '0.9rem', marginBottom: '1rem' }}>
          The Simple Multiples method values the company by applying the median multiple from comparable companies to the company's current revenue or EBITDA.
        </p>

        {inputs.comparables && inputs.comparables.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Comparable Companies</h3>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Company</th>
                  <th style={thStyle}>Multiple</th>
                  <th style={thStyle}>Metric Type</th>
                </tr>
              </thead>
              <tbody>
                {inputs.comparables.map((comp: any, idx: number) => (
                  <tr key={idx}>
                    <td style={tdStyle}>{comp.company_name}</td>
                    <td style={tdStyle}>{(comp.multiple ?? 0).toFixed(2)}x</td>
                    <td style={tdStyle}>{comp.metric_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ padding: '1rem', backgroundColor: C.bg, borderRadius: '0.5rem' }}>
          <p style={{ color: C.textMuted, fontSize: '0.85rem' }}>Multiples Valuation:</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: C.accent }}>
            {formatCurrency(report.methodResults?.multiples?.valuation || 0)}
          </p>
        </div>
      </div>

      {/* 14. Updated Default Values */}
      <div className="print-section-break" style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Updated Default Values</h2>
        <p style={{ color: C.textMuted, fontSize: '0.9rem', marginBottom: '1rem' }}>
          This section shows which default parameters were overridden from the platform's baseline for this company.
        </p>

        {(() => {
          const defaultParams = buildDefaultParameters(
            {
              name: snapshotCompany.name,
              country: snapshotCompany.country,
              industry: snapshotCompany.industry,
              stage: snapshotCompany.stage,
            },
            inputs.financials || [],
            inputs.balanceSheet
          );

          // Build a list of meaningful leaf fields to compare
          const fields: { label: string; current: number; default: number; format: 'currency' | 'percent' }[] = [];

          if (inputs.parameters?.dcf_shared?.discount_rate !== defaultParams.dcf_shared.discount_rate) {
            fields.push({
              label: 'Discount Rate',
              current: inputs.parameters?.dcf_shared?.discount_rate || 0,
              default: defaultParams.dcf_shared.discount_rate,
              format: 'percent',
            });
          }

          if (inputs.parameters?.vc_method?.industry_multiple !== defaultParams.vc_method.industry_multiple) {
            fields.push({
              label: 'VC Method Exit Multiple',
              current: inputs.parameters?.vc_method?.industry_multiple || 0,
              default: defaultParams.vc_method.industry_multiple,
              format: 'currency',
            });
          }

          if (inputs.parameters?.dcf_multiple?.exit_multiple !== defaultParams.dcf_multiple.exit_multiple) {
            fields.push({
              label: 'DCF Multiple Exit Multiple',
              current: inputs.parameters?.dcf_multiple?.exit_multiple || 0,
              default: defaultParams.dcf_multiple.exit_multiple,
              format: 'currency',
            });
          }

          if (inputs.parameters?.scorecard?.average_pre_money_valuation !== defaultParams.scorecard.average_pre_money_valuation) {
            fields.push({
              label: 'Scorecard Average Pre-Money',
              current: inputs.parameters?.scorecard?.average_pre_money_valuation || 0,
              default: defaultParams.scorecard.average_pre_money_valuation,
              format: 'currency',
            });
          }

          if (inputs.parameters?.checklist?.max_valuation !== defaultParams.checklist.max_valuation) {
            fields.push({
              label: 'Checklist Maximum Valuation',
              current: inputs.parameters?.checklist?.max_valuation || 0,
              default: defaultParams.checklist.max_valuation,
              format: 'currency',
            });
          }

          if (inputs.parameters?.dcf_ltg?.terminal_growth_rate !== defaultParams.dcf_ltg.terminal_growth_rate) {
            fields.push({
              label: 'DCF Terminal Growth Rate',
              current: inputs.parameters?.dcf_ltg?.terminal_growth_rate || 0,
              default: defaultParams.dcf_ltg.terminal_growth_rate,
              format: 'percent',
            });
          }

          if (inputs.parameters?.dcf_shared?.illiquidity_discount !== defaultParams.dcf_shared.illiquidity_discount) {
            fields.push({
              label: 'Illiquidity Discount',
              current: inputs.parameters?.dcf_shared?.illiquidity_discount || 0,
              default: defaultParams.dcf_shared.illiquidity_discount,
              format: 'percent',
            });
          }

          if (fields.length === 0) {
            return <p style={{ color: C.textMuted }}>No parameters were overridden — this report uses platform defaults throughout.</p>;
          }

          return (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Parameter</th>
                  <th style={thStyle}>Platform Default</th>
                  <th style={thStyle}>Used Value</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, idx) => (
                  <tr key={idx}>
                    <td style={tdStyle}>{field.label}</td>
                    <td style={tdStyle}>{field.format === 'percent' ? formatPercent(field.default, 2) : formatCurrency(field.default)}</td>
                    <td style={tdStyle}>{field.format === 'percent' ? formatPercent(field.current, 2) : formatCurrency(field.current)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          );
        })()}
      </div>

      {/* 15. Financial Projections P&L */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Financial Projections — P&L</h2>
        {inputs.financials && inputs.financials.length > 0 && (
          <table style={{ ...tableStyle, fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th style={thStyle}>Metric</th>
                {inputs.financials.map((f: any, idx: number) => (
                  <th key={idx} style={thStyle}>Year {f.yearOffset >= 0 ? '+' : ''}{f.yearOffset}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={tdStyle}>Revenue</td>
                {inputs.financials.map((f: any, idx: number) => (
                  <td key={idx} style={tdStyle}>{formatCurrency(f.revenue)}</td>
                ))}
              </tr>
              <tr>
                <td style={tdStyle}>COGS</td>
                {inputs.financials.map((f: any, idx: number) => (
                  <td key={idx} style={tdStyle}>{formatCurrency(f.cogs)}</td>
                ))}
              </tr>
              <tr>
                <td style={tdStyle}>Salaries</td>
                {inputs.financials.map((f: any, idx: number) => (
                  <td key={idx} style={tdStyle}>{formatCurrency(f.salaries)}</td>
                ))}
              </tr>
              <tr>
                <td style={tdStyle}>OpEx</td>
                {inputs.financials.map((f: any, idx: number) => (
                  <td key={idx} style={tdStyle}>{formatCurrency(f.other_opex)}</td>
                ))}
              </tr>
              <tr style={{ fontWeight: 600 }}>
                <td style={tdStyle}>EBITDA</td>
                {report.fcfeByYear.map((fcfe: any, idx: number) => (
                  <td key={idx} style={tdStyle}>{formatCurrency(fcfe.ebitda)}</td>
                ))}
              </tr>
              <tr>
                <td style={tdStyle}>EBITDA Margin</td>
                {inputs.financials.map((f: any, idx: number) => {
                  const ebitda = report.fcfeByYear[inputs.financials.indexOf(f)]?.ebitda || 0;
                  return <td key={idx} style={tdStyle}>{f.revenue ? formatPercent(ebitda / f.revenue) : '—'}</td>;
                })}
              </tr>
              <tr>
                <td style={tdStyle}>D&A</td>
                {report.fcfeByYear.map((fcfe: any, idx: number) => (
                  <td key={idx} style={tdStyle}>{formatCurrency(fcfe.da)}</td>
                ))}
              </tr>
              <tr style={{ fontWeight: 600 }}>
                <td style={tdStyle}>EBIT</td>
                {report.fcfeByYear.map((fcfe: any, idx: number) => (
                  <td key={idx} style={tdStyle}>{formatCurrency(fcfe.ebit)}</td>
                ))}
              </tr>
              <tr>
                <td style={tdStyle}>EBIT Margin</td>
                {inputs.financials.map((f: any, idx: number) => {
                  const ebit = report.fcfeByYear[inputs.financials.indexOf(f)]?.ebit || 0;
                  return <td key={idx} style={tdStyle}>{f.revenue ? formatPercent(ebit / f.revenue) : '—'}</td>;
                })}
              </tr>
              <tr>
                <td style={tdStyle}>Interest</td>
                {inputs.financials.map((f: any, idx: number) => (
                  <td key={idx} style={tdStyle}>{formatCurrency(f.interest)}</td>
                ))}
              </tr>
              <tr>
                <td style={tdStyle}>EBT</td>
                {report.fcfeByYear.map((fcfe: any, idx: number) => (
                  <td key={idx} style={tdStyle}>{formatCurrency(fcfe.ebt)}</td>
                ))}
              </tr>
              <tr>
                <td style={tdStyle}>Taxes</td>
                {inputs.financials.map((f: any, idx: number) => (
                  <td key={idx} style={tdStyle}>{formatCurrency(f.taxes)}</td>
                ))}
              </tr>
              <tr style={{ fontWeight: 600 }}>
                <td style={tdStyle}>Net Profit</td>
                {report.fcfeByYear.map((fcfe: any, idx: number) => (
                  <td key={idx} style={tdStyle}>{formatCurrency(fcfe.netIncome)}</td>
                ))}
              </tr>
              <tr>
                <td style={tdStyle}>Net Margin</td>
                {inputs.financials.map((f: any, idx: number) => {
                  const netIncome = report.fcfeByYear[inputs.financials.indexOf(f)]?.netIncome || 0;
                  return <td key={idx} style={tdStyle}>{f.revenue ? formatPercent(netIncome / f.revenue) : '—'}</td>;
                })}
              </tr>
            </tbody>
          </table>
        )}
      </div>

      {/* 16. Financial Projections Cash Flow */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Financial Projections — Cash Flow</h2>
        {report.fcfeByYear && report.fcfeByYear.length > 0 && inputs.financials && (
          <table style={{ ...tableStyle, fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th style={thStyle}>Metric</th>
                {inputs.financials.map((f: any, idx: number) => (
                  <th key={idx} style={thStyle}>Year {f.yearOffset >= 0 ? '+' : ''}{f.yearOffset}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={tdStyle}>Net Income</td>
                {report.fcfeByYear.map((fcfe: any, idx: number) => (
                  <td key={idx} style={tdStyle}>{formatCurrency(fcfe.netIncome)}</td>
                ))}
              </tr>
              <tr>
                <td style={tdStyle}>D&A</td>
                {report.fcfeByYear.map((fcfe: any, idx: number) => (
                  <td key={idx} style={tdStyle}>{formatCurrency(fcfe.da)}</td>
                ))}
              </tr>
              <tr>
                <td style={tdStyle}>ΔWorking Capital</td>
                {report.fcfeByYear.map((fcfe: any, idx: number) => (
                  <td key={idx} style={tdStyle}>{formatCurrency(fcfe.deltaWc)}</td>
                ))}
              </tr>
              <tr>
                <td style={tdStyle}>Working Capital</td>
                {inputs.financials.map((f: any, idx: number) => {
                  const wc = (f.receivables || 0) + (f.inventory || 0) - (f.payables || 0);
                  return <td key={idx} style={tdStyle}>{formatCurrency(wc)}</td>;
                })}
              </tr>
              <tr>
                <td style={tdStyle}>Receivables</td>
                {inputs.financials.map((f: any, idx: number) => (
                  <td key={idx} style={tdStyle}>{formatCurrency(f.receivables || 0)}</td>
                ))}
              </tr>
              <tr>
                <td style={tdStyle}>Inventory</td>
                {inputs.financials.map((f: any, idx: number) => (
                  <td key={idx} style={tdStyle}>{formatCurrency(f.inventory || 0)}</td>
                ))}
              </tr>
              <tr>
                <td style={tdStyle}>Payables</td>
                {inputs.financials.map((f: any, idx: number) => (
                  <td key={idx} style={tdStyle}>{formatCurrency(f.payables || 0)}</td>
                ))}
              </tr>
              <tr>
                <td style={tdStyle}>Capex</td>
                {inputs.financials.map((f: any, idx: number) => (
                  <td key={idx} style={tdStyle}>{formatCurrency(f.capex || 0)}</td>
                ))}
              </tr>
              <tr>
                <td style={tdStyle}>ΔDebt</td>
                {report.fcfeByYear.map((fcfe: any, idx: number) => (
                  <td key={idx} style={tdStyle}>{formatCurrency(fcfe.deltaDebt)}</td>
                ))}
              </tr>
              <tr>
                <td style={tdStyle}>Debt (Year-end)</td>
                {inputs.financials.map((f: any, idx: number) => (
                  <td key={idx} style={tdStyle}>{formatCurrency(f.debt || 0)}</td>
                ))}
              </tr>
              <tr>
                <td style={tdStyle}>Equity Fundraising</td>
                {inputs.financials.map((f: any, idx: number) => (
                  <td key={idx} style={tdStyle}>{formatCurrency(f.fundraisingPlan || 0)}</td>
                ))}
              </tr>
              <tr style={{ fontWeight: 600 }}>
                <td style={tdStyle}>FCFE</td>
                {report.fcfeByYear.map((fcfe: any, idx: number) => (
                  <td key={idx} style={tdStyle}>{formatCurrency(fcfe.fcfe)}</td>
                ))}
              </tr>
              <tr style={{ fontWeight: 600 }}>
                <td style={tdStyle}>Free Cash Flow (FCFE + Fundraising)</td>
                {inputs.financials.map((f: any, idx: number) => {
                  const fcfe = report.fcfeByYear[inputs.financials.indexOf(f)]?.fcfe || 0;
                  const freeCF = fcfe + (f.fundraisingPlan || 0);
                  return <td key={idx} style={tdStyle}>{formatCurrency(freeCF)}</td>;
                })}
              </tr>
              <tr style={{ color: C.textMuted, fontStyle: 'italic' }}>
                <td style={tdStyle}>Cash Balance (Illustrative)</td>
                {inputs.financials.map((f: any, idx: number) => {
                  let cashBalance = inputs.balanceSheet?.cash_and_equivalents || 0;
                  for (let i = 0; i <= idx; i++) {
                    const fcfe = report.fcfeByYear[i]?.fcfe || 0;
                    const freeCF = fcfe + (inputs.financials[i]?.fundraisingPlan || 0);
                    cashBalance += freeCF;
                  }
                  return <td key={idx} style={tdStyle}>{formatCurrency(cashBalance)}</td>;
                })}
              </tr>
            </tbody>
          </table>
        )}
      </div>

      {/* 17. Appendix */}
      <div className="print-section-break" style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Appendix</h2>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: C.accent }}>Method Weights by Stage</h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Stage</th>
                <th style={thStyle}>Scorecard</th>
                <th style={thStyle}>Checklist</th>
                <th style={thStyle}>VC</th>
                <th style={thStyle}>DCF-LTG</th>
                <th style={thStyle}>DCF-Multi</th>
                <th style={thStyle}>Multiples</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(STAGE_DEFAULT_WEIGHTS).map(([stage, weights]: [string, any]) => (
                <tr key={stage} style={{ backgroundColor: snapshotCompany.stage === stage ? C.border : 'transparent' }}>
                  <td style={tdStyle}>{stage}</td>
                  <td style={tdStyle}>{formatPercent(weights.scorecard)}</td>
                  <td style={tdStyle}>{formatPercent(weights.checklist)}</td>
                  <td style={tdStyle}>{formatPercent(weights.vc)}</td>
                  <td style={tdStyle}>{formatPercent(weights.dcf_ltg)}</td>
                  <td style={tdStyle}>{formatPercent(weights.dcf_multiple)}</td>
                  <td style={tdStyle}>{formatPercent(weights.multiples)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: C.bg, borderRadius: '0.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: C.accent }}>Data Sources</h3>
          <p style={{ color: C.textMuted, fontSize: '0.85rem', lineHeight: 1.6 }}>
            Country pre-money/max valuation baselines: Equidam Parameters Update, Feb 2026, derived from 30 months of real transaction data.
            Discount rate: CAPM (risk-free rate from Trading Economics, beta from Damodaran/NYU Stern, equity risk premium from Damodaran).
            Industry multiples: Equidam TRBC published data (July 2026) and Damodaran unlevered beta (Jan 2026).
          </p>
        </div>

        <div style={{ padding: '1rem', backgroundColor: C.bg, borderRadius: '0.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: C.accent }}>Disclaimer</h3>
          <p style={{ color: C.textMuted, fontSize: '0.85rem', lineHeight: 1.6 }}>
            This valuation is illustrative and based on the data provided. It should not be considered financial advice.
            Consult with professional advisors before making investment decisions. All assumptions and data are subject to change.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', color: C.textMuted, fontSize: '0.8rem', marginTop: '3rem' }}>
        <p>Report generated on {new Date(report.generatedAt).toLocaleDateString()}</p>
      </div>
    </div>
  );
}
