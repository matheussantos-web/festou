alter table public.perfis
  add column if not exists biografia text,
  add column if not exists cover_url text,
  add column if not exists instagram_url text,
  add column if not exists facebook_url text,
  add column if not exists site_url text;

alter table public.perfis
  add constraint perfis_biografia_length_check
    check (biografia is null or char_length(biografia) <= 500),
  add constraint perfis_cover_url_length_check
    check (cover_url is null or char_length(cover_url) <= 2048),
  add constraint perfis_instagram_url_length_check
    check (instagram_url is null or char_length(instagram_url) <= 300),
  add constraint perfis_facebook_url_length_check
    check (facebook_url is null or char_length(facebook_url) <= 300),
  add constraint perfis_site_url_length_check
    check (site_url is null or char_length(site_url) <= 300);
