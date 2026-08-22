import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { computeValuation } from '@/lib/valuation/compute';
import { buildDefaultParameters } from '@/lib/valuation/defaults';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Silently fail
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { weights, company: bodyCompany, financials: bodyFinancials, questionnaire: bodyQuestionnaire } = await request.json();

    // Use provided data or fetch from DB
    const company = bodyCompany || (await supabase
      .from('valuation_companies')
      .select('*')
      .eq('id', params.id)
      .eq('owner_id', user.id)
      .single()).data;

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Use provided financials or fetch from DB
    const financials = bodyFinancials || (await supabase
      .from('valuation_financials')
      .select('*')
      .eq('company_id', params.id)
      .order('year_offset')).data;

    // Use provided questionnaire or fetch from DB
    const questionnaire = bodyQuestionnaire || (await supabase
      .from('valuation_questionnaire_responses')
      .select('answers')
      .eq('company_id', params.id)
      .single()).data;

    // Fetch cap table
    const capTable = (await supabase
      .from('valuation_cap_table')
      .select('*')
      .eq('company_id', params.id)
      .order('order_index')).data;

    // Fetch funding rounds
    const fundingRounds = (await supabase
      .from('valuation_funding_rounds')
      .select('*')
      .eq('company_id', params.id)
      .order('closed_date')).data;

    // Fetch comparables
    const comparables = (await supabase
      .from('valuation_comparables')
      .select('*')
      .eq('company_id', params.id)).data;

    // Fetch transaction data
    const transaction = (await supabase
      .from('valuation_transaction')
      .select('*')
      .eq('company_id', params.id)
      .single()).data;

    // Fetch balance sheet
    const balanceSheet = (await supabase
      .from('valuation_balance_sheet')
      .select('*')
      .eq('company_id', params.id)
      .single()).data;

    // Build parameters with weights override
    const defaultParams = buildDefaultParameters(
      {
        name: company.name,
        country: company.country,
        industry: company.industry,
        stage: company.stage,
      },
      financials || [],
      balanceSheet
    );

    const params_with_weights = {
      ...defaultParams,
      method_weights: weights || defaultParams.method_weights,
    };

    // Compute valuation
    const report = await computeValuation(
      {
        name: company.name,
        country: company.country,
        industry: company.industry,
        stage: company.stage,
      },
      financials || [],
      questionnaire?.answers || null,
      params_with_weights
    );

    // Create snapshot
    const { data: snapshot, error: snapshotError } = await supabase
      .from('valuation_snapshots')
      .insert([
        {
          company_id: params.id,
          created_by: user.id,
          inputs: {
            company,
            financials,
            questionnaire: questionnaire?.answers,
            parameters: params_with_weights,
            capTable,
            fundingRounds,
            comparables,
            transaction,
            balanceSheet,
          },
          outputs: report,
          is_current: true,
        },
      ])
      .select()
      .single();

    if (snapshotError) {
      return NextResponse.json({ error: snapshotError.message }, { status: 500 });
    }

    // Mark previous snapshots as not current
    await supabase
      .from('valuation_snapshots')
      .update({ is_current: false })
      .eq('company_id', params.id)
      .neq('id', snapshot.id);

    return NextResponse.json({
      snapshot,
      redirect: `/companies/${params.id}/report/${snapshot.id}`,
    });
  } catch (error) {
    console.error('Snapshot error:', error);
    return NextResponse.json(
      { error: 'Failed to generate valuation' },
      { status: 500 }
    );
  }
}
