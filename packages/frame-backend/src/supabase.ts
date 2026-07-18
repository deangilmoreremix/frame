import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables");
  }
  console.warn("[supabase] SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not set; client is a no-op in test mode");
}

export const BUCKET = process.env.SUPABASE_BUCKET ?? "frame-media";

// Server-side client using the service role key (bypasses RLS). Never expose to the browser.
// Tables use a `frame_` prefix in the `public` schema for isolation on a shared project;
// RLS is enabled with service-role policies (see supabase/migrations).
export const supabase: SupabaseClient<any, any, any> = createClient(
  url ?? "http://localhost:54321",
  serviceRoleKey ?? "service-role-key",
  { auth: { persistSession: false } },
);

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
