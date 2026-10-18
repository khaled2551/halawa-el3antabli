import React from 'react';
import { Search } from 'lucide-react';

export default function CategoryNav({
  categories,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  productCount
}) {
  return (
    <section className="category-section" aria-label="أقسام المنتجات والبحث">
      {/* Clean Typographic Category Tabs (No Icons, No Clutter per Taste-Skill) */}
      <nav className="categories-pills" aria-label="تصنيفات اللحوم">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.slug;
          return (
            <button
              key={cat.id || cat.slug}
              type="button"
              className={`pill-btn ${isSelected ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.slug)}
              aria-pressed={isSelected}
            >
              <span>{cat.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Understated Search Bar */}
      <div className="search-box">
        <label htmlFor="search-input" className="visually-hidden">البحث في الأصناف والقطعيات</label>
        <Search size={16} className="search-icon" aria-hidden="true" />
        <input
          id="search-input"
          type="search"
          placeholder="ابحث بالاسم: فلتو، انتركوت، سجق، موزة، بفتيك، كبدة…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        {searchQuery && (
          <button
            type="button"
            className="clear-search-btn"
            onClick={() => setSearchQuery('')}
            aria-label="مسح نص البحث"
          >
            ×
          </button>
        )}
      </div>

      {/* Results Count Line */}
      <div className="results-indicator" aria-live="polite">
        <span>عرض {productCount} صنفاً طازجاً اليوم</span>
      </div>
    </section>
  );
}
