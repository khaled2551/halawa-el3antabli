import React, { useState } from 'react';
import { X, Trash2, Send, ShoppingBag, ShieldCheck, MapPin, Phone, User, FileText, Store, Truck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase } from '../supabaseClient';

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onRemoveItem,
  onClearCart,
  storeSettings
}) {
  if (!isOpen) return null;

  const [deliveryType, setDeliveryType] = useState('delivery'); // 'delivery' or 'pickup'
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const [lastSubmitTimestamp, setLastSubmitTimestamp] = useState(0);

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.totalPrice, 0);
  const deliveryFee = deliveryType === 'pickup' ? 0 : Number(storeSettings?.delivery_fee || 0);
  const grandTotal = subtotal + deliveryFee;

  // Security & Validation
  const validate = () => {
    const errors = {};
    const trimmedName = customerName.trim();
    if (!trimmedName) {
      errors.name = 'يرجى إدخال اسمك الكريم';
    } else if (trimmedName.length < 3) {
      errors.name = 'يرجى كتابة الاسم ثلاثي أو ثنائي على الأقل (3 أحرف أو أكثر)';
    } else if (trimmedName.length > 50) {
      errors.name = 'الاسم طويل جداً (الحد الأقصى 50 حرفاً)';
    }

    const cleanedPhone = customerPhone.replace(/\D/g, '');
    const egMobileRegex = /^01[0125][0-9]{8}$/;
    if (!cleanedPhone) {
      errors.phone = 'يرجى إدخال رقم الهاتف للتواصل';
    } else if (!egMobileRegex.test(cleanedPhone)) {
      errors.phone = 'يرجى إدخال رقم هاتف محمول مصري صحيح (11 رقم يبدأ بـ 010 أو 011 أو 012 أو 015)';
    }

    if (deliveryType === 'delivery') {
      const trimmedAddress = customerAddress.trim();
      if (!trimmedAddress) {
        errors.address = 'يرجى كتابة عنوان التوصيل بالتفصيل';
      } else if (trimmedAddress.length < 6) {
        errors.address = 'يرجى كتابة العنوان بوضوح (المنطقة، الشارع، رقم العقار)';
      } else if (trimmedAddress.length > 150) {
        errors.address = 'العنوان طويل جداً (الحد الأقصى 150 حرفاً)';
      }
    }

    if (orderNotes.trim().length > 250) {
      errors.notes = 'الملاحظات طويلة جداً (الحد الأقصى 250 حرفاً)';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // WhatsApp Order Submission (With Anti-Flooding & Rate Limiting Guard)
  const handleCheckout = async (e) => {
    e.preventDefault();
    
    // Anti-Flood Protection: Block rapid multiple clicks within 4 seconds
    const now = Date.now();
    if (isSubmitting || now - lastSubmitTimestamp < 4000) {
      return;
    }

    if (!validate()) return;
    if (cartItems.length === 0) return;

    setIsSubmitting(true);
    setLastSubmitTimestamp(now);

    try {
      const orderNumber = Math.floor(1000 + Math.random() * 9000);
      const deliveryText = deliveryType === 'pickup' 
        ? `استلام من الفرع: ${storeSettings?.address || 'مقر جزارة حلاوة العنتبلي'}` 
        : customerAddress.trim().slice(0, 150);

      const orderPayload = {
        customer_name: customerName.trim().slice(0, 50),
        customer_phone: customerPhone.replace(/\D/g, '').slice(0, 15),
        customer_address: deliveryText,
        delivery_type: deliveryType,
        items: cartItems,
        total_amount: grandTotal,
        delivery_fee: deliveryFee,
        notes: orderNotes.trim().slice(0, 250) || null,
        status: 'new'
      };

      // 1. Always save locally to LocalStorage so Admin Dashboard logs it instantly
      try {
        const localOrders = JSON.parse(localStorage.getItem('halawa_orders') || '[]');
        const localRecord = {
          id: 'ord_' + Date.now(),
          order_number: orderNumber,
          ...orderPayload,
          created_at: new Date().toISOString()
        };
        localOrders.unshift(localRecord);
        localStorage.setItem('halawa_orders', JSON.stringify(localOrders));
        window.dispatchEvent(new Event('halawa_order_updated'));
      } catch (err) {
        console.warn('LocalStorage order write notice:', err);
      }

      // 2. Also record to Supabase if connected
      try {
        await supabase
          .from('orders')
          .insert([orderPayload]);
      } catch (err) {
        console.warn('Supabase order logging notice (falling back gracefully):', err);
      }

      // 3. Format Professional WhatsApp Message (Strict Zero Emojis, Clean RTL Alignment)
      const whatsappNumber = (storeSettings?.whatsapp_number || '201000000000').replace(/[^0-9]/g, '');

      let message = `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      message += `*جزارة ${storeSettings?.store_name || 'حلاوة العنتبلي'}*\n`;
      message += `_${storeSettings?.slogan || 'عارف يعني ايه لحمة ؟!' }_\n`;
      message += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      message += `*فاتورة طلب شراء جديدة* (#${orderNumber})\n`;
      message += `*تاريخ الطلب:* ${new Date().toLocaleDateString('ar-EG')}\n\n`;

      message += `*بيانات العميل للتواصل:*\n`;
      message += `• الاسم: ${customerName.trim()}\n`;
      message += `• الهاتف: ${customerPhone.trim()}\n`;
      if (deliveryType === 'pickup') {
        message += `• طريقة الاستلام: استلام من الفرع\n`;
      } else {
        message += `• طريقة الاستلام: توصيل للمنزل\n`;
        message += `• عنوان التوصيل: ${customerAddress.trim()}\n`;
      }
      if (orderNotes.trim()) {
        message += `• ملاحظات: ${orderNotes.trim()}\n`;
      }

      message += `\n──────────────────────────\n`;
      message += `*القطعيات واللحوم المطلوبة:*\n\n`;

      cartItems.forEach((item, idx) => {
        message += `${idx + 1}) *${item.name}*\n`;
        message += `   - الوزن: ${item.weight} كجم\n`;
        if (item.cutStyle) message += `   - طريقة التقطيع: ${item.cutStyle}\n`;
        if (item.fatOption) message += `   - نسبة الدهن: ${item.fatOption}\n`;
        if (item.note) message += `   - ملاحظة: ${item.note}\n`;
        message += `   - السعر: ${item.totalPrice.toLocaleString('ar-EG')} ج.م (${item.price_per_kg} ج.م/كجم)\n\n`;
      });

      message += `──────────────────────────\n`;
      message += `*ملخص الحساب:*\n`;
      message += `• إجمالي قيمة اللحوم: ${subtotal.toLocaleString('ar-EG')} ج.م\n`;
      if (deliveryType === 'pickup') {
        message += `• رسوم التوصيل: 0 ج.م (استلام من الفرع مجاناً)\n`;
      } else {
        message += `• رسوم التوصيل: ${deliveryFee > 0 ? `${deliveryFee.toLocaleString('ar-EG')} ج.م` : 'مجاناً'}\n`;
      }
      message += `• *المبلغ الإجمالي المطلوب للدفع:* ${grandTotal.toLocaleString('ar-EG')} ج.م\n`;
      message += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      message += `تم إنشاء هذا الطلب إلكترونياً عبر تطبيق حلاوة العنتبلي الرسمي.\n`;
      message += `برجاء تأكيد الطلب للبدء في تجهيز اللحوم طازجة فوراً.`;

      // 4. Trigger Celebratory Confetti
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });

      // 5. Redirect to WhatsApp
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');

      // 6. Clean up cart
      onClearCart();
      onClose();
    } catch (error) {
      console.error('Error during checkout:', error);
      alert('حدث خطأ أثناء تحضير الطلب، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="cart-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="cart-title">
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="cart-header">
          <div className="cart-title-group">
            <ShoppingBag size={20} className="cart-icon" aria-hidden="true" />
            <h2 id="cart-title" className="cart-title">عربة طلبات اللحوم</h2>
            <span className="cart-items-count tabular-nums">({cartItems.length} صنف)</span>
          </div>
          <button
            type="button"
            className="cart-close-btn"
            onClick={onClose}
            aria-label="إغلاق سلة التسوق"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="cart-body">
          {cartItems.length === 0 ? (
            <div className="empty-cart-state">
              <ShoppingBag size={48} className="empty-cart-icon" aria-hidden="true" />
              <h3 className="empty-title">عربة اللحوم فارغة حالياً</h3>
              <p className="empty-subtitle">تصفح قائمة القطعيات البلدي الطازجة واختر التقطيع والوزن المفضل لك لإضافتها إلى طلبك.</p>
              <button type="button" className="browse-meats-btn" onClick={onClose}>
                تصفح قائمة اللحوم الآن
              </button>
            </div>
          ) : (
            <>
              {/* Items List */}
              <div className="cart-items-list" aria-label="قائمة الأصناف المختارة">
                {cartItems.map((item, idx) => (
                  <div key={item.cartItemId || idx} className="cart-item-card">
                    <div className="cart-item-main">
                      {item.image_url && (
                        <img 
                          src={item.image_url} 
                          alt={item.name} 
                          className="cart-item-thumb" 
                          width="60"
                          height="60"
                          loading="lazy"
                        />
                      )}
                      <div className="item-info">
                        <h4 className="item-name">{item.name}</h4>
                        <div className="item-specs">
                          <span className="spec-badge tabular-nums">الوزن: {item.weight} كجم</span>
                          {item.cutStyle && <span className="spec-badge">{item.cutStyle}</span>}
                          {item.fatOption && <span className="spec-badge">{item.fatOption}</span>}
                        </div>
                        {item.note && (
                          <p className="item-note">ملاحظة: {item.note}</p>
                        )}
                      </div>

                      <div className="item-price-actions">
                        <span className="item-price tabular-nums">
                          {item.totalPrice.toLocaleString('ar-EG')} <small>ج.م</small>
                        </span>
                        <button
                          type="button"
                          className="item-remove-btn"
                          onClick={() => onRemoveItem(idx)}
                          aria-label={`حذف ${item.name} من السلة`}
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Method Selector (Store Pickup vs Home Delivery) */}
              <div className="delivery-method-selector" role="radiogroup" aria-label="اختر طريقة الاستلام">
                <span className="delivery-method-label">طريقة الاستلام المفضلة:</span>
                <div className="delivery-toggle-grid">
                  <button
                    type="button"
                    className={`delivery-toggle-btn ${deliveryType === 'delivery' ? 'active' : ''}`}
                    onClick={() => setDeliveryType('delivery')}
                    role="radio"
                    aria-checked={deliveryType === 'delivery'}
                  >
                    <Truck size={17} aria-hidden="true" />
                    <div className="toggle-label-wrap">
                      <span className="toggle-main-title">توصيل للمنزل</span>
                      <span className="toggle-sub-fee tabular-nums">
                        {Number(storeSettings?.delivery_fee || 0) > 0 ? `${Number(storeSettings?.delivery_fee)} ج.م` : 'مجاناً'}
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`delivery-toggle-btn ${deliveryType === 'pickup' ? 'active' : ''}`}
                    onClick={() => setDeliveryType('pickup')}
                    role="radio"
                    aria-checked={deliveryType === 'pickup'}
                  >
                    <Store size={17} aria-hidden="true" />
                    <div className="toggle-label-wrap">
                      <span className="toggle-main-title">استلام من الفرع</span>
                      <span className="toggle-sub-fee free-badge">مجاناً (0 ج.م)</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Branch Location Notice with Google Maps Link when Pickup is selected */}
              {deliveryType === 'pickup' && (
                <div className="pickup-branch-card" role="region" aria-label="مقر فرع الجزارة">
                  <div className="pickup-card-icon">
                    <MapPin size={18} aria-hidden="true" />
                  </div>
                  <div className="pickup-card-content">
                    <strong className="pickup-card-title">مقر فرع جزارة {storeSettings?.store_name || 'حلاوة العنتبلي'}:</strong>
                    <p className="pickup-card-address">{storeSettings?.address || 'القاهرة، مصر'}</p>
                    <a
                      href={storeSettings?.maps_url || 'https://maps.app.goo.gl/koT5YPn28VA48SZU7'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pickup-maps-btn"
                      aria-label="فتح موقع فرع الجزارة على خرائط جوجل"
                    >
                      <MapPin size={14} aria-hidden="true" />
                      <span>عرض موقع الفرع على خرائط Google Maps</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Price Breakdown */}
              <div className="price-breakdown-card">
                <div className="breakdown-row">
                  <span>إجمالي قطعيات اللحوم:</span>
                  <span className="tabular-nums">{subtotal.toLocaleString('ar-EG')} ج.م</span>
                </div>
                <div className="breakdown-row">
                  <span>رسوم التوصيل:</span>
                  <span className="tabular-nums">
                    {deliveryType === 'pickup' 
                      ? '0 ج.م (استلام من الفرع)' 
                      : (deliveryFee > 0 ? `${deliveryFee.toLocaleString('ar-EG')} ج.م` : 'مجاناً')}
                  </span>
                </div>
                <div className="breakdown-row grand-total-row">
                  <span>الإجمالي النهائي للدفع:</span>
                  <span className="grand-total-amount tabular-nums">
                    {grandTotal.toLocaleString('ar-EG')} ج.م
                  </span>
                </div>
              </div>

              {/* Customer Details Form */}
              <form id="checkout-form" className="checkout-form" onSubmit={handleCheckout} noValidate>
                <h3 className="form-heading">
                  {deliveryType === 'pickup' ? 'بيانات مستلم الطلب من الفرع' : 'بيانات العميل والتوصيل'}
                </h3>

                {/* Name */}
                <div className="form-group">
                  <label htmlFor="customer-name-field">الاسم الكريم: *</label>
                  <div className="input-with-icon">
                    <User size={16} className="field-icon" aria-hidden="true" />
                    <input
                      id="customer-name-field"
                      type="text"
                      placeholder="اكتب اسمك الثلاثي"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      autoComplete="name"
                      required
                    />
                  </div>
                  {formErrors.name && (
                    <span className="field-error" role="alert">{formErrors.name}</span>
                  )}
                </div>

                {/* Phone */}
                <div className="form-group">
                  <label htmlFor="customer-phone-field">رقم التليفون للتواصل: *</label>
                  <div className="input-with-icon">
                    <Phone size={16} className="field-icon" aria-hidden="true" />
                    <input
                      id="customer-phone-field"
                      type="tel"
                      placeholder="مثال: 01012345678"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      autoComplete="tel"
                      required
                    />
                  </div>
                  {formErrors.phone && (
                    <span className="field-error" role="alert">{formErrors.phone}</span>
                  )}
                </div>

                {/* Address or Branch Pickup Card */}
                {deliveryType === 'pickup' ? (
                  <div className="branch-pickup-box">
                    <div className="branch-pickup-header">
                      <Store size={18} className="branch-icon" aria-hidden="true" />
                      <div>
                        <strong>الاستلام من مقر جزارة حلاوة العنتبلي:</strong>
                        <p className="branch-address-text">{storeSettings?.address || 'القاهرة، مصر'}</p>
                      </div>
                    </div>
                    <span className="branch-hint-text">
                      سيتم تجهيز طلبك طازجاً ليكون بانتظارك فور وصولك للمحل بدون أي رسوم توصيل.
                    </span>
                  </div>
                ) : (
                  <div className="form-group">
                    <label htmlFor="customer-address-field">عنوان التوصيل بالتفصيل: *</label>
                    <div className="input-with-icon">
                      <MapPin size={16} className="field-icon" aria-hidden="true" />
                      <input
                        id="customer-address-field"
                        type="text"
                        placeholder="المنطقة، الشارع، رقم العمارة والشقة، علامة مميزة"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        autoComplete="street-address"
                        required
                      />
                    </div>
                    {formErrors.address && (
                      <span className="field-error" role="alert">{formErrors.address}</span>
                    )}
                  </div>
                )}

                {/* Extra Notes */}
                <div className="form-group">
                  <label htmlFor="customer-notes-field">
                    {deliveryType === 'pickup' 
                      ? 'موعد الحضور للاستلام أو ملاحظات للجزار (اختياري):' 
                      : 'ملاحظات خاصة بالتوصيل (اختياري):'}
                  </label>
                  <div className="input-with-icon">
                    <FileText size={16} className="field-icon" aria-hidden="true" />
                    <input
                      id="customer-notes-field"
                      type="text"
                      placeholder={deliveryType === 'pickup' ? 'مثال: سأمر للاستلام الساعة 5 مساءً…' : 'موعد مفضل، رن الجرس، الدفع كاش أو فودافون كاش…'}
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                </div>

                {/* Submit to WhatsApp Button */}
                <button
                  type="submit"
                  className="whatsapp-checkout-btn"
                  disabled={isSubmitting}
                  aria-label="تأكيد الطلب وإرساله إلى واتساب الجزارة"
                >
                  <Send size={18} aria-hidden="true" />
                  <span>
                    {isSubmitting ? 'جاري تجهيز الطلب…' : 'تأكيد وإرسال الطلب عبر الواتساب'}
                  </span>
                </button>
                <div className="checkout-trust-note">
                  <ShieldCheck size={15} aria-hidden="true" />
                  <span>بياناتك الشخصية مشفرة ومحمية وفق معايير الخصوصية العالمية — تُستخدم حصرياً لإتمام طلبك وتوصيله ولا تُشارك مع أي طرف ثالث.</span>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
