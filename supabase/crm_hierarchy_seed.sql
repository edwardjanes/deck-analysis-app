-- ============================================================
-- DEMO SEED DATA — Investor Firms & Contacts
-- Run in Supabase SQL editor after crm_hierarchy.sql
-- ============================================================

-- ---- FIRMS ----

INSERT INTO investor_firms (id, name, type, website, description, stage_focus, geography, sector_focus, check_size_min, check_size_max, thesis_notes, verified, source)
VALUES

  ('f1000000-0000-0000-0000-000000000001',
   'Balderton Capital', 'vc', 'https://balderton.com',
   'One of Europe''s leading early-stage VC firms, backing European founders building global technology companies.',
   ARRAY['Seed', 'Series A', 'Series B'],
   ARRAY['UK', 'Europe'],
   ARRAY['B2B SaaS', 'FinTech', 'HealthTech', 'AI / ML'],
   500000, 15000000,
   'Back exceptional European founders with global ambition. Focus on product-led businesses with strong unit economics.',
   true, 'manual'),

  ('f1000000-0000-0000-0000-000000000002',
   'Kindred Capital', 'vc', 'https://kindredcapital.vc',
   'Seed-stage VC investing in UK and European founders. Known for founder-friendly terms and co-ownership model.',
   ARRAY['Pre-seed', 'Seed'],
   ARRAY['UK', 'Europe'],
   ARRAY['B2B SaaS', 'Consumer', 'Marketplace', 'AI / ML'],
   250000, 2000000,
   'Invests in the idea stage through to Series A. Strong preference for UK-based teams solving global problems.',
   true, 'manual'),

  ('f1000000-0000-0000-0000-000000000003',
   'LocalGlobe', 'vc', 'https://localglobe.vc',
   'Seed-focused fund backing the most ambitious European founders from day one.',
   ARRAY['Pre-seed', 'Seed'],
   ARRAY['UK', 'Europe'],
   ARRAY['Deep Tech', 'Climate Tech', 'B2B SaaS', 'FinTech'],
   100000, 3000000,
   'First cheque investor in category-defining companies. Particularly interested in climate and deep tech.',
   true, 'manual'),

  ('f1000000-0000-0000-0000-000000000004',
   'Octopus Ventures', 'vc', 'https://octopusventures.com',
   'One of Europe''s most active venture investors across health, money and deep tech.',
   ARRAY['Seed', 'Series A', 'Series B'],
   ARRAY['UK', 'Europe'],
   ARRAY['HealthTech', 'FinTech', 'Deep Tech', 'B2B SaaS'],
   1000000, 20000000,
   'Backs bold founders solving big problems in health, money and deep tech. Long-term patient capital.',
   true, 'manual'),

  ('f1000000-0000-0000-0000-000000000005',
   'Pemberton Family Office', 'family_office', NULL,
   'Private family office investing in early-stage UK tech companies. Focus on founder-led businesses with defensible IP.',
   ARRAY['Pre-seed', 'Seed'],
   ARRAY['UK'],
   ARRAY['FinTech', 'PropTech', 'B2B SaaS'],
   100000, 1000000,
   'Patient capital with a 10+ year horizon. Prefer co-investing alongside established VC leads.',
   false, 'manual'),

  ('f1000000-0000-0000-0000-000000000006',
   'Entrepreneur First', 'accelerator', 'https://joinef.com',
   'Global talent investor that brings together exceptional individuals to form companies from scratch.',
   ARRAY['Pre-seed'],
   ARRAY['UK', 'Europe', 'Asia Pacific', 'Global'],
   ARRAY['AI / ML', 'Deep Tech', 'B2B SaaS', 'Climate Tech'],
   80000, 250000,
   'Invests in individuals before they have a co-founder or idea. Cohort-based programme in London, Singapore, Paris.',
   true, 'manual'),

  ('f1000000-0000-0000-0000-000000000007',
   'Seedcamp', 'accelerator', 'https://seedcamp.com',
   'Europe''s leading micro-seed fund and community for world-class founders.',
   ARRAY['Pre-seed', 'Seed'],
   ARRAY['Europe', 'Global'],
   ARRAY['B2B SaaS', 'FinTech', 'AI / ML', 'Marketplace'],
   100000, 500000,
   'Backs the best founders in Europe from day one. Strong network effects through the Seedcamp community.',
   true, 'manual'),

  ('f1000000-0000-0000-0000-000000000008',
   'Playfair Capital', 'vc', 'https://playfaircapital.com',
   'Pre-seed and seed VC investing in transformative technology companies founded in the UK.',
   ARRAY['Pre-seed', 'Seed'],
   ARRAY['UK'],
   ARRAY['AI / ML', 'B2B SaaS', 'FinTech', 'HealthTech', 'Deep Tech'],
   150000, 1500000,
   'Focus on technical founders building AI-native companies. Early conviction investors.',
   true, 'manual')

ON CONFLICT (id) DO NOTHING;


-- ---- CONTACTS ----

