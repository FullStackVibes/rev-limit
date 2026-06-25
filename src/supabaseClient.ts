import { createClient } from "@supabase/supabase-js";

// Retrieve config from environment variables or localStorage (which allows live UI updates)
export const getSupabaseConfig = () => {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  const localUrl = localStorage.getItem("rev_supabase_url");
  const localKey = localStorage.getItem("rev_supabase_key");

  // Default to the credentials you provided in the chat
  const defaultUrl = "https://eifybxjhhacqhfxbsyzb.supabase.co";
  const defaultKey = "sb_publishable_46a2XBB2C2W3IPOlyUs0eQ_PTFg7DEJ";

  return {
    url: localUrl || envUrl || defaultUrl,
    key: localKey || envKey || defaultKey,
    isCustom: !!(localUrl || envUrl),
  };
};

export const initSupabaseClient = (url: string, key: string) => {
  if (!url || !key) return null;
  try {
    return createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    });
  } catch (error) {
    console.error("Failed to initialize Supabase client", error);
    return null;
  }
};

const config = getSupabaseConfig();
export const supabase = initSupabaseClient(config.url, config.key);
