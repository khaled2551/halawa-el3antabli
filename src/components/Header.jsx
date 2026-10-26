import React from 'react';
import { ShoppingBag } from 'lucide-react';

export default function Header({ 
  cartCount, 
  setIsCartOpen,
  storeSettings
}) {
  return (
    <header className="header-wrapper" role="banner">
      {/* Top Refined Notice Strip (Fully Managed from Admin Panel) */}
      {storeSettings?.announcement_enabled !== false && storeSettings?.announcement_banner?.trim() && (
        <aside 
          className={`announcement-bar theme-${storeSettings?.announcement_theme || 'crimson'} ${storeSettings?.announcement_ticker ? 'is-ticker' : ''}`}
          aria-label="تنبيهات المتجر"
        >
          <div className="announcement-track">
            <span className="announcement-text">{storeSettings.announcement_banner}</span>
            {storeSettings?.announcement_ticker && (
              <span className="announcement-text ticker-dup" aria-hidden="true">{storeSettings.announcement_banner}</span>
            )}
          </div>
        </aside>
      )}

      {/* Main Header Bar */}
      <div className="main-header">
        <div className="brand-group">
          <img 
            src={storeSettings?.logo_url || '/assets/logo.jpg'} 
            alt={`شعار ${storeSettings?.store_name || 'حلاوة العنتبلي'}`} 
            className="brand-logo"
            width="56"
            height="56"
            loading="eager"
            onError={(e) => {
              e.currentTarget.src = '/assets/logo.jpg';
            }}
          />
          <div className="brand-text">
            <h1 className="brand-title">{storeSettings?.store_name || 'حلاوة العنتبلي'}</h1>
            <p className="brand-slogan">{storeSettings?.slogan || 'عارف يعني ايه لحمة ؟!'}</p>
          </div>
        </div>

        {/* Customer Cart Control */}
        <nav className="header-actions" aria-label="عربة التسوق">
          <button 
            type="button"
            className="cart-btn" 
            onClick={() => setIsCartOpen(true)}
            aria-label={`عربة التسوق تحتوي على ${cartCount} أصناف`}
          >
            <ShoppingBag size={20} aria-hidden="true" />
            {cartCount > 0 && (
              <span className="cart-badge tabular-nums" aria-live="polite">
                {cartCount}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
