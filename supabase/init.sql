-- ============================================================================
-- 個人書法帖寫字對照字典 - Supabase 完整初始化 SQL 腳本
-- 在 Supabase Dashboard -> SQL Editor 中貼上並執行此腳本
-- ============================================================================

-- 1. 建立資料表：calligraphy_entries
create table if not exists public.calligraphy_entries (
    id uuid default gen_random_uuid() primary key,
    char varchar(4) not null,                    -- 中文字（例如：永）
    zhuyin varchar(10) not null,                 -- 完整注音（例如：ㄩㄥˇ）
    bopomofo_initial varchar(2) not null,        -- 注音首符號（例如：ㄩ，由前端上傳前自動提取）
    source_name varchar(50),                     -- 碑帖或作品名稱（選填，例如：蘭亭序）
    script_type varchar(20),                     -- 書體（選填，例如：行書、草書、楷書）
    image_url text not null,                     -- 圖片於 Storage 的公開存取網址
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. 建立索引加速檢索
create index if not exists idx_calligraphy_char on public.calligraphy_entries(char);
create index if not exists idx_calligraphy_zhuyin on public.calligraphy_entries(zhuyin);
create index if not exists idx_calligraphy_initial on public.calligraphy_entries(bopomofo_initial);

-- 3. 啟用資料表 Row Level Security (RLS)
alter table public.calligraphy_entries enable row level security;

-- 4. 資料表 RLS 存取政策 (Policies)
-- 公開所有人可讀取 (SELECT)
drop policy if exists "允許所有人公開讀取書法字帖" on public.calligraphy_entries;
create policy "允許所有人公開讀取書法字帖"
on public.calligraphy_entries
for select
to public
using (true);

-- 僅限通過驗證的使用者 (authenticated) 可新增、修改、刪除
drop policy if exists "僅限登入使用者新增書法字帖" on public.calligraphy_entries;
create policy "僅限登入使用者新增書法字帖"
on public.calligraphy_entries
for insert
to authenticated
with check (true);

drop policy if exists "僅限登入使用者更新書法字帖" on public.calligraphy_entries;
create policy "僅限登入使用者更新書法字帖"
on public.calligraphy_entries
for update
to authenticated
using (true)
with check (true);

drop policy if exists "僅限登入使用者刪除書法字帖" on public.calligraphy_entries;
create policy "僅限登入使用者刪除書法字帖"
on public.calligraphy_entries
for delete
to authenticated
using (true);

-- ============================================================================
-- 5. 建立 Storage Bucket: calligraphy-images (公開讀取)
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'calligraphy-images',
    'calligraphy-images',
    true,
    524288, -- 限制單檔最大 512KB (前端壓縮控制在 50KB 內)
    array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update set
    public = true,
    file_size_limit = 524288,
    allowed_mime_types = array['image/webp', 'image/jpeg', 'image/png'];

-- 6. Storage RLS 存取政策 (Policies on storage.objects)
drop policy if exists "公開讀取字帖圖片" on storage.objects;
create policy "公開讀取字帖圖片"
on storage.objects
for select
to public
using (bucket_id = 'calligraphy-images');

drop policy if exists "僅限登入使用者上傳字帖圖片" on storage.objects;
create policy "僅限登入使用者上傳字帖圖片"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'calligraphy-images');

drop policy if exists "僅限登入使用者更新字帖圖片" on storage.objects;
create policy "僅限登入使用者更新字帖圖片"
on storage.objects
for update
to authenticated
using (bucket_id = 'calligraphy-images');

drop policy if exists "僅限登入使用者刪除字帖圖片" on storage.objects;
create policy "僅限登入使用者刪除字帖圖片"
on storage.objects
for delete
to authenticated
using (bucket_id = 'calligraphy-images');
