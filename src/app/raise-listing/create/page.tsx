import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * /raise-listing/create — either creates a new draft or redirects to existing one
 */
export default async function CreateListingPage() {
  // Get current user
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/raise-listing/create');
  }

  // Check if user already has a non-archived draft
  const { data: existingDraft } = await supabaseAdmin
    .from('raise_listings')
    .select('id, status')
    .eq('user_id', user.id)
    .neq('status', 'archived')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingDraft) {
    // Redirect to existing draft/submission
    redirect(`/raise-listing/create/${existingDraft.id}`);
  }

  // Create new draft
  const { data: newListing, error } = await supabaseAdmin
    .from('raise_listings')
    .insert({
      user_id: user.id,
      company_name: 'Untitled',
      status: 'draft',
      currency: 'GBP',
      sector: [],
    })
    .select('id')
    .single();

  if (error) {
    console.error('[create] Insert error:', error);
    // Fall back to a generic error page — in real app, use dedicated error component
    throw new Error('Failed to create listing draft');
  }

  redirect(`/raise-listing/create/${newListing.id}`);
}
