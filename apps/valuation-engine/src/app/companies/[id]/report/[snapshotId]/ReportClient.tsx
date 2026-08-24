'use client';

import { useEffect, useRef, useState } from 'react';
import { formatCurrency, formatPercent } from '@/lib/valuation/format';
import { STAGE_DEFAULT_WEIGHTS } from '@/lib/valuation/referenceData';
import { buildDefaultParameters } from '@/lib/valuation/defaults';
import { ReportChart } from '../ReportChart';
import '../report.css';

interface ReportClientProps {
  snapshot: any;
  company: any;
}

interface NavItem {
  id: string;
  label: string;
}
interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { id: 'cover', label: 'Cover' },
      { id: 'about', label: 'About this report' },
      { id: 'company-summary', label: 'Company summary' },
      { id: 'forecasts', label: 'Forecasts summary' },
      { id: 'funding-ownership', label: 'Funding & ownership' },
      { id: 'valuation-summary', label: 'Valuation summary' },
    ],
  },
  {
    label: 'Methods',
    items: [
      { id: 'scorecard', label: 'Scorecard method' },
      { id: 'checklist', label: 'Checklist method' },
      { id: 'vc-method', label: 'VC method' },
      { id: 'dcf-ltg', label: 'DCF with LTG' },
      { id: 'dcf-multiple', label: 'DCF with multiple' },
      { id: 'multiples', label: 'Simple multiples' },
    ],
  },
  {
    label: 'Detail',
    items: [
      { id: 'qualitative', label: 'Qualitative assessment' },
      { id: 'default-values', label: 'Updated default values' },
      { id: 'pnl', label: 'Financial projections – P&L' },
      { id: 'cash-flow', label: 'Financial projections – cash flow' },
    ],
  },
  {
    label: 'Appendix',
    items: [
      { id: 'method-weights', label: 'Method weights by stage' },
      { id: 'sources-disclaimer', label: 'Sources & disclaimer' },
    ],
  },
];

const ALL_SECTION_IDS = NAV.flatMap((g) => g.items.map((i) => i.id));

