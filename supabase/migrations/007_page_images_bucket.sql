-- ============================================================
-- 007_page_images_bucket.sql
-- Storage bucket for Page Builder block images
-- (hero cover photos, text+image block images)
-- Run this in the Supabase SQL editor.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'page-images',
  'page-images',
  true,
  524288, -- 512 KB hard limit (compression happens client-side before upload)
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Anyone can view page images (needed for public live page)
create policy "Anyone can view page images"
  on storage.objects for select
  using (bucket_id = 'page-images');

-- Only authenticated users can upload
create policy "Authenticated users can upload page images"
  on storage.objects for insert
  with check (bucket_id = 'page-images' and auth.uid() is not null);

-- Only authenticated users can update (re-upload / overwrite)
create policy "Authenticated users can update page images"
  on storage.objects for update
  using (bucket_id = 'page-images' and auth.uid() is not null);

-- Only authenticated users can delete
create policy "Authenticated users can delete page images"
  on storage.objects for delete
  using (bucket_id = 'page-images' and auth.uid() is not null);
