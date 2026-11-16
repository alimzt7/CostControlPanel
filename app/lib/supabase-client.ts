import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type MenuItem = {
  id: string;
  slug: string;
  name_fa: string;
  name_en: string | null;
  description: string | null;
  price: number;
  category: string | null;
  image_url: string | null;
  tag: string | null;
  preparation_time: string | null;
  ingredients: string[] | null;
  note: string | null;
  is_available: boolean;
  is_featured: boolean;
  created_at: string | null;
  updated_at: string | null;
  is_archived: boolean;
};

let client: SupabaseClient | null = null;

export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) return null;
  if (!client) client = createClient(url, publishableKey);
  return client;
}
