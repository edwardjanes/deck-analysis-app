'use client';

import { useState, useEffect } from 'react';
import { C, FONT_SANS, FONT_MONO } from '@/lib/theme';

interface FinancialsStepProps {
  company: any;
  onUpdate?: (data: any) => void;
}

interface FinancialRow {
  yearOffset: number;
  revenue: number;
  cogs: number;
  salaries: number;
  otherOpex: number;
  totalDa: number;
  interest: number;
  taxes: number;
  receivables: number;
  inventory: number;
  payables: number;
  capex: number;
  debt: number;
  fundraisingPlan: number;
}

export default function FinancialsStep({ company, onUpdate }: FinancialsStepProps) {
  const [financials, setFinancials] = useState<FinancialRow[]>(
    Array.from({ length: 7 }, (_, i) => ({
      yearOffset: i - 1,
      revenue: 0,
      cogs: 0,
      salaries: 0,
      otherOpex: 0,
      totalDa: 0,
      interest: 0,
      taxes: 0,
      receivables: 0,
      inventory: 0,
      payables: 0,
      capex: 0,
      debt: 0,
      fundraisingPlan: 0,
    }))
  );

  const [activeTab, setActiveTab] = useState<'income' | 'balance'>('income');

  useEffect(() => {
    if (onUpdate) {
      onUpdate(financials);
    }
  }, [financials]);

  const handleCellChange = (yearOffset: number, field: keyof FinancialRow, value: number) => {
    setFinancials((prev) =>
      prev.map((row) =>
        row.yearOffset === yearOffset ? { ...row, [field]: value } : row
      )
    );
  };

  const getYearLabel = (offset: number): string => {
    if (offset === -1) return 'Previous';
    if (offset === 0) return 'Current';
    return `Year +${offset}`;
  };

  const containerStyle: React.CSSProperties = {
    fontFamily: FONT_SANS,
  };

  const tabsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '1rem',
    borderBottom: `1px solid ${C.border}`,
    marginBottom: '2rem',
  };

  const tabButtonStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '0.75rem 1.5rem',
    border: 'none',
    backgroundColor: 'transparent',
    color: isActive ? C.accent : C.textMuted,
    borderBottom: isActive ? `2px solid ${C.accent}` : 'none',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: isActive ? 600 : 500,
  });

  const scrollContainerStyle: React.CSSProperties = {
    overflowX: 'auto',
    marginBottom: '2rem',
  };

  const tableStyle: React.CSSProperties = {
    borderCollapse: 'collapse',
    fontSize: '0.85rem',
    width: '100%',
    minWidth: '800px',
  };

  const thStyle: React.CSSProperties = {
    backgroundColor: C.border,
    color: C.text,
    padding: '0.75rem',
    textAlign: 'left',
    borderBottom: `1px solid ${C.border}`,
    fontWeight: 600,
  };

  const tdStyle: React.CSSProperties = {
    padding: '0.5rem',
    borderBottom: `1px solid ${C.border}`,
  };

  const labelCellStyle: React.CSSProperties = {
    ...tdStyle,
    backgroundColor: C.panel,
    fontWeight: 500,
    minWidth: '150px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem',
    border: `1px solid ${C.border}`,
    borderRadius: '0.25rem',
    backgroundColor: C.bg,
    color: C.text,
    fontSize: '0.85rem',
    fontFamily: FONT_MONO,
  };

  const renderIncomeTab = () => (
    <div style={scrollContainerStyle}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Income Statement</th>
            {financials.map((row) => (
              <th key={row.yearOffset} style={thStyle}>
                {getYearLabel(row.yearOffset)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            { key: 'revenue', label: 'Revenue' },
            { key: 'cogs', label: 'COGS' },
            { key: 'salaries', label: 'Salaries' },
            { key: 'otherOpex', label: 'Other OpEx' },
            { key: 'totalDa', label: 'D&A' },
            { key: 'interest', label: 'Interest' },
            { key: 'taxes', label: 'Taxes' },
          ].map((field) => (
            <tr key={field.key}>
              <td style={labelCellStyle}>{field.label}</td>
              {financials.map((row) => (
                <td key={row.yearOffset} style={tdStyle}>
                  <input
                    type="number"
                    value={row[field.key as keyof FinancialRow] || 0}
                    onChange={(e) =>
                      handleCellChange(row.yearOffset, field.key as keyof FinancialRow, parseInt(e.target.value) || 0)
                    }
                    placeholder="0"
                    style={inputStyle}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderBalanceTab = () => (
    <div style={scrollContainerStyle}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Cash Flow & Assets</th>
            {financials.map((row) => (
              <th key={row.yearOffset} style={thStyle}>
                {getYearLabel(row.yearOffset)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            { key: 'receivables', label: 'Receivables' },
            { key: 'inventory', label: 'Inventory' },
            { key: 'payables', label: 'Payables' },
            { key: 'capex', label: 'CapEx' },
            { key: 'debt', label: 'Debt' },
            { key: 'fundraisingPlan', label: 'Fundraising Plan' },
          ].map((field) => (
            <tr key={field.key}>
              <td style={labelCellStyle}>{field.label}</td>
              {financials.map((row) => (
                <td key={row.yearOffset} style={tdStyle}>
                  <input
                    type="number"
                    value={row[field.key as keyof FinancialRow] || 0}
                    onChange={(e) =>
                      handleCellChange(row.yearOffset, field.key as keyof FinancialRow, parseInt(e.target.value) || 0)
                    }
                    placeholder="0"
                    style={inputStyle}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={containerStyle}>
      <div style={tabsStyle}>
        <button
          onClick={() => setActiveTab('income')}
          style={tabButtonStyle(activeTab === 'income')}
        >
          Income Statement
        </button>
        <button
          onClick={() => setActiveTab('balance')}
          style={tabButtonStyle(activeTab === 'balance')}
        >
          Balance Sheet & Cash Flow
        </button>
      </div>

      {activeTab === 'income' && renderIncomeTab()}
      {activeTab === 'balance' && renderBalanceTab()}

      <div style={{ color: C.textMuted, fontSize: '0.85rem', marginTop: '1rem' }}>
        <p>• Year -1 = Previous year (for reference)</p>
        <p>• Year 0 = Current/recent year</p>
        <p>• Year +1 to +5 = Projected years</p>
        <p>• All values in USD</p>
      </div>
    </div>
  );
}
