export const defaultStoreSettings = {
  id: 'main_config',
  store_name: 'حلاوة العنتبلي',
  slogan: 'عارف يعني ايه لحمة ؟!',
  whatsapp_number: '201000000000',
  is_store_open: true,
  store_closed_message: 'المتجر مغلق حالياً، نستقبل طلباتكم غداً بدءاً من الساعة 9 صباحاً.',
  delivery_fee: 30,
  min_order_amount: 0,
  free_delivery_threshold: 0,
  announcement_enabled: true,
  announcement_banner: 'طازج ومذبوح يومياً بإشراف بيطري كامل — توصيل سريع لجميع المناطق',
  announcement_theme: 'crimson',
  announcement_ticker: false,
  address: 'طريق 10، بين بوابة ٥ و بوابة ٦ جمعية عرابي - خلف كارفور العبور، القاهرة',
  maps_url: 'https://maps.app.goo.gl/koT5YPn28VA48SZU7',
  show_hero_banner: true,
  hero_badge: 'جزارة بلدي 100% — ذبح يومي معتمد',
  hero_title: 'عارف يعني ايه لحمة ؟!',
  hero_description: 'أصول الجزارة البلدي من قلب المذبح. ننتقي لك أنعم القطعيات الطازجة، ونجهزها بتقطيعك المفضل ونوصلها لباب بيتك مباشرة عبر الواتساب.',
  show_promo_banner: true,
  promo_banner_custom_text: '',
  discount_enabled: false,
  discount_percent: 10,
  discount_title: 'خصم خاص على أسعار اللحوم البلدي',
  discount_target_category: 'all',
  discount_start_date: '',
  discount_end_date: ''
};

export const isDiscountActive = (settings) => {
  if (!settings || !settings.discount_enabled) return false;
  const pct = Number(settings.discount_percent);
  if (!pct || pct <= 0) return false;

  const now = Date.now();
  if (settings.discount_start_date) {
    const start = new Date(settings.discount_start_date).getTime();
    if (!isNaN(start) && now < start) return false;
  }
  if (settings.discount_end_date) {
    const end = new Date(settings.discount_end_date).getTime();
    if (!isNaN(end) && now > end) return false;
  }
  return true;
};

export const isProductDiscountTimeValid = (item) => {
  if (!item) return false;
  const now = Date.now();
  if (item.discount_start_date) {
    const start = new Date(item.discount_start_date).getTime();
    // 30-minute grace window for clock drift or local time discrepancies
    if (!isNaN(start) && (now + 30 * 60 * 1000) < start) return false;
  }
  if (item.discount_end_date) {
    const end = new Date(item.discount_end_date).getTime();
    // Allow through the end of the specified minute/day
    if (!isNaN(end) && now > end) return false;
  }
  return true;
};

export const calculateProductDiscount = (product) => {
  if (!product) return { originalPrice: 0, finalPrice: 0, discountPercent: 0, hasDiscount: false, discountTitle: '' };

  const basePrice = Number(product.price_per_kg) || 0;

  // 1. Direct product individual discount percentage with time validity check
  if (product.discount_percent && Number(product.discount_percent) > 0 && isProductDiscountTimeValid(product)) {
    const pct = Number(product.discount_percent);
    const discounted = Math.round(basePrice * (1 - pct / 100));
    return {
      originalPrice: basePrice,
      finalPrice: discounted,
      discountPercent: pct,
      hasDiscount: true,
      discountTitle: product.discount_title || `خصم ${pct}%`,
      discountStartDate: product.discount_start_date || null,
      discountEndDate: product.discount_end_date || null
    };
  }

  // 2. Direct product sale price if set with time validity check
  if (product.sale_price && Number(product.sale_price) > 0 && Number(product.sale_price) < basePrice && isProductDiscountTimeValid(product)) {
    const sale = Number(product.sale_price);
    const pct = Math.round(((basePrice - sale) / basePrice) * 100);
    return {
      originalPrice: basePrice,
      finalPrice: sale,
      discountPercent: pct,
      hasDiscount: true,
      discountTitle: 'سعر العرض',
      discountStartDate: product.discount_start_date || null,
      discountEndDate: product.discount_end_date || null
    };
  }

  return {
    originalPrice: basePrice,
    finalPrice: basePrice,
    discountPercent: 0,
    hasDiscount: false,
    discountTitle: ''
  };
};