export default function ReportClient({ snapshot, company }: ReportClientProps) {
  const { outputs: report, inputs } = snapshot;
  const snapshotCompany = inputs.company || company;
  const [activeId, setActiveId] = useState<string>('cover');
  const bookRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => window.print();

  useEffect(() => {
    function onScroll() {
      let current = ALL_SECTION_IDS[0];
      for (const id of ALL_SECTION_IDS) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= 120) current = id;
      }
      setActiveId(current);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function goTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const getLastYearFinancials = () =>
    (inputs.financials || []).find((f: any) => f.yearOffset === -1) || null;

  const getFcfeByYear = (yearOffset: number) =>
    report.fcfeByYear?.find((f: any) => f.yearOffset === yearOffset);

  const lastYearFinancials = getLastYearFinancials();
  const lastYearRevenue = lastYearFinancials?.revenue || 0;
  const lastYearEbitda = getFcfeByYear(-1)?.ebitda || 0;

  const stageLabel = snapshotCompany.stage
    ? snapshotCompany.stage.charAt(0).toUpperCase() + snapshotCompany.stage.slice(1)
    : '–';

  return (
    <div className="rpt">
      <div className="rpt-topbar">
        <h1>{snapshotCompany.name} – Valuation Report</h1>
        <button onClick={handlePrint} className="rpt-export-btn">
          Export PDF
        </button>
      </div>

      <div className="rpt-shell">
        <nav className="rpt-rail" aria-label="Report sections">
          {NAV.map((group) => (
            <div className="rpt-rail-group" key={group.label}>
              <div className="rpt-rail-group-label">{group.label}</div>
              {group.items.map((item) => (
                <a
                  key={item.id}
                  className={activeId === item.id ? 'active' : ''}
                  onClick={() => goTo(item.id)}
                >
                  {item.label}
                </a>
              ))}
            </div>
          ))}
        </nav>

        <div className="rpt-book" ref={bookRef}>
          {/* Cover */}
          <section id="cover" className="rpt-page rpt-cover">
            <div className="rpt-cover-mark">
              {snapshotCompany.name?.charAt(0)?.toUpperCase() || 'V'}
            </div>
            <div className="rpt-cover-kicker">Valuation Report</div>
            <h2 className="rpt-cover-company">{snapshotCompany.name}</h2>
            <div className="rpt-cover-date">
              As of {new Date(snapshot.created_at).toLocaleDateString()}
            </div>
            <div className="rpt-cover-rule" />
            <div className="rpt-cover-meta">
              <div>
                Generated on <b>{new Date(report.generatedAt).toLocaleDateString()}</b>
              </div>
              <div>
                Prepared via <b>Source Capital Valuation Engine</b>
              </div>
            </div>
          </section>

          {/* About */}
          <section id="about" className="rpt-page">
            <div className="rpt-kicker">Overview</div>
            <h2 className="rpt-title">About This Report</h2>
            <p className="rpt-lede" style={{ marginBottom: 0 }}>
              This valuation report synthesizes six complementary income and market-based approaches to startup valuation.
            </p>
          </section>

          {/* Company summary */}
          <section id="company-summary" className="rpt-page">
            <div className="rpt-kicker">Overview</div>
            <h2 className="rpt-title">Company Summary</h2>
            <div className="rpt-sub">Profile as recorded at time of valuation</div>

            <div className="rpt-field-grid" style={{ marginBottom: 28 }}>
              <Field label="Company Name" value={snapshotCompany.name} />
              <Field label="Stage" value={stageLabel} />
              <Field label="Industry" value={snapshotCompany.industry} />
              <Field label="Country" value={snapshotCompany.country} />
            </div>

            <div className="rpt-section-h">Latest Operating Performance</div>
            <div className="rpt-table-scroll">
              <table className="rpt-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th className="num">Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Revenue</td>
                    <td className="num">{formatCurrency(lastYearRevenue)}</td>
                  </tr>
                  <tr>
                    <td>EBITDA</td>
                    <td className="num">{formatCurrency(lastYearEbitda)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Forecasts summary */}
          <section id="forecasts" className="rpt-page">
            <div className="rpt-kicker">Overview</div>
            <h2 className="rpt-title">Forecasts Summary</h2>
            <div className="rpt-sub">5-year projection, as entered in the wizard</div>

            <div className="rpt-section-block">
              <div className="rpt-section-h">Revenue Forecast</div>
              <ReportChart
                categories={(inputs.financials || [])
                  .filter((f: any) => f.yearOffset >= 1)
                  .slice(0, 5)
                  .map((f: any) => `Year +${f.yearOffset}`)}
                series={[
                  {
                    name: 'Revenue',
                    values: (inputs.financials || [])
                      .filter((f: any) => f.yearOffset >= 1)
                      .slice(0, 5)
                      .map((f: any) => f.revenue ?? null),
                    color: 'var(--cat-1)',
                  },
                ]}
              />
            </div>
          </section>

          {/* Funding & ownership */}
          <section id="funding-ownership" className="rpt-page">
            <div className="rpt-kicker">Overview</div>
            <h2 className="rpt-title">Funding Rounds &amp; Ownership</h2>
            <p className="rpt-lede">Funding history and cap table snapshot.</p>
          </section>

          {/* Valuation summary */}
          <section id="valuation-summary" className="rpt-page">
            <div className="rpt-kicker">Overview</div>
            <h2 className="rpt-title">Valuation Summary</h2>
            <div className="rpt-sub">Weighted across all six methods for this company's stage</div>

            <div className="rpt-kpi-row">
              <div className="rpt-kpi emph">
                <div className="rpt-kpi-label">Valuation</div>
                <div className="rpt-kpi-value">{formatCurrency(report.weightedValuation)}</div>
              </div>
              <div className="rpt-kpi">
                <div className="rpt-kpi-label">Low Bound (–9.6%)</div>
                <div className="rpt-kpi-value">{formatCurrency(report.lowBound)}</div>
              </div>
              <div className="rpt-kpi">
                <div className="rpt-kpi-label">High Bound (+9.6%)</div>
                <div className="rpt-kpi-value">{formatCurrency(report.highBound)}</div>
              </div>
            </div>
          </section>

          {/* Scorecard */}
          <section id="scorecard" className="rpt-page">
            <div className="rpt-kicker">Method</div>
            <h2 className="rpt-title">Scorecard Method</h2>
            <p className="rpt-lede">Compares the company against industry benchmarks.</p>
            <div className="rpt-waterfall">
              <div className="rpt-wf-row">
                <span className="k">Scorecard Valuation</span>
                <span className="v">{formatCurrency(report.methodResults?.scorecard?.valuation || 0)}</span>
              </div>
            </div>
          </section>

          {/* Checklist */}
          <section id="checklist" className="rpt-page">
            <div className="rpt-kicker">Method</div>
            <h2 className="rpt-title">Checklist Method</h2>
            <p className="rpt-lede">Assigns scores to five key dimensions.</p>
            <div className="rpt-waterfall">
              <div className="rpt-wf-row">
                <span className="k">Checklist Valuation</span>
                <span className="v">{formatCurrency(report.methodResults?.checklist?.valuation || 0)}</span>
              </div>
            </div>
          </section>

          {/* VC method */}
          <section id="vc-method" className="rpt-page">
            <div className="rpt-kicker">Method</div>
            <h2 className="rpt-title">VC Method</h2>
            <p className="rpt-lede">Discounted cash flow approach for venture capital valuation.</p>
            <div className="rpt-waterfall">
              <div className="rpt-wf-row">
                <span className="k">VC Method Valuation</span>
                <span className="v">{formatCurrency(report.methodResults?.vc?.valuation || 0)}</span>
              </div>
            </div>
          </section>

          {/* DCF LTG */}
          <section id="dcf-ltg" className="rpt-page">
            <div className="rpt-kicker">Method</div>
            <h2 className="rpt-title">DCF with Long-Term Growth</h2>
            <p className="rpt-lede">Projects free cash flows with perpetual growth assumption.</p>
            <div className="rpt-waterfall">
              <div className="rpt-wf-row">
                <span className="k">DCF-LTG Valuation</span>
                <span className="v">{formatCurrency(report.methodResults?.dcfLtg?.valuation || 0)}</span>
              </div>
            </div>
          </section>

          {/* DCF Multiple */}
          <section id="dcf-multiple" className="rpt-page">
            <div className="rpt-kicker">Method</div>
            <h2 className="rpt-title">DCF with Exit Multiple</h2>
            <p className="rpt-lede">Uses industry exit multiple for terminal value.</p>
            <div className="rpt-waterfall">
              <div className="rpt-wf-row">
                <span className="k">DCF-Multiple Valuation</span>
                <span className="v">{formatCurrency(report.methodResults?.dcfMultiple?.valuation || 0)}</span>
              </div>
            </div>
          </section>

          {/* Simple multiples */}
          <section id="multiples" className="rpt-page">
            <div className="rpt-kicker">Method</div>
            <h2 className="rpt-title">Simple Multiples Method</h2>
            <p className="rpt-lede">Direct comparable company valuation approach.</p>
            <div className="rpt-waterfall">
              <div className="rpt-wf-row">
                <span className="k">Multiples Valuation</span>
                <span className="v">{formatCurrency(report.methodResults?.multiples?.valuation || 0)}</span>
              </div>
            </div>
          </section>

          {/* Qualitative assessment */}
          <section id="qualitative" className="rpt-page">
            <div className="rpt-kicker gold">Detail</div>
            <h2 className="rpt-title">Qualitative Assessment</h2>
            <p className="rpt-lede">Team, business model, market, and legal evaluation.</p>
          </section>

          {/* Updated default values */}
          <section id="default-values" className="rpt-page">
            <div className="rpt-kicker gold">Detail</div>
            <h2 className="rpt-title">Updated Default Values</h2>
            <p className="rpt-lede">Parameters overridden from the platform's baseline.</p>
          </section>

          {/* P&L */}
          <section id="pnl" className="rpt-page">
            <div className="rpt-kicker gold">Detail</div>
            <h2 className="rpt-title">Financial Projections – P&amp;L</h2>
            <p className="rpt-lede">Full income statement projection by year.</p>
          </section>

          {/* Cash flow */}
          <section id="cash-flow" className="rpt-page">
            <div className="rpt-kicker gold">Detail</div>
            <h2 className="rpt-title">Financial Projections – Cash Flow</h2>
            <p className="rpt-lede">Cash inflows and outflows including FCFE.</p>
          </section>

          {/* Appendix: method weights */}
          <section id="method-weights" className="rpt-page">
            <div className="rpt-kicker gold">Appendix</div>
            <h2 className="rpt-title">Method Weights by Stage</h2>
            <p className="rpt-lede">How each valuation method is weighted by company stage.</p>
          </section>

          {/* Appendix: sources & disclaimer */}
          <section id="sources-disclaimer" className="rpt-page">
            <div className="rpt-kicker gold">Appendix</div>
            <h2 className="rpt-title">Data Sources &amp; Disclaimer</h2>
            <div className="rpt-callout">
              This valuation is illustrative and based on the data provided. It should not be
              considered financial advice. Consult with professional advisors before making
              investment decisions. All assumptions and data are subject to change.
            </div>
            <div className="rpt-page-footer">
              <span>Source Capital Valuation Engine</span>
              <span>Report generated on {new Date(report.generatedAt).toLocaleDateString()}</span>
            </div>
          </section>

          <div className="rpt-footer">
            Vantage Metrics Ltd Valuation Report · Generated {new Date(report.generatedAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  numeric,
}: {
  label: string;
  value: React.ReactNode;
  numeric?: boolean;
}) {
  return (
    <div className="rpt-field">
      <div className="rpt-field-label">{label}</div>
      <div className={`rpt-field-value${numeric ? ' num' : ''}`}>
        {value === null || value === undefined || value === '' ? '–' : value}
      </div>
    </div>
  );
}