INSERT INTO investor_contacts (id, investor_firm_id, first_name, last_name, role, email, linkedin_url, location, bio, verified, source)
VALUES

  -- Balderton Capital
  ('c1000000-0000-0000-0000-000000000001',
   'f1000000-0000-0000-0000-000000000001',
   'Suranga', 'Chandratillake', 'General Partner', NULL,
   'https://linkedin.com/in/suranga', 'London, UK',
   'General Partner at Balderton. Previously founder of Blinkx. Focuses on AI, data and enterprise software.',
   true, 'manual'),

  ('c1000000-0000-0000-0000-000000000002',
   'f1000000-0000-0000-0000-000000000001',
   'James', 'Wise', 'Partner', NULL,
   'https://linkedin.com/in/jameswise', 'London, UK',
   'Partner at Balderton since 2012. Investor in Revolut, Peakon, Lyst. Focus on FinTech and future of work.',
   true, 'manual'),

  -- Kindred Capital
  ('c1000000-0000-0000-0000-000000000003',
   'f1000000-0000-0000-0000-000000000002',
   'Leila', 'Zegna', 'Partner', NULL,
   'https://linkedin.com/in/leilazegna', 'London, UK',
   'Partner at Kindred Capital. Focus on consumer and marketplace businesses. Former founder.',
   true, 'manual'),

  ('c1000000-0000-0000-0000-000000000004',
   'f1000000-0000-0000-0000-000000000002',
   'Russell', 'Buckley', 'Partner', NULL,
   'https://linkedin.com/in/russellbuckley', 'London, UK',
   'Co-founder and Partner at Kindred Capital. Previously MD at AdMob. Angel investor and operator.',
   true, 'manual'),

  -- LocalGlobe
  ('c1000000-0000-0000-0000-000000000005',
   'f1000000-0000-0000-0000-000000000003',
   'Saul', 'Klein', 'Partner', NULL,
   'https://linkedin.com/in/saul', 'London, UK',
   'Co-founder of LocalGlobe. Previously at Index Ventures. One of the most influential seed investors in Europe.',
   true, 'manual'),

  ('c1000000-0000-0000-0000-000000000006',
   'f1000000-0000-0000-0000-000000000003',
   'Robin', 'Klein', 'Partner', NULL,
   'https://linkedin.com/in/robinklein', 'London, UK',
   'Co-founder of LocalGlobe. Angel investor in TransferWise, Citymapper, and others.',
   true, 'manual'),

  -- Octopus Ventures
  ('c1000000-0000-0000-0000-000000000007',
   'f1000000-0000-0000-0000-000000000004',
   'Zoe', 'Richardson', 'Partner — HealthTech', NULL,
   'https://linkedin.com/in/zoerichardson', 'London, UK',
   'Partner at Octopus Ventures leading HealthTech investments. Former NHS Innovation Accelerator fellow.',
   true, 'manual'),

  ('c1000000-0000-0000-0000-000000000008',
   'f1000000-0000-0000-0000-000000000004',
   'Matt', 'Turck', 'Partner — Deep Tech', NULL,
   'https://linkedin.com/in/mattturck', 'London, UK',
   'Partner focusing on deep tech and data infrastructure. Previously FirstMark Capital.',
   true, 'manual'),

  -- Pemberton Family Office
  ('c1000000-0000-0000-0000-000000000009',
   'f1000000-0000-0000-0000-000000000005',
   'William', 'Pemberton', 'Principal', NULL,
   'https://linkedin.com/in/williampemberton', 'London, UK',
   'Principal at Pemberton Family Office. Former investment banker. Invests personally alongside the family office.',
   false, 'manual'),

  -- EF
  ('c1000000-0000-0000-0000-000000000010',
   'f1000000-0000-0000-0000-000000000006',
   'Matt', 'Clifford', 'CEO & Co-founder', NULL,
   'https://linkedin.com/in/mattclifford', 'London, UK',
   'CEO and Co-founder of Entrepreneur First. Previously McKinsey. Builds companies from individual talent.',
   true, 'manual'),

  -- Seedcamp
  ('c1000000-0000-0000-0000-000000000011',
   'f1000000-0000-0000-0000-000000000007',
   'Reshma', 'Sohoni', 'CEO & Partner', NULL,
   'https://linkedin.com/in/reshmasohoni', 'London, UK',
   'Co-founder and CEO of Seedcamp. One of the most respected seed investors in Europe.',
   true, 'manual'),

  -- Playfair Capital
  ('c1000000-0000-0000-0000-000000000012',
   'f1000000-0000-0000-0000-000000000008',
   'Federico', 'Pirzio-Biroli', 'Partner', NULL,
   'https://linkedin.com/in/federicop', 'London, UK',
   'Partner at Playfair Capital. Focus on AI-native companies and technical founders.',
   true, 'manual'),

  -- Solo angel (no firm)
  ('c1000000-0000-0000-0000-000000000013',
   NULL,
   'Eileen', 'Burbidge', 'Partner / Angel', NULL,
   'https://linkedin.com/in/eileenburbidge', 'London, UK',
   'Partner at Passion Capital and prolific angel investor. UK Treasury Fintech Envoy. Board member at multiple UK scale-ups.',
   true, 'manual')

ON CONFLICT (id) DO NOTHING;
