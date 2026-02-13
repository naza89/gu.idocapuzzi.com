import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client for API Routes.
 * 
 * Uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS when needed.
 * NEVER expose this client to the frontend.
 * 
 * For frontend operations, use the CDN-loaded supabase client
 * in public/js/supabase-config.js (via window.supabaseClient).
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Creates a Supabase admin client with the service role key.
 * Use this in API Routes for server-side operations.
 */
export function createAdminClient() {
    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

/**
 * Creates a Supabase client with the anon key.
 * Use this when you want RLS policies to apply.
 */
export function createAnonClient() {
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(supabaseUrl, supabaseAnonKey);
}
