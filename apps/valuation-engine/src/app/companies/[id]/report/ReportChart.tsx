'use client';

import { formatCurrency } from '@/lib/valuation/format';

const CAT_COLORS = [
  'var(--cat-1)',
  'var(--cat-2)',
  'var(--cat-3)',
  'var(--cat-4)',
  'var(--cat-5)',
  'var(--cat-6)',
];

export interface ChartSeries {
  name: string;
  values: (number | null)[];
  color?: string;
}

/**
 * Grouped/single-series bar chart, SVG, no external deps.
 * `categories` are the x-axis labels (one per bar group).
 * `series` is one or more value arrays aligned to `categories`.
 */
export function ReportChart({
  categories,
  series,
  height = 200,
  valueFormat = formatCurrency,
}: {
  categories: string[];
  series: ChartSeries[];
  height?: number;
  valueFormat?: (v: number) => string;
}) {
  if (!categories.length || !series.length) {
    return <p className="rpt-muted-dash">No data available</p>;
  }

  const width = 700;
  const padL = 8;
  const padR = 8;
  const padT = 12;
  const padB = 26;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const allValues = series.flatMap((s) => s.values.filter((v): v is number => v != null));
  const maxVal = Math.max(1, ...allValues);

  const groupW = plotW / categories.length;
  const barGap = 4;
  const barW = Math.max(4, (groupW - barGap * (series.length + 1)) / series.length);

  return (
    <div className="rpt-chart-wrap">
      {series.length > 1 && (
        <div className="rpt-chart-legend">
          {series.map((s, i) => (
            <span key={s.name}>
              <span className="dot" style={{ background: s.color || CAT_COLORS[i % CAT_COLORS.length] }} />
              {s.name}
            </span>
          ))}
        </div>
      )}
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="chart">
        <line x1={padL} y1={padT + plotH} x2={width - padR} y2={padT + plotH} stroke="var(--border)" strokeWidth={1} />
        {categories.map((cat, ci) => {
          const groupX = padL + ci * groupW;
          return (
            <g key={cat}>
              {series.map((s, si) => {
                const v = s.values[ci];
                if (v == null) return null;
                const barH = (v / maxVal) * (plotH - 8);
                const x = groupX + barGap + si * (barW + barGap);
                const y = padT + plotH - barH;
                const color = s.color || CAT_COLORS[si % CAT_COLORS.length];
                return (
                  <g key={s.name}>
                    <rect x={x} y={y} width={barW} height={Math.max(barH, 1)} rx={2} fill={color} />
                  </g>
                );
              })}
              <text
                x={groupX + groupW / 2}
                y={height - 8}
                fontSize={10.5}
                fill="var(--ink-muted)"
                textAnchor="middle"
                fontFamily="'Source Sans 3', sans-serif"
              >
                {cat}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
