import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Generate a URL-safe slug from a company name.
 * Example: "TechCorp Inc." → "techcorp-inc"
 */
export function generateBaseSlug(companyName: string): string {
  return companyName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove special chars
    .replace(/\s+/g, '-') // spaces to hyphens
    .replace(/-+/g, '-') // multiple hyphens to single
    .replace(/^-+|-+$/g, ''); // trim leading/trailing hyphens
}

/**
 * Generate a unique slug by checking the database.
 * If the base slug is taken, appends -2, -3, etc. until finding an available one.
 * Max retries: 100
 */
export async function generateUniqueSlug(companyName: string): Promise<string> {
  const baseSlug = generateBaseSlug(companyName);

  // Check if base slug is available
  const { data: existing } = await supabaseAdmin
    .from('raise_listings')
    .select('slug', { count: 'exact' })
    .eq('slug', baseSlug)
    .maybeSingle();

  if (!existing) {
    return baseSlug;
  }

  // Base slug taken, try with numeric suffixes
  for (let i = 2; i <= 100; i++) {
    const candidate = `${baseSlug}-${i}`;
    const { data: candidateExists } = await supabaseAdmin
      .from('raise_listings')
      .select('slug', { count: 'exact' })
      .eq('slug', candidate)
      .maybeSingle();

    if (!candidateExists) {
      return candidate;
    }
  }

  // Fallback: should be extremely rare; append UUID
  const uuid = crypto.getRandomValues(new Uint8Array(4))
    .reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '');
  return `${baseSlug}-${uuid}`;
}
