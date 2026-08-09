insert into public.media_items (type, title, author_or_host, topic, source_url, external_link, description)
select
  'book',
  'Vision Retreat Guidebook: Establishing a Yearly Vision for Your Marriage & Family',
  'XO Marriage',
  'family',
  'https://store.xomarriage.com/collections/xo-1/products/vision-retreat-guidebook-establishing-a-yearly-vision-for-your-marriage-family',
  'https://store.xomarriage.com/collections/xo-1/products/vision-retreat-guidebook-establishing-a-yearly-vision-for-your-marriage-family',
  'A guidebook to help couples establish an annual vision for their marriage and family.'
where not exists (select 1 from public.media_items where title like 'Vision Retreat%');
