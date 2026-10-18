-- ==========================================================
-- قاعدة بيانات متجر جزارة «حلاوة العنتبلي» (Halawa El3antabli)
-- تشمل الإعدادات، التصنيفات، وكافة الـ 40 صنفاً من قائمة الأسعار الرسمية
-- ==========================================================

-- 1. تفعيل ملحق توليد المعرفات
create extension if not exists "uuid-ossp";

-- 2. جدول الإعدادات العامة للمتجر (Store Settings)
create table if not exists public.store_settings (
    id text primary key default 'main_config',
    store_name text not null default 'حلاوة العنتبلي',
    slogan text default 'عارف يعني ايه لحمة ؟!',
    whatsapp_number text not null default '201000000000', -- رقم الواتساب بدون أصفار إضافية وبدون علامة +
    is_store_open boolean default true,
    delivery_fee numeric(10, 2) default 0,
    min_order_amount numeric(10, 2) default 0,
    announcement_banner text default 'طازج ومذبوح يومياً بإشراف بيطري كامل — توصيل سريع لجميع المناطق',
    address text default 'طريق 10، بين بوابة ٥ و بوابة ٦ جمعية عرابي - خلف كارفور العبور، القاهرة',
    maps_url text default 'https://maps.app.goo.gl/koT5YPn28VA48SZU7',
    show_hero_banner boolean default true,
    hero_title text default 'عارف يعني ايه لحمة ؟!',
    hero_description text default 'أصول الجزارة البلدي من قلب المذبح. ننتقي لك أنعم القطعيات الطازجة، ونجهزها بتقطيعك المفضل ونوصلها لباب بيتك مباشرة عبر الواتساب.',
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- إدراج الإعدادات الافتراضية
insert into public.store_settings (id, store_name, slogan, whatsapp_number)
values ('main_config', 'حلاوة العنتبلي', 'عارف يعني ايه لحمة ؟!', '201000000000')
on conflict (id) do nothing;

-- 3. جدول تصنيفات اللحوم (Categories)
create table if not exists public.categories (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    slug text not null unique,
    icon text default 'steak',
    display_order integer default 0,
    is_active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. جدول المنتجات والقطعيات (Products)
create table if not exists public.products (
    id uuid primary key default uuid_generate_v4(),
    category_id uuid references public.categories(id) on delete set null,
    name text not null,
    english_name text,
    description text,
    price_per_kg numeric(10, 2) not null,
    image_url text,
    badge text, -- مثال: "الأكثر طلباً", "طازة اليوم", "سوبر", "عرض خاص"
    available_cuts jsonb default '["مكعبات كباب حلة", "قطع سلق كبيرة", "بوفتيك رفيع", "شاورما", "مفروم خشن", "مفروم ناعم", "قطعة واحدة متماسكة"]'::jsonb,
    fat_options jsonb default '["أحمر صافي", "ملبس خفيف (وسط)", "ملبس دسم"]'::jsonb,
    weight_options jsonb default '[0.5, 1, 1.5, 2, 3]'::jsonb,
    is_in_stock boolean default true,
    is_featured boolean default false,
    display_order integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. جدول سجل الطلبات (Orders)
create table if not exists public.orders (
    id uuid primary key default uuid_generate_v4(),
    order_number serial unique,
    customer_name text not null,
    customer_phone text not null,
    customer_address text not null,
    items jsonb not null,
    total_amount numeric(10, 2) not null,
    delivery_fee numeric(10, 2) default 0,
    notes text,
    status text default 'new', -- new, preparing, delivered, cancelled
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. سياسات الأمان (Row Level Security - RLS)
alter table public.store_settings enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;

-- سياسات القراءة العامة
create policy "Allow public read-only on store_settings"
on public.store_settings for select using (true);

create policy "Allow public read-only on categories"
on public.categories for select using (true);

create policy "Allow public read-only on products"
on public.products for select using (true);

create policy "Allow public insert on orders"
on public.orders for insert with check (true);

-- سياسات التعديل الكاملة للمسؤول
create policy "Allow all on store_settings"
on public.store_settings for all using (true) with check (true);

create policy "Allow all on categories"
on public.categories for all using (true) with check (true);

create policy "Allow all on products"
on public.products for all using (true) with check (true);

create policy "Allow all on orders"
on public.orders for all using (true) with check (true);

-- 7. إضافة التصنيفات الأربعة الرئيسية
insert into public.categories (name, slug, icon, display_order)
values 
('قطعيات وستيك فاخر', 'premium-steaks', 'steak', 1),
('لحوم طبيخ وسلق وطواجن', 'cooking-stew', 'stew', 2),
('مفروم ومصنعات العنتبلي', 'minced-specialties', 'mince', 3),
('كبدة وحلويات لحوم بلدي', 'offal-liver', 'liver', 4)
on conflict (slug) do nothing;

-- 8. إدراج كافة الـ 40 صنفاً المعتمدة في قائمة الأسعار
-- (أ) قطعيات وستيك فاخر
insert into public.products (category_id, name, english_name, description, price_per_kg, badge, is_featured, display_order)
select id, 'عرق فلتو صافي', 'Solo fillet', 'أنعم وأطرى قطعية لحم بلدي على الإطلاق، خالية تماماً من الدهن والعروق ومثالية للشوي والفرن', 1050.00, 'VIP فاخر', true, 1
from public.categories where slug = 'premium-steaks';

insert into public.products (category_id, name, english_name, description, price_per_kg, badge, is_featured, display_order)
select id, 'عرق فلتو', 'Fillet', 'عرق فلتو بلدي كامل طازج، ملمس زبدي يذوب في الفم لأفخم العزومات', 520.00, 'مميز', true, 2
from public.categories where slug = 'premium-steaks';

insert into public.products (category_id, name, english_name, description, price_per_kg, badge, is_featured, display_order)
select id, 'عرق تربيانكو', 'Eye round roast', 'عرق لحمة باردة مثالي للتحمير والتقطيع شرائح باردة، متماسك وطعم غني', 520.00, 'الأكثر طلباً', true, 3
from public.categories where slug = 'premium-steaks';

insert into public.products (category_id, name, english_name, description, price_per_kg, badge, is_featured, display_order)
select id, 'انتركوت', 'Strip lion', 'شريحة ستريبلوين بلدي متوازنة الدهن، نكهة لحم بلدي أصيلة مع عصارة ممتازة على الجريل', 490.00, 'ستيك أصلي', true, 4
from public.categories where slug = 'premium-steaks';

insert into public.products (category_id, name, english_name, description, price_per_kg, badge, is_featured, display_order)
select id, 'ريب اي ستيك', 'Rib eye steak', 'عين الضلع الشهيرة، غنية بالتعريق الدهني المارمري لأعلى درجات الطراوة والنكهة', 490.00, 'عشاق الستيك', true, 5
from public.categories where slug = 'premium-steaks';

insert into public.products (category_id, name, english_name, description, price_per_kg, badge, is_featured, display_order)
select id, 'توب سايد ستيك', 'Top side steak', 'ستيك من وش الفخذة قليل الدهن، ممتاز للتسوية السريعة والتحمير', 520.00, null, false, 6
from public.categories where slug = 'premium-steaks';

insert into public.products (category_id, name, english_name, description, price_per_kg, badge, is_featured, display_order)
select id, 'بفتيك', 'Escalope', 'شرائح بفتيك مدقوقة بدقة وسريعة التسوية، طرية وناعمة لأشهى إسكالوب بانيه', 520.00, 'الأكثر طلباً', true, 7
from public.categories where slug = 'premium-steaks';

insert into public.products (category_id, name, english_name, description, price_per_kg, badge, is_featured, display_order)
select id, 'بيكاتا', 'Picata', 'شرائح رقيقة ومجهزة خصيصاً لأطباق البيكاتا بالمشروم أو الليمون', 520.00, null, false, 8
from public.categories where slug = 'premium-steaks';

insert into public.products (category_id, name, english_name, description, price_per_kg, badge, is_featured, display_order)
select id, 'لحم شرائح', 'Steak', 'شرائح لحم بلدي حمراء مجهزة للتحمير السريع والسندوتشات الفاخرة', 470.00, null, false, 9
from public.categories where slug = 'premium-steaks';

-- (ب) لحوم طبيخ وسلق وطواجن
insert into public.products (category_id, name, english_name, description, price_per_kg, badge, is_featured, display_order)
select id, 'لحم أحمر صافي', 'Pure Red Meat', 'لحم بقري أحمر خالص منزوع الدهن تماماً، أعلى قيمة غذائية وطعم صافي', 625.00, 'صحي وصافي', true, 10
from public.categories where slug = 'cooking-stew';

insert into public.products (category_id, name, english_name, description, price_per_kg, badge, is_featured, display_order)
select id, 'وش فخذه', 'Round / Top Round', 'قطعية ممتازة متعددة الاستخدام، حمراء وطرية تصلح للخضار والتحمير', 520.00, null, false, 11
from public.categories where slug = 'cooking-stew';

insert into public.products (category_id, name, english_name, description, price_per_kg, badge, is_featured, display_order)
select id, 'سمانه', 'Knuckle', 'لحمة سمانة الفخذ، ناعمة جداً في الطبخ وتعطي شوربة دسمة وشهية', 520.00, null, false, 12
from public.categories where slug = 'cooking-stew';

insert into public.products (category_id, name, english_name, description, price_per_kg, badge, is_featured, display_order)
select id, 'موزة', 'Shank', 'موزة ناعمة غنية بالجيلاتين الطبيعي، سيدة الطواجن والفتة المصرية بلا منازع', 490.00, 'سيدة الطواجن', true, 13
from public.categories where slug = 'cooking-stew';

insert into public.products (category_id, name, english_name, description, price_per_kg, badge, is_featured, display_order)
select id, 'كباب حلة', 'Red casserole cubes', 'مكعبات لحم بلدي متناسقة مع نسبة رطوبة مثالية لكباب الحلة بالبصل المكرمل', 470.00, 'الأكثر طلباً', true, 14
from public.categories where slug = 'cooking-stew';

insert into public.products (category_id, name, english_name, description, price_per_kg, badge, is_featured, display_order)
select id, 'كولاته', 'Rump', 'قطعية طرية ممتازة للسلق والطواجن وتعطي مرقة صافية غنية', 470.00, null, false, 15
from public.categories where slug = 'cooking-stew';

insert into public.products (category_id, name, english_name, description, price_per_kg, badge, is_featured, display_order)
select id, 'سن', 'Chuck', 'لحم سن بلدي بطراوة طبيعية ودهن خفيف متداخل، مثالي للشوربة وطواجن البامية', 470.00, null, false, 16
from public.categories where slug = 'cooking-stew';

insert into public.products (category_id, name, english_name, description, price_per_kg, badge, is_featured, display_order)
select id, 'لحم خضار أحمر', 'Stewing cubes', 'مكعبات لحم حمراء خالية من الدهون الزائدة مجهزة لجميع أنواع الخضار واليخنات', 470.00, null, false, 17
from public.categories where slug = 'cooking-stew';

insert into public.products (category_id, name, english_name, description, price_per_kg, badge, is_featured, display_order)
select id, 'لحم خضار ملبس', 'Marbled stewing meat', 'لحم بلدي ملبس خفيف، يمنح الخضار والطبيخ دسماً بلدياً أصيلاً ونكهة لا تُنسى', 400.00, 'طعم بلدي', false, 18
from public.categories where slug = 'cooking-stew';

insert into public.products (category_id, name, english_name, description, price_per_kg, badge, is_featured, display_order)
select id, 'عكاوي', 'Oxtail', 'عكوة بلدي طازجة مقطعة مفاصل جاهزة لطاجن العكاوي بالبصل والفخار', 470.00, 'طاجن ملوكي', true, 19
from public.categories where slug = 'cooking-stew';

-- (ج) مفروم ومصنعات العنتبلي
insert into public.products (category_id, name, english_name, description, price_per_kg, badge, is_featured, display_order)
select id, 'سجق اسبيشيال', 'Special Sausage', 'سجق خلطة العنتبلي الخاصة بأجود التوابل واللحوم الطازجة في هانك طبيعي', 520.00, 'خلطة العنتبلي', true, 20
from public.categories where slug = 'minced-specialties';

insert into public.products (category_id, name, english_name, description, price_per_kg, badge, is_featured, display_order)
select id, 'برجر اسبيشيال', 'Special Burger', 'برجر لحم بلدي صافي سميك بدون فول صويا، متبل تتبيلة مطاعم البرجر العالمية', 500.00, 'سوبر', true, 21
from public.categories where slug = 'minced-specialties';

insert into public.products (category_id, name, english_name, description, price_per_kg, badge, is_featured, display_order)
select id, 'لحم مفروم سوبر', 'Minced beef low fat', 'مفروم أحمر خالي من الشغت وقليل الدهن، مناسب للدايت والمكرونة البشاميل الصحية', 470.00, 'قليل الدهن', true, 22
from public.categories where slug = 'minced-specialties';

insert into public.products (category_id, name, english_name, description, price_per_kg, badge, is_featured, display_order)
select id, 'ستروجان اوف', 'Stroganoff', 'شرائح لحم رفيعة ومجهزة للتسوية السريعة لطبق بيف ستروجانوف بالكريمة', 475.00, null, false, 23
from public.categories where slug = 'minced-specialties';

insert into public.products (category_id, name, english_name, description, price_per_kg, badge, is_featured, display_order)
select id, 'شاورما', 'Stir fry', 'شرائح شاورما لحم بلدي طازجة متبلة أو سادة جاهزة للصدمة على النار', 475.00, 'الأكثر طلباً', true, 24
from public.categories where slug = 'minced-specialties';

insert into public.products (category_id, name, english_name, description, price_per_kg, badge, is_featured, display_order)
select id, 'سجق بلدي', 'Balady sausages', 'سجق بلدي بالطريقة التقليدية الشهية، بهارات معتدلة ولحم صافي', 450.00, 'بلدي أصيل', true, 25
from public.categories where slug = 'minced-specialties';

insert into public.products (category_id, name, english_name, description, price_per_kg, badge, is_featured, display_order)
select id, 'كفتة شوي', 'Grilled kofta', 'كفتة حاتي بلدي مفرومة ومتبلة وجاهزة للسيخ مباشرة، متماسكة ولا تكش', 420.00, 'جاهزة للشوي', true, 26
from public.categories where slug = 'minced-specialties';

insert into public.products (category_id, name, english_name, description, price_per_kg, badge, is_featured, display_order)
select id, 'لحم حواوشي', 'Hawawshi meat', 'تتبيلة حواوشي العنتبلي بالبصل والفلفل والبهارات البلدية للرغيف البلدي فوراً', 420.00, 'جاهز للرغيف', false, 27
from public.categories where slug = 'minced-specialties';

insert into public.products (category_id, name, english_name, description, price_per_kg, badge, is_featured, display_order)
select id, 'لحم مفروم', 'Minced beef', 'مفروم بلدي طازج يومياً بنسبة دهن متوازنة للكفتة والحواوشي والطواجن', 400.00, 'طازة اليوم', false, 28
from public.categories where slug = 'minced-specialties';

-- (د) كبدة وحلويات لحوم بلدي
insert into public.products (category_id, name, english_name, description, price_per_kg, badge, is_featured, display_order)
select id, 'كبده صافي', 'Solo liver', 'كبدة بلدي طازجة ذبيحة اليوم، ريحة وطعم بلدي صافي شرائح أو عصافيري', 520.00, 'طازة ذبيحة اليوم', true, 29
from public.categories where slug = 'offal-liver';

insert into public.products (category_id, name, english_name, description, price_per_kg, badge, is_featured, display_order)
select id, 'كبده مشكل', 'Liver-Heart-Kidney', 'مشكل كبدة وقلب وكلاوي بلدي لطبق التحبيشة والمقلاية الإسكندراني', 495.00, 'مشكل مقلاية', true, 30
from public.categories where slug = 'offal-liver';

insert into public.products (category_id, name, english_name, description, price_per_kg, badge, is_featured, display_order)
select id, 'قلب صافي', 'Solo Heart', 'قلب بلدي أحمر طازج خالي من الدهون، ممتاز للتحمير مع الثوم والفلفل', 470.00, null, false, 31
from public.categories where slug = 'offal-liver';

insert into public.products (category_id, name, english_name, description, price_per_kg, badge, is_featured, display_order)
select id, 'كلاوي صافي', 'Solo Kidney', 'كلاوي بلدي طازجة مقطعة شرائح جاهزة للتشويح السريع مع السمنة البلدي', 470.00, null, false, 32
from public.categories where slug = 'offal-liver';

insert into public.products (category_id, name, english_name, description, price_per_kg, badge, is_featured, display_order)
select id, 'كوارع', 'Trotter', 'كوارع بقري بلدي منظفة ومقطعة بعناية، مرقة جيلاتينية غنية لشوربة وفتة الكوارع', 380.00, 'دسم وعافية', true, 33
from public.categories where slug = 'offal-liver';

insert into public.products (category_id, name, english_name, description, price_per_kg, badge, is_featured, display_order)
select id, 'لحم رأس', 'Head meat', 'لحم رأس بلدي طازج ومسلوق أو نيء جاهز لطواجن الفريك والصلصة', 310.00, null, false, 34
from public.categories where slug = 'offal-liver';

insert into public.products (category_id, name, english_name, description, price_per_kg, badge, is_featured, display_order)
select id, 'لسان', 'Tongue', 'لسان بقري بلدي ناعم ونظيف، يذوب عند السلق والتحمير بالسمن البلدي', 310.00, null, false, 35
from public.categories where slug = 'offal-liver';

insert into public.products (category_id, name, english_name, description, price_per_kg, badge, is_featured, display_order)
select id, 'مخ', 'Beef brain', 'مخ بلدي طازج نظيف جداً ومجهز للبانيه والتحمير بالبيض والبقسماط', 310.00, null, false, 36
from public.categories where slug = 'offal-liver';

insert into public.products (category_id, name, english_name, description, price_per_kg, badge, is_featured, display_order)
select id, 'ممبار', 'Beef intestine', 'ممبار بقري بلدي أصلي نظيف ومفرغ، عيار مضبوط لأشهى حشو أرز خلطة', 270.00, 'الأكثر طلباً', true, 37
from public.categories where slug = 'offal-liver';

insert into public.products (category_id, name, english_name, description, price_per_kg, badge, is_featured, display_order)
select id, 'طحال', 'Beef spleen', 'طحال بلدي طازج، ملمس متماسك وطعم دسم بعد السلق والتحمير', 250.00, null, false, 38
from public.categories where slug = 'offal-liver';

insert into public.products (category_id, name, english_name, description, price_per_kg, badge, is_featured, display_order)
select id, 'فشة', 'Lung', 'فشة بلدي وردية طازجة، مسلوقة ومقطعة شرائح مقرمشة للمقلاية', 250.00, null, false, 39
from public.categories where slug = 'offal-liver';

insert into public.products (category_id, name, english_name, description, price_per_kg, badge, is_featured, display_order)
select id, 'كرشة', 'Tripe', 'كرشة بلدي بيضاء ناصعة منظفة تماماً على أصولها، جاهزة للصلصة بالحمص', 240.00, null, false, 40
from public.categories where slug = 'offal-liver';

-- ==========================================================
-- 9. إعداد مساحة تخزين صور المنتجات (Supabase Storage Bucket & Policies)
-- ==========================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "Allow public read on product images"
on storage.objects for select
using (bucket_id = 'product-images');

create policy "Allow public upload on product images"
on storage.objects for insert
with check (bucket_id = 'product-images');

create policy "Allow public update on product images"
on storage.objects for update
using (bucket_id = 'product-images');

create policy "Allow public delete on product images"
on storage.objects for delete
using (bucket_id = 'product-images');

-- ==========================================================
-- 8. تحديثات العروض وسجل الطلبات (Discounts & Order Additions)
-- ==========================================================
alter table public.store_settings 
add column if not exists discount_enabled boolean default false,
add column if not exists discount_percent numeric(5, 2) default 0,
add column if not exists discount_title text default 'خصم خاص على أسعار اللحوم البلدي',
add column if not exists discount_target_category text default 'all',
add column if not exists discount_start_date timestamptz,
add column if not exists discount_end_date timestamptz;

alter table public.products
add column if not exists sale_price numeric(10, 2),
add column if not exists discount_percent numeric(5, 2);

alter table public.orders
add column if not exists delivery_type text default 'delivery';
