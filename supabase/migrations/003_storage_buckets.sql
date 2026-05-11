-- ============================================================
-- 003_storage_buckets.sql
-- Storage buckets for file uploads
-- ============================================================

-- Create public buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('logos',       'logos',       true, 204800,  array['image/jpeg','image/png','image/webp','image/gif']),
  ('menu-images', 'menu-images', true, 307200,  array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;

-- Storage RLS policies for logos bucket
create policy "Anyone can view logos"
  on storage.objects for select
  using (bucket_id = 'logos');

create policy "Authenticated users can upload logos"
  on storage.objects for insert
  with check (bucket_id = 'logos' and auth.uid() is not null);

create policy "Authenticated users can update logos"
  on storage.objects for update
  using (bucket_id = 'logos' and auth.uid() is not null);

create policy "Authenticated users can delete logos"
  on storage.objects for delete
  using (bucket_id = 'logos' and auth.uid() is not null);

-- Storage RLS policies for menu-images bucket
create policy "Anyone can view menu images"
  on storage.objects for select
  using (bucket_id = 'menu-images');

create policy "Authenticated users can upload menu images"
  on storage.objects for insert
  with check (bucket_id = 'menu-images' and auth.uid() is not null);

create policy "Authenticated users can update menu images"
  on storage.objects for update
  using (bucket_id = 'menu-images' and auth.uid() is not null);

create policy "Authenticated users can delete menu images"
  on storage.objects for delete
  using (bucket_id = 'menu-images' and auth.uid() is not null);
