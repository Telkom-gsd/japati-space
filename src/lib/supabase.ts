import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Create a dummy client for build time when env vars are not set
let supabase: SupabaseClient;
let isSupabaseConfigured = false;

// Custom fetch with retry logic
const fetchWithRetry = async (
  url: RequestInfo | URL,
  options?: RequestInit,
  retries = 2
): Promise<Response> => {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      if (i === retries) {
        console.warn(`Supabase fetch failed after ${retries + 1} attempts:`, err instanceof Error ? err.message : err);
        throw err;
      }
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 500));
    }
  }
  throw new Error("Fetch failed");
};

if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith("http")) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
    global: {
      fetch: fetchWithRetry,
    },
  });
  isSupabaseConfigured = true;
} else {
  // Provide a mock client for build time
  supabase = createClient("https://placeholder.supabase.co", "placeholder-key");
  if (typeof window !== 'undefined') {
    console.warn("Supabase not configured - check .env.local");
  }
}

export { supabase, isSupabaseConfigured };
