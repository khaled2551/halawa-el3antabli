import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import CategoryNav from './components/CategoryNav';
import ProductCard from './components/ProductCard';
import ProductModal from './components/ProductModal';
import CartDrawer from './components/CartDrawer';
import AdminDashboard from './components/AdminDashboard';
import AdminAuthGuard from './components/AdminAuthGuard';
import { defaultStoreSettings, defaultCategories, defaultProducts } from './data/defaultProducts';
import { supabase } from './supabaseClient';
import { ShoppingBag, Search, MapPin } from 'lucide-react';

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
      return saved ? JSON.parse(saved) : defaultProducts;
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
          setStoreSettings((prev) => ({
            ...prev,
            ...settingsData,
            store_name: cleanEmoji(settingsData.store_name),
            slogan: cleanEmoji(settingsData.slogan),
            announcement_banner: cleanEmoji(settingsData.announcement_banner)
          }));
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
            badge: null
          }));
          setProducts(sanitizedProds);
        }
      } catch (err) {
        console.warn('Supabase initial fetch info (using robust offline data):', err);
      }
    }

    loadSupabaseData();
  }, []);

  // Filter products by category and search query
  const filteredProducts = products.filter((prod) => {
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

  const handleUpdateSettings = (updated) => {
    setStoreSettings((prev) => {
      const merged = { ...prev, ...updated };
      try {
        localStorage.setItem('halawa_settings', JSON.stringify(merged));
      } catch {}
      return merged;
    });
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
        onReturnToStore={navigateToStore}
        onLogout={handleAdminLogout}
      />
    );
  }

  // ROUTE 2: CUSTOMER STOREFRONT (/)
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
    </div>
  );
}
