'use client';

import { useState, useEffect } from 'react';
import { C, FONT_SANS } from '@/lib/theme';

interface QuestionnaireStepProps {
  company: any;
  onUpdate?: (data: any) => void;
}

type TabKey = 'team' | 'business_model' | 'product_market' | 'legal_ip';

export default function QuestionnaireStep({ company, onUpdate }: QuestionnaireStepProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('team');
  const [answers, setAnswers] = useState({
    team_size: 0,
    team_has_cto: false,
    team_has_business_lead: false,
    team_prior_exits: false,
    business_model_type: '',
    recurring_revenue: false,
    tam_size: 0,
    market_growth_rate: 0,
    product_status: 'mvp' as 'idea' | 'mvp' | 'beta' | 'revenue_generating',
    has_customers: false,
    product_market_fit: false,
    has_patents: false,
    has_ip: false,
    ip_protection_stage: '' as string,
    legal_risks: false,
  });

  useEffect(() => {
    if (onUpdate) {
      onUpdate({ answers });
    }
  }, [answers]);

  const handleChange = (key: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'team', label: 'Team' },
    { key: 'business_model', label: 'Business Model' },
    { key: 'product_market', label: 'Product & Market' },
    { key: 'legal_ip', label: 'IP & Legal' },
  ];

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
    transition: 'all 0.2s',
  });

  const fieldStyle: React.CSSProperties = {
    marginBottom: '1.5rem',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.95rem',
    fontWeight: 500,
    color: C.text,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '0.375rem',
    border: `1px solid ${C.border}`,
    backgroundColor: C.bg,
    color: C.text,
    fontSize: '0.9rem',
    fontFamily: FONT_SANS,
  };

  const checkboxStyle: React.CSSProperties = {
    marginRight: '0.5rem',
    cursor: 'pointer',
    width: '18px',
    height: '18px',
  };

  const checkboxLabelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '0.95rem',
  };

  const renderTeamTab = () => (
    <div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Team Size</label>
        <input
          type="number"
          min="0"
          value={answers.team_size}
          onChange={(e) => handleChange('team_size', parseInt(e.target.value) || 0)}
          placeholder="Number of team members"
          style={inputStyle}
        />
      </div>

      <div style={fieldStyle}>
        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={answers.team_has_cto}
            onChange={(e) => handleChange('team_has_cto', e.target.checked)}
            style={checkboxStyle}
          />
          Has CTO or technical cofounder
        </label>
      </div>

      <div style={fieldStyle}>
        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={answers.team_has_business_lead}
            onChange={(e) => handleChange('team_has_business_lead', e.target.checked)}
            style={checkboxStyle}
          />
          Has business/commercial lead
        </label>
      </div>

      <div style={fieldStyle}>
        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={answers.team_prior_exits}
            onChange={(e) => handleChange('team_prior_exits', e.target.checked)}
            style={checkboxStyle}
          />
          Team has prior successful exits
        </label>
      </div>
    </div>
  );

  const renderBusinessModelTab = () => (
    <div>
      <div style={fieldStyle}>
        <label style={labelStyle}>Business Model Type</label>
        <select
          value={answers.business_model_type}
          onChange={(e) => handleChange('business_model_type', e.target.value)}
          style={inputStyle}
        >
          <option value="">Select a model</option>
          <option value="saas">SaaS (Subscription)</option>
          <option value="marketplace">Marketplace</option>
          <option value="licensing">Licensing</option>
          <option value="one_time">One-time Sales</option>
          <option value="freemium">Freemium</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div style={fieldStyle}>
        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={answers.recurring_revenue}
            onChange={(e) => handleChange('recurring_revenue', e.target.checked)}
            style={checkboxStyle}
          />
          Has recurring revenue
        </label>
      </div>
    </div>
  );

  const renderProductMarketTab = () => (
    <div>
      <div style={fieldStyle}>
        <label style={labelStyle}>TAM Size (Annual)</label>
        <input
          type="number"
          min="0"
          value={answers.tam_size}
          onChange={(e) => handleChange('tam_size', parseInt(e.target.value) || 0)}
          placeholder="Total addressable market in USD"
          style={inputStyle}
        />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Market Growth Rate (Annual)</label>
        <input
          type="number"
          min="0"
          max="1"
          step="0.01"
          value={answers.market_growth_rate}
          onChange={(e) => handleChange('market_growth_rate', parseFloat(e.target.value) || 0)}
          placeholder="e.g., 0.15 for 15%"
          style={inputStyle}
        />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Product Status</label>
        <select
          value={answers.product_status}
          onChange={(e) => handleChange('product_status', e.target.value)}
          style={inputStyle}
        >
          <option value="idea">Idea</option>
          <option value="mvp">MVP</option>
          <option value="beta">Beta</option>
          <option value="revenue_generating">Revenue Generating</option>
        </select>
      </div>

      <div style={fieldStyle}>
        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={answers.has_customers}
            onChange={(e) => handleChange('has_customers', e.target.checked)}
            style={checkboxStyle}
          />
          Has paying customers
        </label>
      </div>

      <div style={fieldStyle}>
        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={answers.product_market_fit}
            onChange={(e) => handleChange('product_market_fit', e.target.checked)}
            style={checkboxStyle}
          />
          Achieved product-market fit
        </label>
      </div>
    </div>
  );

  const renderLegalIPTab = () => (
    <div>
      <div style={fieldStyle}>
        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={answers.has_patents}
            onChange={(e) => handleChange('has_patents', e.target.checked)}
            style={checkboxStyle}
          />
          Has patents or pending patent applications
        </label>
      </div>

      <div style={fieldStyle}>
        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={answers.has_ip}
            onChange={(e) => handleChange('has_ip', e.target.checked)}
            style={checkboxStyle}
          />
          Has proprietary IP/technology
        </label>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>IP Protection Stage</label>
        <select
          value={answers.ip_protection_stage}
          onChange={(e) => handleChange('ip_protection_stage', e.target.value)}
          style={inputStyle}
        >
          <option value="">Select stage</option>
          <option value="none">No protection</option>
          <option value="pending">Pending</option>
          <option value="granted">Granted/Registered</option>
          <option value="enforced">Actively enforced</option>
        </select>
      </div>

      <div style={fieldStyle}>
        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={answers.legal_risks}
            onChange={(e) => handleChange('legal_risks', e.target.checked)}
            style={checkboxStyle}
          />
          Has known legal risks or disputes
        </label>
      </div>
    </div>
  );

  return (
    <div style={containerStyle}>
      <div style={tabsStyle}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={tabButtonStyle(tab.key === activeTab)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'team' && renderTeamTab()}
        {activeTab === 'business_model' && renderBusinessModelTab()}
        {activeTab === 'product_market' && renderProductMarketTab()}
        {activeTab === 'legal_ip' && renderLegalIPTab()}
      </div>
    </div>
  );
}
