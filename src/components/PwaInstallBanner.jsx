import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share2, MoreVertical, CheckCircle2 } from 'lucide-react';

export default function PwaInstallBanner({ hasCartItems = false }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Check if already installed in standalone mode
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Check if user dismissed recently in this session
    if (sessionStorage.getItem('halawa_pwa_dismissed')) {
      return;
    }

    // 3. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;
    setIsIos(isAppleDevice);

    // 4. Capture native beforeinstallprompt (Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show banner after 1.5 seconds gentle delay if not already in standalone
    const timer = setTimeout(() => {
      if (!isStandalone && !sessionStorage.getItem('halawa_pwa_dismissed')) {
        setIsVisible(true);
      }
    }, 1500);

    // Listen for successful app install event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } else {
      // Show bespoke instructions modal
      setShowInstructions(true);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setShowInstructions(false);
    try {
      sessionStorage.setItem('halawa_pwa_dismissed', 'true');
    } catch {}
  };

  if (!isVisible || isInstalled) return null;

  return (
    <>
      <aside 
        className={`pwa-install-banner ${hasCartItems ? 'has-cart-active' : ''}`}
        role="complementary" 
        aria-label="تثبيت تطبيق جزارة حلاوة العنتبلي"
      >
        <div className="pwa-banner-content">
          <div className="pwa-brand-icon">
            <img 
              src="/assets/logo.jpg" 
              alt="شعار تطبيق العنتبلي" 
              className="pwa-logo"
              width="44" 
              height="44"
            />
          </div>

          <div className="pwa-text-group">
            <strong className="pwa-title">تطبيق جزارة حلاوة العنتبلي</strong>
            <p className="pwa-desc">ثبّت التطبيق على شاشة هاتفك للطلب بلمسة واحدة</p>
          </div>

          <div className="pwa-actions-group">
            <button 
              type="button" 
              className="pwa-install-btn"
              onClick={handleInstallClick}
              aria-label="تثبيت تطبيق العنتبلي على الهاتف"
            >
              <Download size={15} aria-hidden="true" />
              <span>تثبيت التطبيق</span>
            </button>

            <button 
              type="button" 
              className="pwa-dismiss-btn"
              onClick={handleDismiss}
              aria-label="إغلاق شريط تثبيت التطبيق"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>

      {/* Manual Installation Instructions Modal (iOS Safari & Android/Chrome fallback) */}
      {showInstructions && (
        <div 
          className="pwa-instructions-overlay" 
          role="dialog" 
          aria-modal="true" 
          aria-label="طريقة تثبيت التطبيق"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowInstructions(false);
          }}
        >
          <div className="pwa-instructions-card">
            <div className="instructions-header">
              <div className="instructions-icon-wrap">
                <Smartphone size={22} className="gold-accent-icon" aria-hidden="true" />
              </div>
              <div className="instructions-title-group">
                <h3>تثبيت تطبيق حلاوة العنتبلي</h3>
                <p>خطوات بسيطة وسريعة لتثبيت التطبيق على جهازك</p>
              </div>
              <button 
                type="button"
                className="instructions-close-btn"
                onClick={() => setShowInstructions(false)}
                aria-label="إغلاق نافذة التعليمات"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {isIos ? (
              /* iOS Safari instructions */
              <ol className="pwa-steps-list">
                <li>
                  <div className="step-num">1</div>
                  <div className="step-content">
                    <p>اضغط على زر <strong>المشاركة</strong> أسفل شاشة Safari:</p>
                    <span className="step-badge">
                      <Share2 size={15} aria-hidden="true" />
                      <span>أيقونة المربع بسهم لأعلى</span>
                    </span>
                  </div>
                </li>
                <li>
                  <div className="step-num">2</div>
                  <div className="step-content">
                    <p>انزل بالقائمة واختر <strong>«إضافة إلى الشاشة الرئيسية»</strong> (Add to Home Screen).</p>
                  </div>
                </li>
                <li>
                  <div className="step-num">3</div>
                  <div className="step-content">
                    <p>اضغط <strong>«إضافة» (Add)</strong> أعلى الشاشة لتثبيت التطبيق فوراً.</p>
                  </div>
                </li>
              </ol>
            ) : (
              /* Android & Desktop Chrome / Edge instructions */
              <ol className="pwa-steps-list">
                <li>
                  <div className="step-num">1</div>
                  <div className="step-content">
                    <p>اضغط على قائمة خيارات المتصفح:</p>
                    <span className="step-badge">
                      <MoreVertical size={15} aria-hidden="true" />
                      <span>الثلاث نقاط (⋮) أعلى الشاشة</span>
                    </span>
                  </div>
                </li>
                <li>
                  <div className="step-num">2</div>
                  <div className="step-content">
                    <p>اختر <strong>«تثبيت التطبيق» (Install App)</strong> أو <strong>«إضافة للشاشة الرئيسية»</strong>.</p>
                  </div>
                </li>
                <li>
                  <div className="step-num">3</div>
                  <div className="step-content">
                    <p>اضغط <strong>«تثبيت»</strong> وسيظهر التطبيق على شاشة موبايلك الرئيسية بأيقونة الجزارة.</p>
                  </div>
                </li>
              </ol>
            )}

            <div className="instructions-footer">
              <button 
                type="button" 
                className="instructions-confirm-btn"
                onClick={() => setShowInstructions(false)}
              >
                <CheckCircle2 size={16} aria-hidden="true" />
                <span>فهمت، شكراً</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
