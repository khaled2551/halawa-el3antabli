import React from 'react';
import { ShoppingBag } from 'lucide-react';

export default function Header({ 
  cartCount, 
  setIsCartOpen,
  storeSettings
}) {
  return (
    <header className="header-wrapper" role="banner">
      {/* Top Refined Notice Strip - No Emojis, No Clutter */}
      {storeSettings?.announcement_banner && (
        <aside className="announcement-bar" aria-label="تنبيهات المتجر">
          <span>{storeSettings.announcement_banner}</span>
        </aside>
      )}

      {/* Main Header Bar */}
      <div className="main-header">
        <div className="brand-group">
          <img 
            src="/assets/logo.jpg" 
            alt="شعار جزارة حلاوة العنتبلي" 
            className="brand-logo"
            width="56"
            height="56"
            loading="eager"
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
