import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import CategoryNav from './components/CategoryNav';
import ProductCard from './components/ProductCard';
import ProductModal from './components/ProductModal';
import CartDrawer from './components/CartDrawer';
import AdminDashboard from './components/AdminDashboard';
import AdminAuthGuard from './components/AdminAuthGuard';
import PwaInstallBanner from './components/PwaInstallBanner';
import { 
  defaultStoreSettings, 
  defaultCategories, 
  defaultProducts, 
  isDiscountActive,
  calculateProductDiscount 
} from './data/defaultProducts';
import { supabase } from './supabaseClient';
import { ShoppingBag, Search, MapPin, Percent } from 'lucide-react';

export default function App() {
  // Check if current route is /admin or #admin
  const [isAdminRoute, setIsAdminRoute] = useState(() => {
    return window.location.pathname.startsWith('/admin') || window.location.hash === '#admin';
  });

  // Check if admin is currently authenticated via secure sessionStorage
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    try {
      const sessionStr = sessionStorage.getItem('halawa_admin_session');
      if (!sessionStr) return false;
      const session = JSON.parse(sessionStr);
      return session && session.expiresAt > Date.now();
    } catch {
      return false;
    }
  });

  const [storeSettings, setStoreSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('halawa_settings');
      return saved ? { ...defaultStoreSettings, ...JSON.parse(saved) } : defaultStoreSettings;
    } catch {
      return defaultStoreSettings;
    }
  });
  const [categories, setCategories] = useState(defaultCategories);
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('halawa_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((p) => {
          if (p.image_url && p.image_url.includes('/assets/products/')) {
            return { ...p, image_url: null };
          }
          return p;
        });
      }
      return defaultProducts;
    } catch {
      return defaultProducts;
    }
  });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cart & Modal State
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('halawa_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState(null);

  // Listen to browser navigation / popstate
  useEffect(() => {
    const handlePopState = () => {
      setIsAdminRoute(
        window.location.pathname.startsWith('/admin') || window.location.hash === '#admin'
      );
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Save Cart to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('halawa_cart', JSON.stringify(cart));
    } catch (err) {
      console.warn('LocalStorage cart notice:', err);
    }
  }, [cart]);

  // Save Settings to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('halawa_settings', JSON.stringify(storeSettings));
    } catch (err) {
      console.warn('LocalStorage settings notice:', err);
    }
  }, [storeSettings]);

  // Save Products to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('halawa_products', JSON.stringify(products));
    } catch (err) {
      console.warn('LocalStorage products notice:', err);
    }
  }, [products]);

  // Helper to strictly strip emojis per Taste-Skill & Hallmark
  const cleanEmoji = (text) => {
    if (typeof text !== 'string') return text;
    return text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
  };

  // Initial Sync with Supabase (Robust offline fallback to 40 products)
  useEffect(() => {
    async function loadSupabaseData() {
      try {
        // 1. Fetch Store Settings
        const { data: settingsData } = await supabase
          .from('store_settings')
          .select('*')
          .eq('id', 'main_config')
          .maybeSingle();

        if (settingsData) {
          setStoreSettings((prev) => {
            const merged = {
              ...prev,
              ...settingsData,
              store_name: cleanEmoji(settingsData.store_name || prev.store_name),
              slogan: cleanEmoji(settingsData.slogan || prev.slogan),
              announcement_banner: cleanEmoji(settingsData.announcement_banner || prev.announcement_banner),
              show_hero_banner: typeof settingsData.show_hero_banner === 'boolean'
                ? settingsData.show_hero_banner
                : (typeof prev.show_hero_banner === 'boolean' ? prev.show_hero_banner : true),
              hero_title: settingsData.hero_title || prev.hero_title,
              hero_description: settingsData.hero_description || prev.hero_description,
              maps_url: settingsData.maps_url || prev.maps_url,
              discount_enabled: typeof settingsData.discount_enabled === 'boolean'
                ? settingsData.discount_enabled
                : (typeof prev.discount_enabled === 'boolean' ? prev.discount_enabled : false),
              discount_percent: settingsData.discount_percent !== undefined
                ? Number(settingsData.discount_percent)
                : (prev.discount_percent || 10),
              discount_title: settingsData.discount_title || prev.discount_title || 'خصم خاص على أسعار اللحوم البلدي',
              discount_target_category: settingsData.discount_target_category || prev.discount_target_category || 'all',
              discount_start_date: settingsData.discount_start_date || prev.discount_start_date || '',
              discount_end_date: settingsData.discount_end_date || prev.discount_end_date || ''
            };
            try {
              localStorage.setItem('halawa_settings', JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }

        // 2. Fetch Categories (Sanitize names to ensure zero emojis)
        const { data: catData } = await supabase
          .from('categories')
          .select('*')
          .order('display_order', { ascending: true });

        if (catData && catData.length > 0) {
          const sanitizedCats = catData.map((c) => ({
            ...c,
            name: cleanEmoji(c.name)
          }));
          setCategories([
            { id: 'all', name: 'الكل', slug: 'all', iconType: 'all' },
            ...sanitizedCats
          ]);
        }

        // 3. Fetch Products (Sanitize names and remove generic AI slop badges)
        const { data: prodData } = await supabase
          .from('products')
          .select('*')
          .order('display_order', { ascending: true });

        if (prodData && prodData.length > 0) {
          const sanitizedProds = prodData.map((p) => ({
            ...p,
            name: cleanEmoji(p.name),
            badge: null,
            image_url: (p.image_url && !p.image_url.includes('/assets/products/')) ? p.image_url : null
          }));
          setProducts(sanitizedProds);
        }
      } catch (err) {
        console.warn('Supabase initial fetch info (using robust offline data):', err);
      }
    }

    loadSupabaseData();
  }, []);

  // Compute dynamic product prices with discount applied directly on each cut
  const effectiveProducts = useMemo(() => {
    return products.map((prod) => {
      const discountInfo = calculateProductDiscount(prod);
      return {
        ...prod,
        ...discountInfo
      };
    });
  }, [products]);

  // Filter products by category and search query using effective discounted products
  const filteredProducts = effectiveProducts.filter((prod) => {
    const categoryMatch = 
      selectedCategory === 'all' || 
      prod.category === selectedCategory ||
      prod.category_id === selectedCategory;

    const query = searchQuery.toLowerCase().trim();
    const searchMatch = !query || 
      prod.name.toLowerCase().includes(query) ||
      (prod.english_name && prod.english_name.toLowerCase().includes(query)) ||
      (prod.description && prod.description.toLowerCase().includes(query));

    return categoryMatch && searchMatch;
  });

  // Cart Handlers
  const handleAddToCart = (item) => {
    setCart((prev) => [...prev, { ...item, cartItemId: Date.now() + Math.random() }]);
  };

  const handleRemoveFromCart = (index) => {
    setCart((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Product Management Handlers
  const handleUpdateProductPrice = (productId, newPrice) => {
    setProducts((prev) => {
      const updated = prev.map((p) => (p.id === productId ? { ...p, price_per_kg: newPrice } : p));
      try {
        localStorage.setItem('halawa_products', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleUpdateProductImage = (productId, newImageUrl) => {
    setProducts((prev) => {
      const updated = prev.map((p) => (p.id === productId ? { ...p, image_url: newImageUrl } : p));
      try {
        localStorage.setItem('halawa_products', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleToggleStock = (productId) => {
    setProducts((prev) => {
      const updated = prev.map((p) => {
        if (p.id === productId) {
          const nextStock = p.is_in_stock === false ? true : false;
          supabase.from('products').update({ is_in_stock: nextStock }).eq('id', productId).then();
          return { ...p, is_in_stock: nextStock };
        }
        return p;
      });
      try {
        localStorage.setItem('halawa_products', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleAddNewProduct = (newProd) => {
    setProducts((prev) => {
      const updated = [{ ...newProd, id: newProd.id || 'custom_' + Date.now() }, ...prev];
      try {
        localStorage.setItem('halawa_products', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleUpdateFullProduct = (productId, updatedFields) => {
    setProducts((prev) => {
      const updated = prev.map((p) => (p.id === productId ? { ...p, ...updatedFields } : p));
      try {
        localStorage.setItem('halawa_products', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleDeleteProduct = (productId) => {
    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== productId);
      try {
        localStorage.setItem('halawa_products', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    supabase.from('products').delete().eq('id', productId).then();
  };

  const handleBatchUpdateProducts = (updatedProductsList) => {
    setProducts((prev) => {
      const map = new Map(updatedProductsList.map((p) => [p.id, p]));
      const updated = prev.map((p) => (map.has(p.id) ? { ...p, ...map.get(p.id) } : p));
      try {
        localStorage.setItem('halawa_products', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleUpdateSettings = (updated) => {
    setStoreSettings((prev) => {
      const merged = { ...prev, ...updated };
      try {
        localStorage.setItem('halawa_settings', JSON.stringify(merged));
      } catch {}
      return merged;
    });
  };

  // Category Management Handlers
  const handleAddCategory = async (newCat) => {
    const slug = newCat.slug ? newCat.slug.trim().toLowerCase().replace(/\s+/g, '-') : ('cat-' + Date.now());
    const catItem = {
      id: newCat.id || ('custom_' + Date.now()),
      name: cleanEmoji(newCat.name.trim()),
      slug: slug,
      icon: newCat.icon || 'steak',
      display_order: categories.length + 1
    };

    setCategories((prev) => [...prev, catItem]);
    try {
      localStorage.setItem('halawa_categories', JSON.stringify([...categories, catItem]));
      await supabase.from('categories').insert([{
        name: catItem.name,
        slug: catItem.slug,
        icon: catItem.icon,
        display_order: catItem.display_order
      }]);
    } catch (err) {
      console.warn('Supabase add category note:', err);
    }
  };

  const handleUpdateCategory = async (catIdentifier, updatedFields) => {
    const sanitizedName = updatedFields.name ? cleanEmoji(updatedFields.name.trim()) : undefined;
    const cleanFields = { ...updatedFields, ...(sanitizedName && { name: sanitizedName }) };

    setCategories((prev) => {
      const updated = prev.map((c) => (c.id === catIdentifier || c.slug === catIdentifier) ? { ...c, ...cleanFields } : c);
      try {
        localStorage.setItem('halawa_categories', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      await supabase
        .from('categories')
        .update(cleanFields)
        .or(`id.eq.${catIdentifier},slug.eq.${catIdentifier}`);
    } catch (err) {
      console.warn('Supabase update category note:', err);
    }
  };

  const handleDeleteCategory = async (catIdentifier) => {
    if (catIdentifier === 'all' || catIdentifier === '1') {
      alert('لا يمكن حذف قسم "الكل" الأساسي.');
      return;
    }

    setCategories((prev) => {
      const updated = prev.filter((c) => c.id !== catIdentifier && c.slug !== catIdentifier);
      try {
        localStorage.setItem('halawa_categories', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      await supabase
        .from('categories')
        .delete()
        .or(`id.eq.${catIdentifier},slug.eq.${catIdentifier}`);
    } catch (err) {
      console.warn('Supabase delete category note:', err);
    }
  };

  // Inactivity Auto-Lock for Admin Dashboard (15 minutes)
  useEffect(() => {
    if (!isAdminRoute || !isAdminAuthenticated) return;

    let timeoutId;
    const resetInactivityTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      // 15 minutes of inactivity triggers security lock
      timeoutId = setTimeout(() => {
        try {
          sessionStorage.removeItem('halawa_admin_session');
        } catch {}
        setIsAdminAuthenticated(false);
        alert('تم قفل جلسة لوحة التحكم تلقائياً لعدم النشاط لحماية بيانات المتجر.');
      }, 15 * 60 * 1000);
    };

    const activityEvents = ['mousemove', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach((evt) => window.addEventListener(evt, resetInactivityTimer, { passive: true }));
    resetInactivityTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      activityEvents.forEach((evt) => window.removeEventListener(evt, resetInactivityTimer));
    };
  }, [isAdminRoute, isAdminAuthenticated]);

  const handleAdminLogout = () => {
    try {
      sessionStorage.removeItem('halawa_admin_session');
      sessionStorage.removeItem('halawa_auth_attempts');
    } catch {}
    setIsAdminAuthenticated(false);
    navigateToStore();
  };

  const navigateToStore = () => {
    window.history.pushState({}, '', '/');
    setIsAdminRoute(false);
  };

  const totalCartCount = cart.length;

  // ROUTE 1: ADMIN DASHBOARD (/admin or #admin)
  if (isAdminRoute) {
    if (!isAdminAuthenticated) {
      return (
        <AdminAuthGuard
          onAuthenticated={() => setIsAdminAuthenticated(true)}
          onReturnToStore={navigateToStore}
          storeSettings={storeSettings}
        />
      );
    }

    return (
      <AdminDashboard
        storeSettings={storeSettings}
        onUpdateSettings={handleUpdateSettings}
        products={products}
        onUpdateProductPrice={handleUpdateProductPrice}
        onUpdateProductImage={handleUpdateProductImage}
        onUpdateFullProduct={handleUpdateFullProduct}
        onDeleteProduct={handleDeleteProduct}
        onToggleStock={handleToggleStock}
        onAddNewProduct={handleAddNewProduct}
        onBatchUpdateProducts={handleBatchUpdateProducts}
        categories={categories}
        onAddCategory={handleAddCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
        onReturnToStore={navigateToStore}
        onLogout={handleAdminLogout}
      />
    );
  }

  // ROUTE 2: CUSTOMER STOREFRONT (/)
  const discountedProductsCount = effectiveProducts.filter((p) => p.hasDiscount).length;

  return (
    <div className="app-container">
      {/* Header */}
      <Header
        cartCount={totalCartCount}
        setIsCartOpen={setIsCartOpen}
        storeSettings={storeSettings}
      />

      {/* Main Store Content */}
      <main className="store-main-content" role="main">
        {/* Promotional Discount Notice Banner when any products have active discounts */}
        {discountedProductsCount > 0 && (
          <aside className="storewide-promo-bar" aria-label="عروض وتخفيضات اللحوم">
            <div className="promo-bar-content">
              <span className="promo-pill">
                <Percent size={14} aria-hidden="true" />
                <span>عروض حلاوة العنتبلي</span>
              </span>
              <strong className="promo-title">
                تخفيضات خاصة سارية الآن مباشرة على {discountedProductsCount} من قطعيات اللحوم البلدية!
              </strong>
            </div>
          </aside>
        )}

        {/* Editorial Hero (Controlled from Admin Dashboard) */}
        {storeSettings?.show_hero_banner !== false && (
          <section className="store-hero" aria-label="مقدمة المتجر">
            <div className="hero-text-side">
              <h2 className="hero-title">
                {storeSettings?.hero_title || 'عارف يعني ايه لحمة ؟!'}
              </h2>
              <p className="hero-desc">
                {storeSettings?.hero_description || 'أصول الجزارة البلدي من قلب المذبح. ننتقي لك أنعم القطعيات الطازجة، ونجهزها بتقطيعك المفضل ونوصلها لباب بيتك مباشرة عبر الواتساب.'}
              </p>
            </div>
          </section>
        )}

        {/* Categories & Search */}
        <CategoryNav
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          productCount={filteredProducts.length}
        />

        {/* Products Grid */}
        <section className="products-grid-section" aria-label="قائمة منتجات اللحوم">
          {filteredProducts.length > 0 ? (
            <div className="products-grid">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelectProduct={(p) => setSelectedProductForModal(p)}
                />
              ))}
            </div>
          ) : (
            <div className="no-products-found" role="status">
              <Search size={36} className="no-prod-icon" aria-hidden="true" />
              <h3>لم نعثر على قطعية بهذا الاسم</h3>
              <p>جرب البحث بكلمة أخرى: فلتو، انتركوت، سجق، موزة، بفتيك، أو كبدة.</p>
              <button
                type="button"
                className="reset-search-btn"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
              >
                عرض جميع الأصناف
              </button>
            </div>
          )}
        </section>

        {/* Floating Mobile Cart Bar when items exist */}
        {totalCartCount > 0 && (
          <aside className="floating-cart-bar" aria-label="شريط سلة التسوق السريع">
            <button
              type="button"
              className="floating-cart-btn"
              onClick={() => setIsCartOpen(true)}
              aria-label={`عرض السلة التي تحتوي على ${totalCartCount} صنف`}
            >
              <div className="floating-info">
                <div className="floating-count tabular-nums">
                  <ShoppingBag size={18} aria-hidden="true" />
                  <span>{totalCartCount} صنف</span>
                </div>
                <span className="floating-label">عربة اللحوم</span>
              </div>

              <div className="floating-action">
                <span>إتمام الطلب عبر الواتساب</span>
                <span className="floating-arrow" aria-hidden="true">←</span>
              </div>
            </button>
          </aside>
        )}

        {/* Footer */}
        <footer className="store-footer" role="contentinfo">
          <img 
            src="/assets/logo.jpg" 
            alt="شعار حلاوة العنتبلي" 
            className="footer-logo"
            width="44"
            height="44"
            loading="lazy"
          />
          <p className="footer-title">{storeSettings.store_name} — {storeSettings.slogan}</p>
          <a
            href={storeSettings?.maps_url || "https://maps.app.goo.gl/koT5YPn28VA48SZU7"}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-maps-link"
            aria-label="موقع فرع جزارة حلاوة العنتبلي على خرائط جوجل"
          >
            <MapPin size={15} aria-hidden="true" />
            <span>مقر الفرع على خرائط Google Maps</span>
          </a>
          <p className="footer-copyright">
            جميع الحقوق محفوظة © {new Date().getFullYear()} • جزارة اللحوم البلدي الأصلية
          </p>
        </footer>
      </main>

      {/* Product Details & Meat Cut Customization Modal */}
      <ProductModal
        product={selectedProductForModal}
        isOpen={Boolean(selectedProductForModal)}
        onClose={() => setSelectedProductForModal(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Slide-over Cart Drawer with WhatsApp Order Confirmation */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        storeSettings={storeSettings}
      />

      {/* PWA Mobile Installation Prompt Banner */}
      <PwaInstallBanner hasCartItems={totalCartCount > 0} />
    </div>
  );
}