export const defaultCategories = [
  { id: '1', name: 'الكل', slug: 'all', iconType: 'all' },
  { id: '2', name: 'قطعيات وستيك فاخر', slug: 'premium-steaks', iconType: 'steak' },
  { id: '3', name: 'لحوم طبيخ وسلق وطواجن', slug: 'cooking-stew', iconType: 'stew' },
  { id: '4', name: 'مفروم ومصنعات العنتبلي', slug: 'minced-specialties', iconType: 'mince' },
  { id: '5', name: 'كبدة وحلويات لحوم بلدي', slug: 'offal-liver', iconType: 'liver' },
];

export const defaultProducts = [
  // 1. قطعيات وستيك فاخر
  {
    id: 'p1',
    name: 'عرق فلتو صافي',
    english_name: 'Solo fillet',
    category: 'premium-steaks',
    price_per_kg: 1050,
    badge: null,
    image_url: null,
    is_featured: true,
    description: 'أنعم وأطرى قطعية لحم بلدي على الإطلاق، خالية تماماً من الدهن ومثالية للشوي والفرن',
    available_cuts: ['قطعة واحدة كاملة', 'شرائح مدقوقة', 'ميداليون ستيك'],
    fat_options: ['أحمر صافي 100%']
  },
  {
    id: 'p2',
    name: 'عرق فلتو',
    english_name: 'Fillet',
    category: 'premium-steaks',
    price_per_kg: 520,
    badge: null,
    image_url: null,
    is_featured: true,
    description: 'عرق فلتو بلدي طازج، ملمس زبدي يذوب في الفم لأفخم العزومات',
    available_cuts: ['قطعة واحدة كاملة', 'شرائح ستيك', 'مكعبات ناعمة'],
    fat_options: ['أحمر صافي', 'ملبس خفيف']
  },
  {
    id: 'p3',
    name: 'عرق تربيانكو',
    english_name: 'Eye round roast',
    category: 'premium-steaks',
    price_per_kg: 520,
    badge: null,
    image_url: null,
    is_featured: true,
    description: 'عرق اللحمة الباردة الشهير، متماسك وطعم غني مثالي للتحمير والتقطيع شرائح باردة',
    available_cuts: ['عرق كامل مربوط ومتبل', 'عرق كامل سادة', 'مكعبات خضار متماسكة'],
    fat_options: ['أحمر صافي']
  },
  {
    id: 'p4',
    name: 'انتركوت',
    english_name: 'Strip lion',
    category: 'premium-steaks',
    price_per_kg: 490,
    badge: null,
    image_url: null,
    is_featured: true,
    description: 'شريحة ستريبلوين بلدي متوازنة الدهن، نكهة بلدي أصيلة مع عصارة ممتازة على الجريل',
    available_cuts: ['شرائح جريل سميكة', 'شرائح رفيعة سريعة التسوية', 'مكعبات للشيش'],
    fat_options: ['ملبس خفيف (مارمري)', 'أحمر صافي']
  },
  {
    id: 'p5',
    name: 'ريب اي ستيك',
    english_name: 'Rib eye steak',
    category: 'premium-steaks',
    price_per_kg: 490,
    badge: null,
    image_url: null,
    is_featured: true,
    description: 'عين الضلع الشهيرة، غنية بالتعريق الدهني المارمري لأعلى درجات الطراوة والنكهة',
    available_cuts: ['شرائح ستيك جريل سميكة', 'شرائح رقيقة', 'قطعة كاملة للروستو'],
    fat_options: ['ملبس دسم بنكهة الستيك', 'وسط']
  },
  {
    id: 'p6',
    name: 'توب سايد ستيك',
    english_name: 'Top side steak',
    category: 'premium-steaks',
    price_per_kg: 520,
    badge: null,
    image_url: null,
    is_featured: false,
    description: 'ستيك من وش الفخذة قليل الدهن، ممتاز للتسوية السريعة والتحمير',
    available_cuts: ['شرائح بفتيك', 'مكعبات سريعة'],
    fat_options: ['أحمر صافي']
  },
  {
    id: 'p7',
    name: 'بفتيك',
    english_name: 'Escalope',
    category: 'premium-steaks',
    price_per_kg: 520,
    badge: null,
    image_url: null,
    is_featured: true,
    description: 'شرائح بفتيك مدقوقة بدقة وسريعة التسوية، طرية وناعمة لأشهى إسكالوب بانيه',
    available_cuts: ['شرائح رقيقة مدقوقة جاهزة للبانيه', 'شرائح بدون دق'],
    fat_options: ['أحمر صافي 100%']
  },
  {
    id: 'p8',
    name: 'بيكاتا',
    english_name: 'Picata',
    category: 'premium-steaks',
    price_per_kg: 520,
    badge: null,
    image_url: null,
    is_featured: false,
    description: 'شرائح رقيقة ومجهزة خصيصاً لأطباق البيكاتا بالمشروم أو الليمون',
    available_cuts: ['شرائح بيكاتا رفيعة', 'قطع صغيرة'],
    fat_options: ['أحمر صافي']
  },
  {
    id: 'p9',
    name: 'لحم شرائح',
    english_name: 'Steak',
    category: 'premium-steaks',
    price_per_kg: 470,
    badge: null,
    image_url: null,
    is_featured: false,
    description: 'شرائح لحم بلدي حمراء مجهزة للتحمير السريع والسندوتشات الفاخرة',
    available_cuts: ['شرائح متوسطة', 'شرائح رقيقة'],
    fat_options: ['أحمر صافي', 'ملبس خفيف']
  },

  // 2. لحوم طبيخ وسلق وطواجن
  {
    id: 'p10',
    name: 'لحم أحمر صافي',
    english_name: 'Pure Red Meat',
    category: 'cooking-stew',
    price_per_kg: 625,
    badge: null,
    image_url: null,
    is_featured: true,
    description: 'لحم بقري أحمر خالص منزوع الدهن والشغت تماماً، أعلى قيمة غذائية وطعم صافي',
    available_cuts: ['مكعبات وسط للخضار', 'قطع سلق كبيرة', 'مكعبات كباب حلة', 'مفروم أحمر'],
    fat_options: ['أحمر صافي خالي من الدهن']
  },
  {
    id: 'p11',
    name: 'وش فخذه',
    english_name: 'Round / Top Round',
    category: 'cooking-stew',
    price_per_kg: 520,
    badge: null,
    image_url: null,
    is_featured: false,
    description: 'قطعية ممتازة متعددة الاستخدام، حمراء وطرية تصلح للخضار والتحمير والبفتيك',
    available_cuts: ['مكعبات خضار', 'قطع سلق', 'شرائح'],
    fat_options: ['أحمر صافي', 'ملبس خفيف']
  },
  {
    id: 'p12',
    name: 'سمانه',
    english_name: 'Knuckle',
    category: 'cooking-stew',
    price_per_kg: 520,
    badge: null,
    image_url: null,
    is_featured: false,
    description: 'لحمة سمانة الفخذ، ناعمة جداً في الطبخ وتعطي شوربة دسمة وشهية',
    available_cuts: ['قطع سلق للشوربة', 'مكعبات طواجن'],
    fat_options: ['أحمر صافي', 'ملبس خفيف']
  },
  {
    id: 'p13',
    name: 'موزة',
    english_name: 'Shank',
    category: 'cooking-stew',
    price_per_kg: 490,
    badge: null,
    image_url: null,
    is_featured: true,
    description: 'موزة ناعمة غنية بالجيلاتين الطبيعي، سيدة الطواجن والفتة المصرية بلا منازع',
    available_cuts: ['موزة كاملة بالعظم', 'قطع مخلية مكعبات كبيرة', 'ترنشات مدورة'],
    fat_options: ['جيلاتين طبيعي ناعم', 'صافي']
  },
  {
    id: 'p14',
    name: 'كباب حلة',
    english_name: 'Red casserole cubes',
    category: 'cooking-stew',
    price_per_kg: 470,
    badge: null,
    image_url: null,
    is_featured: true,
    description: 'مكعبات لحم بلدي متناسقة مع نسبة رطوبة مثالية لكباب الحلة بالبصل المكرمل',
    available_cuts: ['مكعبات صغيرة لكباب الحلة', 'مكعبات وسط'],
    fat_options: ['ملبس خفيف (يعطي صوص مكرمل)', 'أحمر صافي']
  },
  {
    id: 'p15',
    name: 'كولاته',
    english_name: 'Rump',
    category: 'cooking-stew',
    price_per_kg: 470,
    badge: null,
    image_url: null,
    is_featured: false,
    description: 'قطعية طرية ممتازة للسلق والطواجن وتعطي مرقة صافية غنية',
    available_cuts: ['قطع سلق', 'مكعبات طواجن'],
    fat_options: ['أحمر صافي', 'ملبس']
  },
  {
    id: 'p16',
    name: 'سن',
    english_name: 'Chuck',
    category: 'cooking-stew',
    price_per_kg: 470,
    badge: null,
    image_url: null,
    is_featured: false,
    description: 'لحم سن بلدي بطراوة طبيعية ودهن خفيف متداخل، مثالي للشوربة وطواجن البامية',
    available_cuts: ['قطع سلق وسط', 'مكعبات طواجن'],
    fat_options: ['ملبس دسم بلدي', 'وسط']
  },
  {
    id: 'p17',
    name: 'لحم خضار أحمر',
    english_name: 'Stewing cubes',
    category: 'cooking-stew',
    price_per_kg: 470,
    badge: null,
    image_url: null,
    is_featured: false,
    description: 'مكعبات لحم حمراء خالية من الدهون الزائدة مجهزة لجميع أنواع الخضار واليخنات',
    available_cuts: ['مكعبات خضار متناسقة', 'قطع سلق'],
    fat_options: ['أحمر صافي']
  },
  {
    id: 'p18',
    name: 'لحم خضار ملبس',
    english_name: 'Marbled stewing meat',
    category: 'cooking-stew',
    price_per_kg: 400,
    badge: null,
    image_url: null,
    is_featured: false,
    description: 'لحم بلدي ملبس خفيف، يمنح الخضار والطبيخ دسماً بلدياً أصيلاً ونكهة لا تُنسى',
    available_cuts: ['مكعبات وسط', 'قطع سلق'],
    fat_options: ['ملبس بلدي']
  },
  {
    id: 'p19',
    name: 'عكاوي',
    english_name: 'Oxtail',
    category: 'cooking-stew',
    price_per_kg: 470,
    badge: null,
    image_url: null,
    is_featured: true,
    description: 'عكوة بلدي طازجة مقطعة مفاصل جاهزة لطاجن العكاوي بالبصل والفخار',
    available_cuts: ['مقطعة مفاصل جاهزة للطاجن', 'عكوة كاملة'],
    fat_options: ['طبيعي']
  },

  // 3. مفروم ومصنعات العنتبلي
  {
    id: 'p20',
    name: 'سجق اسبيشيال',
    english_name: 'Special Sausage',
    category: 'minced-specialties',
    price_per_kg: 520,
    badge: null,
    image_url: null,
    is_featured: true,
    description: 'سجق خلطة العنتبلي السرية بأجود التوابل واللحوم الطازجة في هانك طبيعي',
    available_cuts: ['سجق أصابع سليم', 'سجق مقطع'],
    fat_options: ['موزون مضبوط']
  },
  {
    id: 'p21',
    name: 'برجر اسبيشيال',
    english_name: 'Special Burger',
    category: 'minced-specialties',
    price_per_kg: 500,
    badge: null,
    image_url: null,
    is_featured: true,
    description: 'برجر لحم بلدي صافي سميك بدون فول صويا، متبل تتبيلة مطاعم البرجر العالمية',
    available_cuts: ['أقراص برجر سميكة بالورق الفاصل (6 قطع للكيلو تقريباً)'],
    fat_options: ['نسبة دهن برجر 15%']
  },
  {
    id: 'p22',
    name: 'لحم مفروم سوبر',
    english_name: 'Minced beef low fat',
    category: 'minced-specialties',
    price_per_kg: 470,
    badge: null,
    image_url: null,
    is_featured: true,
    description: 'مفروم أحمر خالي من الشغت وقليل الدهن، مناسب للدايت والمكرونة البشاميل الصحية',
    available_cuts: ['فرم وش واحد', 'فرم وشين ناعم'],
    fat_options: ['أحمر صافي (أقل من 5% دهن)']
  },
  {
    id: 'p23',
    name: 'ستروجان اوف',
    english_name: 'Stroganoff',
    category: 'minced-specialties',
    price_per_kg: 475,
    badge: null,
    image_url: null,
    is_featured: false,
    description: 'شرائح لحم رفيعة ومجهزة للتسوية السريعة لطبق بيف ستروجانوف بالكريمة',
    available_cuts: ['شرائح ستروجانوف رفيعة'],
    fat_options: ['أحمر صافي']
  },
  {
    id: 'p24',
    name: 'شاورما',
    english_name: 'Stir fry',
    category: 'minced-specialties',
    price_per_kg: 475,
    badge: null,
    image_url: null,
    is_featured: true,
    description: 'شرائح شاورما لحم بلدي طازجة مقطعة طولياً جاهزة للصدمة على النار',
    available_cuts: ['شرائح شاورما طولية سادة', 'متبلة بخلطة الشاورما'],
    fat_options: ['أحمر مع إضافة لية ضاني خفيفة', 'أحمر صافي']
  },
  {
    id: 'p25',
    name: 'سجق بلدي',
    english_name: 'Balady sausages',
    category: 'minced-specialties',
    price_per_kg: 450,
    badge: null,
    image_url: null,
    is_featured: true,
    description: 'سجق بلدي بالطريقة التقليدية الشهية، بهارات معتدلة ولحم صافي',
    available_cuts: ['أصابع سليمة'],
    fat_options: ['بلدي أصيل']
  },
  {
    id: 'p26',
    name: 'كفتة شوي',
    english_name: 'Grilled kofta',
    category: 'minced-specialties',
    price_per_kg: 420,
    badge: null,
    image_url: null,
    is_featured: true,
    description: 'كفتة حاتي بلدي مفرومة ومتبلة وجاهزة للسيخ مباشرة، متماسكة ولا تكش',
    available_cuts: ['مصبغة أصابع على سيخ خشب', 'عجينة كفتة متبلة جاهزة للتشكيل'],
    fat_options: ['مضبوطة بنسبة لية حاتي 20%']
  },
  {
    id: 'p27',
    name: 'لحم حواوشي',
    english_name: 'Hawawshi meat',
    category: 'minced-specialties',
    price_per_kg: 420,
    badge: null,
    image_url: null,
    is_featured: false,
    description: 'تتبيلة حواوشي العنتبلي بالبصل والفلفل والبهارات البلدية للرغيف البلدي فوراً',
    available_cuts: ['عجينة حواوشي متبلة جاهزة للحشو'],
    fat_options: ['دسم حواوشي بلدي']
  },
  {
    id: 'p28',
    name: 'لحم مفروم',
    english_name: 'Minced beef',
    category: 'minced-specialties',
    price_per_kg: 400,
    badge: null,
    image_url: null,
    is_featured: false,
    description: 'مفروم بلدي طازج يومياً بنسبة دهن متوازنة للكفتة والحواوشي والطواجن',
    available_cuts: ['فرم وش واحد', 'فرم وشين'],
    fat_options: ['ملبس وسط (15% دهن)', 'أحمر']
  },

  // 4. كبدة وحلويات لحوم بلدي
  {
    id: 'p29',
    name: 'كبده صافي',
    english_name: 'Solo liver',
    category: 'offal-liver',
    price_per_kg: 520,
    badge: null,
    image_url: null,
    is_featured: true,
    description: 'كبدة بلدي طازجة ذبيحة اليوم، ريحة وطعم بلدي صافي شرائح أو عصافيري',
    available_cuts: ['شرائح بانيه عريضة', 'عصافيري إسكندراني صغيرة', 'قطعة واحدة'],
    fat_options: ['كبدة صافي بدون دهن']
  },
  {
    id: 'p30',
    name: 'كبده مشكل',
    english_name: 'Liver-Heart-Kidney',
    category: 'offal-liver',
    price_per_kg: 495,
    badge: null,
    image_url: null,
    is_featured: true,
    description: 'مشكل كبدة وقلب وكلاوي بلدي لطبق التحبيشة والمقلاية الإسكندراني',
    available_cuts: ['مقطع عصافيري للمقلاية', 'شرائح'],
    fat_options: ['مع حتة لية هدية', 'سادة']
  },
  {
    id: 'p31',
    name: 'قلب صافي',
    english_name: 'Solo Heart',
    category: 'offal-liver',
    price_per_kg: 470,
    badge: null,
    image_url: null,
    is_featured: false,
    description: 'قلب بلدي أحمر طازج خالي من الدهون، ممتاز للتحمير مع الثوم والفلفل',
    available_cuts: ['شرائح رفيعة', 'مكعبات صغيرة'],
    fat_options: ['أحمر صافي']
  },
  {
    id: 'p32',
    name: 'كلاوي صافي',
    english_name: 'Solo Kidney',
    category: 'offal-liver',
    price_per_kg: 470,
    badge: null,
    image_url: null,
    is_featured: false,
    description: 'كلاوي بلدي طازجة مقطعة شرائح جاهزة للتشويح السريع مع السمنة البلدي',
    available_cuts: ['شرائح رقيقة تشويح'],
    fat_options: ['صافي']
  },
  {
    id: 'p33',
    name: 'كوارع',
    english_name: 'Trotter',
    category: 'offal-liver',
    price_per_kg: 380,
    badge: null,
    image_url: null,
    is_featured: true,
    description: 'كوارع بقري بلدي منظفة ومقطعة بعناية، مرقة جيلاتينية غنية لشوربة وفتة الكوارع',
    available_cuts: ['مقطعة جزل صغيرة للشوربة', 'مخلية جاهزة للفتة'],
    fat_options: ['جيلاتين طبيعي']
  },
  {
    id: 'p34',
    name: 'لحم رأس',
    english_name: 'Head meat',
    category: 'offal-liver',
    price_per_kg: 310,
    badge: null,
    image_url: null,
    is_featured: false,
    description: 'لحم رأس بلدي طازج ومنظف، جاهز لطواجن الفريك والصلصة بالبصل',
    available_cuts: ['مقطع قطع وسط للطواجن', 'سليم'],
    fat_options: ['بلدي دسم']
  },
  {
    id: 'p35',
    name: 'لسان',
    english_name: 'Tongue',
    category: 'offal-liver',
    price_per_kg: 310,
    badge: null,
    image_url: null,
    is_featured: false,
    description: 'لسان بقري بلدي ناعم ونظيف، يذوب عند السلق والتحمير بالسمن البلدي',
    available_cuts: ['لسان كامل منظف ومقشر', 'شرائح مسلوقة'],
    fat_options: ['صافي ناعم']
  },
  {
    id: 'p36',
    name: 'مخ',
    english_name: 'Beef brain',
    category: 'offal-liver',
    price_per_kg: 310,
    badge: null,
    image_url: null,
    is_featured: false,
    description: 'مخ بلدي طازج نظيف جداً ومجهز للبانيه والتحمير بالبيض والبقسماط',
    available_cuts: ['سليم كامل', 'شرائح بانيه'],
    fat_options: ['طبيعي']
  },
  {
    id: 'p37',
    name: 'ممبار',
    english_name: 'Beef intestine',
    category: 'offal-liver',
    price_per_kg: 270,
    badge: null,
    image_url: null,
    is_featured: true,
    description: 'ممبار بقري بلدي أصلي نظيف ومفرغ أبيض، عيار مضبوط لأشهى حشو أرز خلطة',
    available_cuts: ['منظف ومقصوص أطوال متساوية جاهز للحشو فوراً'],
    fat_options: ['نظيف 100%']
  },
  {
    id: 'p38',
    name: 'طحال',
    english_name: 'Beef spleen',
    category: 'offal-liver',
    price_per_kg: 250,
    badge: null,
    image_url: null,
    is_featured: false,
    description: 'طحال بلدي طازج، ملمس متماسك وطعم دسم بعد السلق والتحمير',
    available_cuts: ['طحال كامل سليم'],
    fat_options: ['طبيعي']
  },
  {
    id: 'p39',
    name: 'فشة',
    english_name: 'Lung',
    category: 'offal-liver',
    price_per_kg: 250,
    badge: null,
    image_url: null,
    is_featured: false,
    description: 'فشة بلدي وردية طازجة، مسلوقة ومقطعة شرائح مقرمشة للمقلاية والتحمير',
    available_cuts: ['شرائح رقيقة للمقلاية', 'قطعة كاملة'],
    fat_options: ['طبيعي']
  },
  {
    id: 'p40',
    name: 'كرشة',
    english_name: 'Tripe',
    category: 'offal-liver',
    price_per_kg: 240,
    badge: null,
    image_url: null,
    is_featured: false,
    description: 'كرشة بلدي بيضاء ناصعة منظفة ومكحوتة تماماً على أصولها، جاهزة للصلصة بالحمص',
    available_cuts: ['منظفة ومقطعة مربعات صغيرة جاهزة للطبيخ'],
    fat_options: ['نظيفة ناصعة البياض']
  }
];
