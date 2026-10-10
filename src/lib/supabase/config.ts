export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Cloud sync is on only when both public keys are present at build time. */
export const CLOUD_ENABLED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
