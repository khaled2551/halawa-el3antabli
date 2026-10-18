import React, { useState } from 'react';
import { X, Check, ShoppingBag, Plus, Minus, Scale, Scissors, SlidersHorizontal } from 'lucide-react';

export default function ProductModal({ product, isOpen, onClose, onAddToCart }) {
  if (!isOpen || !product) return null;

  const defaultWeights = [0.25, 0.5, 1, 1.5, 2, 3];
  const [weight, setWeight] = useState(1);
  const [selectedCut, setSelectedCut] = useState(
    product.available_cuts?.[0] || 'قطعة واحدة متماسكة'
  );
  const [selectedFat, setSelectedFat] = useState(
    product.fat_options?.[0] || 'أحمر صافي'
  );
  const [customNote, setCustomNote] = useState('');

  const activePricePerKg = product.hasDiscount ? Number(product.finalPrice) : Number(product.price_per_kg);
  const baseOriginalPricePerKg = product.hasDiscount ? Number(product.originalPrice) : activePricePerKg;
  const totalPrice = Math.round(activePricePerKg * weight);
  const originalTotalPrice = Math.round(baseOriginalPricePerKg * weight);

  const handleWeightStep = (increment) => {
    setWeight((prev) => {
      const next = Math.max(0.25, Number((prev + increment).toFixed(2)));
      return next;
    });
  };

  const handleAdd = () => {
    onAddToCart({
      productId: product.id,
      name: product.name,
      english_name: product.english_name,
      image_url: product.image_url,
      price_per_kg: activePricePerKg,
      original_price_per_kg: baseOriginalPricePerKg,
      has_discount: Boolean(product.hasDiscount),
      discount_percent: product.discountPercent || 0,
      discount_title: product.discountTitle || '',
      weight: weight,
      cutStyle: selectedCut,
      fatOption: selectedFat,
      note: customNote.trim(),
      totalPrice: totalPrice,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-prod-title">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Top Image if exists */}
        {product.image_url && (
          <div className="modal-image-header">
            <img 
              src={product.image_url} 
              alt={product.name} 
              className="modal-photo" 
              loading="lazy"
              width="500"
              height="200"
            />
            <button 
              type="button" 
              className="modal-close-floating-btn" 
              onClick={onClose}
              aria-label="إغلاق النافذة"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h2 id="modal-prod-title" className="modal-title">{product.name}</h2>
            {product.english_name && (
              <span className="modal-subtitle" lang="en">{product.english_name}</span>
            )}
            <div className="modal-price-display-strip">
              {product.hasDiscount ? (
                <>
                  <span className="modal-original-price tabular-nums">
                    {Number(product.originalPrice).toLocaleString('ar-EG')} ج.م
                  </span>
                  <span className="modal-active-price tabular-nums">
                    {Number(product.finalPrice).toLocaleString('ar-EG')} ج.م / كجم
                  </span>
                  <span className="modal-discount-tag">خصم {product.discountPercent}%</span>
                </>
              ) : (
                <span className="modal-active-price tabular-nums">
                  {Number(product.price_per_kg).toLocaleString('ar-EG')} ج.م / كجم
                </span>
              )}
            </div>
          </div>
          {!product.image_url && (
            <button 
              type="button" 
              className="modal-close-btn" 
              onClick={onClose}
              aria-label="إغلاق النافذة"
            >
              <X size={18} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Weight Selection Section */}
          <section className="modal-section" aria-labelledby="section-weight-title">
            <div className="section-label-row">
              <span id="section-weight-title" className="section-title">
                <Scale size={15} className="section-icon" aria-hidden="true" />
                <span>الوزن المطلوب:</span>
              </span>
              <span className="weight-display tabular-nums">{weight} كجم</span>
            </div>

            {/* Quick Weight Chips */}
            <div className="weight-chips-grid">
              {defaultWeights.map((w) => {
                const isSelected = weight === w;
                return (
                  <button
                    key={w}
                    type="button"
                    className={`weight-chip ${isSelected ? 'active' : ''}`}
                    onClick={() => setWeight(w)}
                    aria-pressed={isSelected}
                  >
                    <span className="tabular-nums">{w}</span> كجم
                    {w === 0.25 && ' (ربع)'}
                    {w === 0.5 && ' (نصف)'}
                    {w === 1 && ' (كيلو)'}
                  </button>
                );
              })}
            </div>

            {/* Stepper for custom weights */}
            <div className="weight-stepper-row">
              <span className="stepper-label">أو اضبط الوزن بدقة:</span>
              <div className="stepper-controls">
                <button
                  type="button"
                  className="step-btn"
                  onClick={() => handleWeightStep(-0.25)}
                  disabled={weight <= 0.25}
                  aria-label="إنقاص الوزن ربع كيلو"
                >
                  <Minus size={15} aria-hidden="true" />
                </button>
                <span className="stepper-value tabular-nums">{weight} كجم</span>
                <button
                  type="button"
                  className="step-btn"
                  onClick={() => handleWeightStep(0.25)}
                  aria-label="زيادة الوزن ربع كيلو"
                >
                  <Plus size={15} aria-hidden="true" />
                </button>
              </div>
            </div>
          </section>

          {/* Cutting Style Section */}
          {product.available_cuts && product.available_cuts.length > 0 && (
            <section className="modal-section" aria-labelledby="section-cuts-title">
              <span id="section-cuts-title" className="section-title">
                <Scissors size={15} className="section-icon" aria-hidden="true" />
                <span>طريقة التقطيع:</span>
              </span>
              <div className="options-grid">
                {product.available_cuts.map((cut) => {
                  const isSelected = selectedCut === cut;
                  return (
                    <button
                      key={cut}
                      type="button"
                      className={`option-btn ${isSelected ? 'active' : ''}`}
                      onClick={() => setSelectedCut(cut)}
                      aria-pressed={isSelected}
                    >
                      {isSelected && <Check size={13} className="check-icon" aria-hidden="true" />}
                      <span>{cut}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Fat Ratio Section */}
          {product.fat_options && product.fat_options.length > 0 && (
            <section className="modal-section" aria-labelledby="section-fat-title">
              <span id="section-fat-title" className="section-title">
                <SlidersHorizontal size={15} className="section-icon" aria-hidden="true" />
                <span>نسبة الدهن:</span>
              </span>
              <div className="options-grid">
                {product.fat_options.map((fat) => {
                  const isSelected = selectedFat === fat;
                  return (
                    <button
                      key={fat}
                      type="button"
                      className={`option-btn ${isSelected ? 'active' : ''}`}
                      onClick={() => setSelectedFat(fat)}
                      aria-pressed={isSelected}
                    >
                      {isSelected && <Check size={13} className="check-icon" aria-hidden="true" />}
                      <span>{fat}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Special Notes */}
          <section className="modal-section">
            <label htmlFor="custom-notes-input" className="section-title">ملاحظات خاصة للجزار (اختياري):</label>
            <input
              id="custom-notes-input"
              type="text"
              placeholder="مثال: تقطيع رقيق للستيك، أو بهارات خفيفة…"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              autoComplete="off"
            />
          </section>
        </div>

        {/* Modal Footer CTA */}
        <div className="modal-footer">
          <div className="total-calculation">
            <span className="calc-label">إجمالي السعر:</span>
            <div className="calc-amounts-wrap">
              {product.hasDiscount && (
                <span className="calc-original-strikethrough tabular-nums">
                  {originalTotalPrice.toLocaleString('ar-EG')} ج.م
                </span>
              )}
              <span className="calc-amount tabular-nums">
                {totalPrice.toLocaleString('ar-EG')} <small>ج.م</small>
              </span>
            </div>
            {product.hasDiscount && (
              <span className="calc-saved-hint tabular-nums">
                (توفير {(originalTotalPrice - totalPrice).toLocaleString('ar-EG')} ج.م)
              </span>
            )}
          </div>

          <button
            type="button"
            className="confirm-add-btn"
            onClick={handleAdd}
            aria-label={`إضافة ${weight} كجم من ${product.name} بإجمالي ${totalPrice} جنيه`}
          >
            <ShoppingBag size={17} aria-hidden="true" />
            <span>إضافة للسلة</span>
          </button>
        </div>
      </div>
    </div>
  );
}
