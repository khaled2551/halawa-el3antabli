import React from 'react';
import { Plus } from 'lucide-react';

export default function ProductCard({ product, onSelectProduct }) {
  const isAvailable = product.is_in_stock !== false;
  const hasCutting = product.has_cutting_options !== false && Boolean(product.available_cuts && product.available_cuts.length > 0);

  return (
    <article className={`product-card ${!isAvailable ? 'out-of-stock' : ''}`} aria-labelledby={`prod-title-${product.id}`}>
      {/* Meat Cut Photography with Visual Discount Ribbon */}
      {product.image_url && (
        <div className="product-image-frame">
          <img
            src={product.image_url}
            alt={product.name}
            className="product-photo"
            loading="lazy"
            width="480"
            height="270"
          />
          {product.hasDiscount && (
            <span className="photo-discount-badge" aria-label={`خصم ${product.discountPercent} بالمئة`}>
              خصم {product.discountPercent}%
            </span>
          )}
        </div>
      )}

      <div className="product-card-body">
        {/* Title and Price Hierarchy */}
        <div className="product-card-top">
          <div className="title-area">
            <h2 id={`prod-title-${product.id}`} className="product-name">
              {product.name}
            </h2>
            {product.english_name && (
              <span className="product-english-name" lang="en">{product.english_name}</span>
            )}
          </div>

          {/* Clean Price Presentation with Strikethrough Discount Support */}
          {product.hasDiscount ? (
            <div className="price-tag-wrapper has-discount">
              <span className="product-card-discount-badge" aria-label={`خصم ${product.discountPercent} بالمئة`}>
                خصم {product.discountPercent}%
              </span>
              <span className="original-price-strikethrough tabular-nums">
                {Number(product.originalPrice).toLocaleString('ar-EG')} ج.م
              </span>
              <div className="active-discount-price-row">
                <span className="price-number discounted tabular-nums">
                  {Number(product.finalPrice).toLocaleString('ar-EG')}
                </span>
                <span className="price-unit">ج.م / كجم</span>
              </div>
            </div>
          ) : (
            <div className="price-tag-wrapper">
              <span className="price-number tabular-nums">{Number(product.price_per_kg).toLocaleString('ar-EG')}</span>
              <span className="price-unit">ج.م / كجم</span>
            </div>
          )}
        </div>

        {/* Culinary Description */}
        {product.description && (
          <p className="product-description">{product.description}</p>
        )}

        {/* Cuts Summary (Only shown if product has cutting options) */}
        {hasCutting && (
          <div className="cuts-preview" aria-label="خيارات التقطيع المتاحة">
            <span className="cuts-label">التقطيع المتاح:</span>
            <span className="cuts-list">
              {product.available_cuts.slice(0, 3).join(' • ')}
              {product.available_cuts.length > 3 && ' …'}
            </span>
          </div>
        )}

        {/* Action Button */}
        <div className="product-card-footer">
          {isAvailable ? (
            <button
              type="button"
              className="customize-btn"
              onClick={() => onSelectProduct(product)}
              aria-label={hasCutting ? `تحديد وزن وتقطيع ${product.name}` : `تحديد وزن ${product.name}`}
            >
              <Plus size={16} aria-hidden="true" />
              <span>{hasCutting ? 'تحديد التقطيع والوزن' : 'تحديد الوزن والطلب'}</span>
            </button>
          ) : (
            <div className="out-of-stock-label" aria-live="polite">
              غير متوفر لليوم
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
