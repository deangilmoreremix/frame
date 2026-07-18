import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? "https://bzxohkrxcwodllketcpz.supabase.co";
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6eG9oa3J4Y3dvZGxsa2V0Y3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzg2NjM4NSwiZXhwIjoyMDg5NDQyMzg1fQ.S5HmTONnamT169WYF0riSphXij-Mwtk7D3pphfSrCFE";

export const BUCKET = process.env.SUPABASE_BUCKET ?? "frame-media";

// Server-side client using the service role key (bypasses RLS). Never expose to the browser.
export const supabase: SupabaseClient = createClient(url, serviceRoleKey, {
  auth: { persistSession: false },
});

export async function ensureBucket(): Promise<void> {
  try {
    const { data, error } = await supabase.storage.getBucket(BUCKET);
    if (error && error.message.includes("not found")) {
      // Free-tier plans cap file size limits well below 2GB; omit it to avoid 413 on creation.
      const created = await supabase.storage.createBucket(BUCKET, { public: false });
      if (created.error) throw created.error;
    } else if (error) {
      throw error;
    }
    void data;
  } catch (err) {
    console.error("[supabase] bucket setup failed (continuing):", err);
  }
}
