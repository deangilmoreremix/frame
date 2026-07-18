-- Storage isolation for the shared Supabase project.
-- The backend uses the service role key (bypasses storage policies), so our objects are
-- already isolated by the `frame/` object prefix used in code (assets/<projectId>/...).
-- This migration just ensures the private `frame-media` bucket exists. Fine-grained
-- storage policies (scoped to the frame/ prefix for authenticated users) should be added
-- in the Supabase dashboard once Supabase Auth is enabled.

insert into storage.buckets (id, name, public)
values ('frame-media', 'frame-media', false)
on conflict (id) do nothing;
