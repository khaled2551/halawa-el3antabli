import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Package, 
  ShoppingBag, 
  Save, 
  Plus, 
  Check, 
  X,
  Phone, 
  Store, 
  Search, 
  Truck,
  Image as ImageIcon,
  ExternalLink,
  RefreshCw,
  Sliders,
  DollarSign,
  Trash2,
  Clock,
  CheckCircle2,
  MapPin,
  Upload,
  Eye,
  EyeOff,
  Sparkles,
  FileUp,
  AlertCircle,
  Edit2,
  ImageOff,
  LogOut,
  ShieldCheck,
  FolderTree,
  Percent,
  Tag,
  Calendar
} from 'lucide-react';
import { supabase, uploadProductImage, deleteProductImage } from '../supabaseClient';
import { computePinHash } from './AdminAuthGuard';
import { isDiscountActive, isProductDiscountTimeValid, calculateProductDiscount } from '../data/defaultProducts';

export default function AdminDashboard({
  storeSettings,
  onUpdateSettings,
  products,
  onUpdateProductPrice,
  onUpdateProductImage,
  onUpdateFullProduct,
  onDeleteProduct,
  onToggleStock,
  onAddNewProduct,
  onBatchUpdateProducts,
  categories = [],
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onReturnToStore,
  onLogout
}) {
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'categories', 'discounts', 'orders', 'settings'
  
  // Category Management State
  const [isAddCatModalOpen, setIsAddCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatSlug, setEditCatSlug] = useState('');

  // Per-Product Discount Management State
  const [selectedDiscountProdIds, setSelectedDiscountProdIds] = useState([]);
  const [customDiscountMap, setCustomDiscountMap] = useState({}); // { [productId]: { percent: number, startDate: string, endDate: string } }
  const [discountProdSearch, setDiscountProdSearch] = useState('');
  const [discountCatFilter, setDiscountCatFilter] = useState('all');
  const [batchDiscountPercent, setBatchDiscountPercent] = useState(10);
  const [batchDiscountStartDate, setBatchDiscountStartDate] = useState('');
  const [batchDiscountEndDate, setBatchDiscountEndDate] = useState('');
  const [isApplyingDiscounts, setIsApplyingDiscounts] = useState(false);
  const [discountActionFeedback, setDiscountActionFeedback] = useState(null);

  // Edit Product Modal Discount & Cutting State
  const [editProdDiscountEnabled, setEditProdDiscountEnabled] = useState(false);
  const [editProdDiscountPercent, setEditProdDiscountPercent] = useState(10);
  const [editProdDiscountStartDate, setEditProdDiscountStartDate] = useState('');
  const [editProdDiscountEndDate, setEditProdDiscountEndDate] = useState('');
  const [editProdHasCutting, setEditProdHasCutting] = useState(true);
  const [editProdCuts, setEditProdCuts] = useState([]);
  const [editProdCutInput, setEditProdCutInput] = useState('');
  
  // Settings Form State (Comprehensive Control Center)
  const [whatsappNumber, setWhatsappNumber] = useState(storeSettings?.whatsapp_number || '201000000000');
  const [storeName, setStoreName] = useState(storeSettings?.store_name || 'حلاوة العنتبلي');
  const [slogan, setSlogan] = useState(storeSettings?.slogan || 'عارف يعني ايه لحمة ؟!');
  const [storeAddress, setStoreAddress] = useState(storeSettings?.address || 'القاهرة، مصر');
  const [mapsUrl, setMapsUrl] = useState(storeSettings?.maps_url || 'https://maps.app.goo.gl/koT5YPn28VA48SZU7');
  const [logoUrl, setLogoUrl] = useState(storeSettings?.logo_url || '/assets/logo.jpg');
  const [deliveryFee, setDeliveryFee] = useState(storeSettings?.delivery_fee ?? 30);
  const [minOrderAmount, setMinOrderAmount] = useState(storeSettings?.min_order_amount ?? 0);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(storeSettings?.free_delivery_threshold ?? 0);
  const [announcement, setAnnouncement] = useState(storeSettings?.announcement_banner || '');
  const [announcementEnabled, setAnnouncementEnabled] = useState(storeSettings?.announcement_enabled !== false);
  const [announcementTheme, setAnnouncementTheme] = useState(storeSettings?.announcement_theme || 'crimson');
  const [announcementTicker, setAnnouncementTicker] = useState(storeSettings?.announcement_ticker || false);
  const [isStoreOpen, setIsStoreOpen] = useState(storeSettings?.is_store_open ?? true);
  const [storeClosedMessage, setStoreClosedMessage] = useState(storeSettings?.store_closed_message || 'المتجر مغلق حالياً، نستقبل طلباتكم غداً بدءاً من الساعة 9 صباحاً.');
  const [showHeroBanner, setShowHeroBanner] = useState(storeSettings?.show_hero_banner !== false);
  const [heroBadge, setHeroBadge] = useState(storeSettings?.hero_badge || 'جزارة بلدي 100% — ذبح يومي معتمد');
  const [heroTitle, setHeroTitle] = useState(storeSettings?.hero_title || 'عارف يعني ايه لحمة ؟!');
  const [heroDescription, setHeroDescription] = useState(
    storeSettings?.hero_description || 'أصول الجزارة البلدي من قلب المذبح. ننتقي لك أنعم القطعيات الطازجة، ونجهزها بتقطيعك المفضل ونوصلها لباب بيتك مباشرة عبر الواتساب.'
  );
  const [showPromoBanner, setShowPromoBanner] = useState(storeSettings?.show_promo_banner !== false);
  const [promoBannerCustomText, setPromoBannerCustomText] = useState(storeSettings?.promo_banner_custom_text || '');
  const [settingsSavedMessage, setSettingsSavedMessage] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinChangeFeedback, setPinChangeFeedback] = useState('');

  // Products Management State
  const [productSearch, setProductSearch] = useState('');
  const [editingPrices, setEditingPrices] = useState({});
  const [editingImages, setEditingImages] = useState({});
  const [uploadingRowImage, setUploadingRowImage] = useState({});
  const [saveStatus, setSaveStatus] = useState({});

  // Edit Product Modal State
  const [editingProductModal, setEditingProductModal] = useState(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdEnglish, setEditProdEnglish] = useState('');
  const [editProdPrice, setEditProdPrice] = useState('');
  const [editProdCategory, setEditProdCategory] = useState('premium-steaks');
  const [editProdDesc, setEditProdDesc] = useState('');
  const [editProdImage, setEditProdImage] = useState('');
  const [editProdImageFile, setEditProdImageFile] = useState(null);
  const [editProdImagePreview, setEditProdImagePreview] = useState(null);
  const [isSavingEditProd, setIsSavingEditProd] = useState(false);

  // Add Product Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdEnglish, setNewProdEnglish] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('premium-steaks');
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdImageFile, setNewProdImageFile] = useState(null);
  const [newProdImagePreview, setNewProdImagePreview] = useState(null);
  const [isUploadingNewProd, setIsUploadingNewProd] = useState(false);
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdHasCutting, setNewProdHasCutting] = useState(true);
  const [newProdCuts, setNewProdCuts] = useState(['قطع كباب حلة', 'مكعبات خضار', 'سلق للشوربة']);
  const [newProdCutInput, setNewProdCutInput] = useState('');

  // Orders State (Loaded immediately from LocalStorage + Supabase sync)
  const [orders, setOrders] = useState(() => {
    try {
      const local = localStorage.getItem('halawa_orders');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  });
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Sync settings state when prop changes
  useEffect(() => {
    if (storeSettings) {
      setWhatsappNumber(storeSettings.whatsapp_number || '201000000000');
      setStoreName(storeSettings.store_name || 'حلاوة العنتبلي');
      setSlogan(storeSettings.slogan || 'عارف يعني ايه لحمة ؟!');
      setStoreAddress(storeSettings.address || 'القاهرة، مصر');
      setMapsUrl(storeSettings.maps_url || 'https://maps.app.goo.gl/koT5YPn28VA48SZU7');
      setLogoUrl(storeSettings.logo_url || '/assets/logo.jpg');
      setDeliveryFee(storeSettings.delivery_fee ?? 30);
      setMinOrderAmount(storeSettings.min_order_amount ?? 0);
      setFreeDeliveryThreshold(storeSettings.free_delivery_threshold ?? 0);
      setAnnouncement(storeSettings.announcement_banner || '');
      setAnnouncementEnabled(storeSettings.announcement_enabled !== false);
      setAnnouncementTheme(storeSettings.announcement_theme || 'crimson');
      setAnnouncementTicker(storeSettings.announcement_ticker || false);
      setIsStoreOpen(storeSettings.is_store_open ?? true);
      setStoreClosedMessage(storeSettings.store_closed_message || 'المتجر مغلق حالياً، نستقبل طلباتكم غداً بدءاً من الساعة 9 صباحاً.');
      setShowHeroBanner(storeSettings.show_hero_banner !== false);
      setHeroBadge(storeSettings.hero_badge || 'جزارة بلدي 100% — ذبح يومي معتمد');
      setHeroTitle(storeSettings.hero_title || 'عارف يعني ايه لحمة ؟!');
      setHeroDescription(
        storeSettings.hero_description || 'أصول الجزارة البلدي من قلب المذبح. ننتقي لك أنعم القطعيات الطازجة، ونجهزها بتقطيعك المفضل ونوصلها لباب بيتك مباشرة عبر الواتساب.'
      );
      setShowPromoBanner(storeSettings.show_promo_banner !== false);
      setPromoBannerCustomText(storeSettings.promo_banner_custom_text || '');
    }
  }, [storeSettings]);

  // Fetch orders from LocalStorage + Supabase
  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      let mergedOrders = [];
      try {
        const local = localStorage.getItem('halawa_orders');
        if (local) mergedOrders = JSON.parse(local);
      } catch {}

      try {
        const { data } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (data && data.length > 0) {
          const existingIds = new Set(data.map((o) => o.order_number || o.id));
          const localOnly = mergedOrders.filter((o) => !existingIds.has(o.order_number || o.id));
          mergedOrders = [...data, ...localOnly];
        }
      } catch (sbErr) {
        console.warn('Supabase orders fetch notice:', sbErr);
      }

      setOrders(mergedOrders);
    } catch (err) {
      console.warn('Orders fetch error:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const handleOrderEvent = () => fetchOrders();
    window.addEventListener('halawa_order_updated', handleOrderEvent);
    return () => window.removeEventListener('halawa_order_updated', handleOrderEvent);
  }, [activeTab]);

  // Explicitly update order status (new, preparing, delivered)
  const handleSetOrderStatus = async (orderId, targetStatus) => {
    const updated = orders.map((o) => ((o.id === orderId || o.order_number === orderId) ? { ...o, status: targetStatus } : o));
    setOrders(updated);
    try {
      localStorage.setItem('halawa_orders', JSON.stringify(updated));
      await supabase.from('orders').update({ status: targetStatus }).eq('id', orderId);
    } catch (err) {
      console.warn('Set order status notice:', err);
    }
  };

  // Delete single order cleanly from local storage and Supabase
  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('هل تريد مسح هذا الطلب نهائياً من السجل؟')) return;
    const updated = orders.filter((o) => o.id !== orderId && o.order_number !== orderId);
    setOrders(updated);
    try {
      localStorage.setItem('halawa_orders', JSON.stringify(updated));
      await supabase.from('orders').delete().eq('id', orderId);
    } catch (err) {
      console.warn('Delete order notice:', err);
    }
  };

  // Per-Product Discount Actions (Supports both Individual custom % and Batch %)
  const handleToggleSelectProduct = (productId) => {
    setSelectedDiscountProdIds((prev) => {
      const isCurrentlySelected = prev.includes(productId);
      if (isCurrentlySelected) {
        return prev.filter((id) => id !== productId);
      } else {
        // Initialize custom discount for this product if not already customized
        const targetProd = products.find((p) => p.id === productId);
        setCustomDiscountMap((currMap) => {
          if (currMap[productId]) return currMap;
          const initialPct = targetProd?.discount_percent 
            ? Number(targetProd.discount_percent) 
            : (Number(batchDiscountPercent) || 10);
          return {
            ...currMap,
            [productId]: {
              percent: initialPct,
              startDate: batchDiscountStartDate || '',
              endDate: batchDiscountEndDate || ''
            }
          };
        });
        return [...prev, productId];
      }
    });
  };

  const handleCustomDiscountChange = (productId, rawVal) => {
    const val = Math.max(1, Math.min(90, Number(rawVal) || 0));
    setCustomDiscountMap((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || { startDate: batchDiscountStartDate, endDate: batchDiscountEndDate }),
        percent: val
      }
    }));
  };

  const handleStepCustomDiscount = (productId, delta) => {
    const current = customDiscountMap[productId]?.percent ?? (Number(batchDiscountPercent) || 10);
    const nextVal = Math.max(1, Math.min(90, current + delta));
    handleCustomDiscountChange(productId, nextVal);
  };

  const handleSelectAllFiltered = (filteredList) => {
    const ids = filteredList.map((p) => p.id);
    setSelectedDiscountProdIds(ids);
    setCustomDiscountMap((currMap) => {
      const nextMap = { ...currMap };
      filteredList.forEach((p) => {
        if (!nextMap[p.id]) {
          nextMap[p.id] = {
            percent: p.discount_percent ? Number(p.discount_percent) : (Number(batchDiscountPercent) || 10),
            startDate: batchDiscountStartDate || '',
            endDate: batchDiscountEndDate || ''
          };
        }
      });
      return nextMap;
    });
  };

  const handleDeselectAll = () => {
    setSelectedDiscountProdIds([]);
  };

  const handleApplyBatchPctToAllSelected = () => {
    const pct = Number(batchDiscountPercent) || 10;
    setCustomDiscountMap((prev) => {
      const next = { ...prev };
      selectedDiscountProdIds.forEach((id) => {
        next[id] = {
          ...(next[id] || {}),
          percent: pct,
          startDate: batchDiscountStartDate || '',
          endDate: batchDiscountEndDate || ''
        };
      });
      return next;
    });
    setDiscountActionFeedback({
      type: 'info',
      text: `تم ضبط نسبة ${pct}% لكافة الأصناف المحددة (${selectedDiscountProdIds.length} صنف). اضغط "حفظ وتطبيق الخصومات" بالأسفل لاعتمادها.`
    });
    setTimeout(() => setDiscountActionFeedback(null), 3500);
  };

  // Quick update for products in Section 1 (currently discounted)
  const handleQuickUpdateActiveDiscount = async (productId, newPct) => {
    const targetProd = products.find((p) => p.id === productId);
    if (!targetProd) return;
    const validatedPct = Math.max(1, Math.min(90, Number(newPct) || 10));

    const updated = {
      ...targetProd,
      discount_percent: validatedPct
    };

    if (onBatchUpdateProducts) {
      onBatchUpdateProducts([updated]);
    } else if (onUpdateFullProduct) {
      onUpdateFullProduct(productId, { discount_percent: validatedPct });
    }

    try {
      await supabase
        .from('products')
        .update({ discount_percent: validatedPct })
        .eq('id', productId);
    } catch (err) {
      console.warn('Quick update active discount supabase notice:', err);
    }

    setDiscountActionFeedback({
      type: 'success',
      text: `تم تحديث نسبة خصم "${targetProd.name}" إلى ${validatedPct}% فوراً!`
    });
    setTimeout(() => setDiscountActionFeedback(null), 3500);
  };

  // Apply discount to selected individual products (each with its own custom percentage)
  const handleApplyDiscountToSelected = async (e) => {
    if (e) e.preventDefault();
    if (selectedDiscountProdIds.length === 0) {
      alert('يرجى تحديد صنف واحد على الأقل من القائمة لتطبيق الخصم عليه.');
      return;
    }

    setIsApplyingDiscounts(true);
    try {
      const updatedProducts = products
        .filter((p) => selectedDiscountProdIds.includes(p.id))
        .map((p) => {
          const custom = customDiscountMap[p.id];
          const pct = custom?.percent !== undefined 
            ? Number(custom.percent) 
            : (Number(batchDiscountPercent) || 10);
          const sDate = (custom?.startDate !== undefined ? custom.startDate : batchDiscountStartDate) || null;
          const eDate = (custom?.endDate !== undefined ? custom.endDate : batchDiscountEndDate) || null;

          return {
            ...p,
            discount_percent: pct,
            discount_start_date: sDate,
            discount_end_date: eDate
          };
        });

      if (onBatchUpdateProducts) {
        onBatchUpdateProducts(updatedProducts);
      }

      // Sync each updated product with Supabase
      try {
        await Promise.all(
          updatedProducts.map((p) =>
            supabase
              .from('products')
              .update({
                discount_percent: p.discount_percent,
                discount_start_date: p.discount_start_date,
                discount_end_date: p.discount_end_date
              })
              .eq('id', p.id)
          )
        );
      } catch (sbErr) {
        console.warn('Batch discount supabase sync notice:', sbErr);
      }

      setSelectedDiscountProdIds([]);
      setDiscountActionFeedback({
        type: 'success',
        text: `تم بنجاح حفظ وتطبيق الخصومات بنسبها المحددة على (${updatedProducts.length}) صنف دفعة واحدة!`
      });
      setTimeout(() => setDiscountActionFeedback(null), 4000);
    } catch (err) {
      console.error('Error applying batch discount:', err);
      alert('حدث خطأ أثناء تطبيق الخصومات: ' + (err.message || ''));
    } finally {
      setIsApplyingDiscounts(false);
    }
  };

  // Remove discount from single product
  const handleRemoveDiscountFromProduct = async (productId) => {
    const targetProd = products.find((p) => p.id === productId);
    if (!targetProd) return;

    const updated = {
      ...targetProd,
      discount_percent: null,
      discount_start_date: null,
      discount_end_date: null
    };

    if (onBatchUpdateProducts) {
      onBatchUpdateProducts([updated]);
    } else if (onUpdateFullProduct) {
      onUpdateFullProduct(productId, {
        discount_percent: null,
        discount_start_date: null,
        discount_end_date: null
      });
    }

    try {
      await supabase
        .from('products')
        .update({
          discount_percent: null,
          discount_start_date: null,
          discount_end_date: null
        })
        .eq('id', productId);
    } catch (err) {
      console.warn('Remove discount supabase notice:', err);
    }

    setDiscountActionFeedback({
      type: 'info',
      text: `تم إلغاء الخصم عن صنف "${targetProd.name}" وعاد لسعره الأصلي.`
    });
    setTimeout(() => setDiscountActionFeedback(null), 3500);
  };

  // Remove discount from all products
  const handleRemoveAllProductDiscounts = async () => {
    const discounted = products.filter((p) => p.discount_percent && Number(p.discount_percent) > 0);
    if (discounted.length === 0) return;

    if (!window.confirm(`هل أنت متأكد من إلغاء الخصومات عن كافة الأصناف (${discounted.length} صنف)؟`)) {
      return;
    }

    setIsApplyingDiscounts(true);
    try {
      const resetProds = discounted.map((p) => ({
        ...p,
        discount_percent: null,
        discount_start_date: null,
        discount_end_date: null
      }));

      if (onBatchUpdateProducts) {
        onBatchUpdateProducts(resetProds);
      }

      try {
        await Promise.all(
          resetProds.map((p) =>
            supabase
              .from('products')
              .update({
                discount_percent: null,
                discount_start_date: null,
                discount_end_date: null
              })
              .eq('id', p.id)
          )
        );
      } catch (sbErr) {
        console.warn('Reset all discounts Supabase notice:', sbErr);
      }

      setDiscountActionFeedback({
        type: 'info',
        text: `تم إلغاء الخصومات عن جميع الأصناف بنجاح.`
      });
      setTimeout(() => setDiscountActionFeedback(null), 4000);
    } catch (err) {
      console.error('Error removing all discounts:', err);
    } finally {
      setIsApplyingDiscounts(false);
    }
  };

  // Handle Add Category Submit
  const handleAddCategorySubmit = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const slug = newCatSlug.trim() || newCatName.trim().toLowerCase().replace(/\s+/g, '-');
    if (onAddCategory) {
      onAddCategory({
        name: newCatName.trim(),
        slug: slug,
        icon: 'steak'
      });
    }
    setNewCatName('');
    setNewCatSlug('');
    setIsAddCatModalOpen(false);
  };

  // Handle Edit Category Submit
  const handleEditCategorySubmit = (e) => {
    e.preventDefault();
    if (!editingCategory || !editCatName.trim()) return;
    if (onUpdateCategory) {
      onUpdateCategory(editingCategory.id || editingCategory.slug, {
        name: editCatName.trim(),
        slug: editCatSlug.trim() || editingCategory.slug
      });
    }
    setEditingCategory(null);
  };

  // Handle Instant Hero Banner Toggle
  const handleToggleHeroBanner = async (newVal) => {
    setShowHeroBanner(newVal);
    onUpdateSettings({ show_hero_banner: newVal });
    try {
      await supabase
        .from('store_settings')
        .update({ show_hero_banner: newVal })
        .eq('id', 'main_config');
    } catch (err) {
      console.warn('Hero banner toggle supabase sync:', err);
    }
  };

  // Handle Instant Store Open/Closed Change
  const handleStoreStatusChange = async (newVal) => {
    setIsStoreOpen(newVal);
    onUpdateSettings({ is_store_open: newVal });
    try {
      await supabase
        .from('store_settings')
        .update({ is_store_open: newVal })
        .eq('id', 'main_config');
    } catch (err) {
      console.warn('Store status toggle supabase sync:', err);
    }
  };

  // Handle Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');

    const updated = {
      whatsapp_number: cleanNumber,
      store_name: storeName.trim(),
      slogan: slogan.trim(),
      address: storeAddress.trim(),
      maps_url: mapsUrl.trim() || 'https://maps.app.goo.gl/koT5YPn28VA48SZU7',
      logo_url: logoUrl.trim() || '/assets/logo.jpg',
      delivery_fee: Number(deliveryFee),
      min_order_amount: Number(minOrderAmount) || 0,
      free_delivery_threshold: Number(freeDeliveryThreshold) || 0,
      announcement_banner: announcement.trim(),
      announcement_enabled: announcementEnabled,
      announcement_theme: announcementTheme,
      announcement_ticker: announcementTicker,
      is_store_open: isStoreOpen,
      store_closed_message: storeClosedMessage.trim(),
      show_hero_banner: showHeroBanner,
      hero_badge: heroBadge.trim(),
      hero_title: heroTitle.trim(),
      hero_description: heroDescription.trim(),
      show_promo_banner: showPromoBanner,
      promo_banner_custom_text: promoBannerCustomText.trim()
    };

    // Keep discount_title intact so discounts are never lost
    if (storeSettings?.discount_title) {
      updated.discount_title = storeSettings.discount_title;
    }

    // Handle optional PIN change
    if (newPinInput.trim()) {
      const cleanPin = newPinInput.trim();
      if (cleanPin.length < 4 || cleanPin.length > 8) {
        alert('رمز PIN الجديد يجب أن يتكون من 4 إلى 8 أرقام');
        return;
      }
      if (cleanPin !== confirmPinInput.trim()) {
        alert('رمز PIN الجديد وتأكيد الرمز غير متطابقين، يرجى إعادة التأكد');
        return;
      }
      const newHash = await computePinHash(cleanPin);
      updated.admin_pin_hash = newHash;
      setNewPinInput('');
      setConfirmPinInput('');
      setPinChangeFeedback('تم تحديث رمز PIN وتشفيره بنجاح!');
      setTimeout(() => setPinChangeFeedback(''), 4000);
    } else if (storeSettings?.admin_pin_hash) {
      updated.admin_pin_hash = storeSettings.admin_pin_hash;
    }

    onUpdateSettings(updated);

    // Save to Supabase via update to avoid overwriting unmentioned columns
    try {
      const { error } = await supabase
        .from('store_settings')
        .update(updated)
        .eq('id', 'main_config');

      if (error) {
        console.warn('Full settings update notice, using core fallback:', error.message);
        const corePayload = {
          whatsapp_number: cleanNumber,
          store_name: storeName.trim(),
          slogan: slogan.trim(),
          address: storeAddress.trim(),
          delivery_fee: Number(deliveryFee),
          announcement_banner: announcement.trim(),
          is_store_open: isStoreOpen
        };
        await supabase.from('store_settings').update(corePayload).eq('id', 'main_config');
      }
    } catch (err) {
      console.warn('Settings supabase sync:', err);
    }

    setSettingsSavedMessage(true);
    setTimeout(() => setSettingsSavedMessage(false), 3000);
  };

  // Handle Save Product (Price & Image)
  const handleSaveProduct = async (productId, currentPrice, currentImage) => {
    const newPrice = editingPrices[productId] !== undefined ? Number(editingPrices[productId]) : currentPrice;
    const newImage = editingImages[productId] !== undefined ? editingImages[productId].trim() : currentImage;

    onUpdateProductPrice(productId, newPrice);
    if (onUpdateProductImage) {
      onUpdateProductImage(productId, newImage);
    }

    // Sync to Supabase
    try {
      await supabase
        .from('products')
        .update({ 
          price_per_kg: newPrice,
          image_url: newImage 
        })
        .eq('id', productId);
    } catch (err) {
      console.warn('Product supabase update:', err);
    }

    setSaveStatus((prev) => ({ ...prev, [productId]: true }));
    setTimeout(() => {
      setSaveStatus((prev) => ({ ...prev, [productId]: false }));
    }, 2000);
  };

  // Handle Direct Row Image Upload to Supabase Storage with Auto-Delete
  const handleUploadRowImage = async (productId, file, currentImage) => {
    if (!file) return;
    setUploadingRowImage((prev) => ({ ...prev, [productId]: true }));
    try {
      // 1. Upload to Supabase Storage & automatically delete old image if it was hosted on Supabase
      const publicUrl = await uploadProductImage(file, currentImage);

      // 2. Update local state
      setEditingImages((prev) => ({ ...prev, [productId]: publicUrl }));

      // 3. Update store & Supabase immediately
      if (onUpdateProductImage) {
        onUpdateProductImage(productId, publicUrl);
      }
      await supabase
        .from('products')
        .update({ image_url: publicUrl })
        .eq('id', productId);

      setSaveStatus((prev) => ({ ...prev, [productId]: true }));
      setTimeout(() => {
        setSaveStatus((prev) => ({ ...prev, [productId]: false }));
      }, 2500);
    } catch (err) {
      console.error('Failed to upload row image:', err);
      alert('تعذر رفع الصورة: ' + (err.message || 'حدث خطأ غير متوقع'));
    } finally {
      setUploadingRowImage((prev) => ({ ...prev, [productId]: false }));
    }
  };

  // Handle Remove Image Directly from Product Row & Supabase Storage
  const handleRemoveRowImage = async (productId, currentImage) => {
    if (!window.confirm('هل تريد حذف صورة هذا الصنف؟ سيتم مسحها من Supabase أيضاً.')) return;

    setUploadingRowImage((prev) => ({ ...prev, [productId]: true }));
    try {
      if (currentImage) {
        await deleteProductImage(currentImage);
      }

      setEditingImages((prev) => ({ ...prev, [productId]: '' }));
      if (onUpdateProductImage) {
        onUpdateProductImage(productId, null);
      }
      await supabase
        .from('products')
        .update({ image_url: null })
        .eq('id', productId);

      setSaveStatus((prev) => ({ ...prev, [productId]: true }));
      setTimeout(() => setSaveStatus((prev) => ({ ...prev, [productId]: false })), 2000);
    } catch (err) {
      console.error('Failed to remove product image:', err);
      alert('حدث خطأ أثناء مسح الصورة: ' + (err.message || ''));
    } finally {
      setUploadingRowImage((prev) => ({ ...prev, [productId]: false }));
    }
  };

  // Open Edit Product Modal
  const handleOpenEditModal = (product) => {
    const cleanImg = (product.image_url && !product.image_url.includes('/assets/products/')) ? product.image_url : '';
    setEditingProductModal(product);
    setEditProdName(product.name || '');
    setEditProdEnglish(product.english_name || '');
    setEditProdPrice(product.price_per_kg || '');
    setEditProdCategory(product.category || 'premium-steaks');
    setEditProdDesc(product.description || '');
    setEditProdImage(cleanImg);
    setEditProdImageFile(null);
    setEditProdImagePreview(cleanImg || null);

    // Cutting options state
    const hasCutting = product.has_cutting_options !== false && Boolean(product.available_cuts && product.available_cuts.length > 0);
    setEditProdHasCutting(hasCutting);
    setEditProdCuts(hasCutting && Array.isArray(product.available_cuts) ? [...product.available_cuts] : ['قطع كباب حلة', 'مكعبات خضار', 'سلق للشوربة']);
    setEditProdCutInput('');

    // Product-specific discount state
    const hasDiscount = Boolean(product.discount_percent && Number(product.discount_percent) > 0);
    setEditProdDiscountEnabled(hasDiscount);
    setEditProdDiscountPercent(product.discount_percent || 10);
    setEditProdDiscountStartDate(product.discount_start_date || '');
    setEditProdDiscountEndDate(product.discount_end_date || '');
  };

  // Remove Image from Edit Modal
  const handleRemoveEditModalImage = async () => {
    if (editProdImage) {
      try {
        await deleteProductImage(editProdImage);
      } catch (err) {
        console.warn('Storage delete notice:', err);
      }
    }
    setEditProdImage('');
    setEditProdImageFile(null);
    setEditProdImagePreview(null);
  };

  // Save Edit Product Modal Submit
  const handleSaveEditProductSubmit = async (e) => {
    e.preventDefault();
    if (!editingProductModal || !editProdName.trim() || !editProdPrice) return;

    setIsSavingEditProd(true);
    try {
      let finalImageUrl = editProdImage ? editProdImage.trim() : null;

      // If a new local image file was chosen, upload to Supabase Storage and delete previous
      if (editProdImageFile) {
        finalImageUrl = await uploadProductImage(editProdImageFile, editingProductModal.image_url);
      }

      const updatedFields = {
        name: editProdName.trim(),
        english_name: editProdEnglish.trim() || null,
        price_per_kg: Number(editProdPrice),
        category: editProdCategory,
        image_url: finalImageUrl,
        description: editProdDesc.trim() || '',
        has_cutting_options: editProdHasCutting,
        available_cuts: editProdHasCutting ? editProdCuts.filter((c) => Boolean(c && c.trim())) : [],
        discount_percent: editProdDiscountEnabled ? Number(editProdDiscountPercent) : null,
        discount_start_date: (editProdDiscountEnabled && editProdDiscountStartDate) ? editProdDiscountStartDate : null,
        discount_end_date: (editProdDiscountEnabled && editProdDiscountEndDate) ? editProdDiscountEndDate : null
      };

      if (onUpdateFullProduct) {
        onUpdateFullProduct(editingProductModal.id, updatedFields);
      } else {
        onUpdateProductPrice(editingProductModal.id, Number(editProdPrice));
        if (onUpdateProductImage) {
          onUpdateProductImage(editingProductModal.id, finalImageUrl);
        }
      }

      // Update local quick editing caches
      setEditingPrices((prev) => ({ ...prev, [editingProductModal.id]: Number(editProdPrice) }));
      setEditingImages((prev) => ({ ...prev, [editingProductModal.id]: finalImageUrl || '' }));

      // Save to Supabase
      try {
        await supabase
          .from('products')
          .update(updatedFields)
          .eq('id', editingProductModal.id);
      } catch (sbErr) {
        console.warn('Edit product supabase update notice:', sbErr);
      }

      setEditingProductModal(null);
      setEditProdImageFile(null);
      setEditProdImagePreview(null);
    } catch (err) {
      console.error('Failed to save edited product:', err);
      alert('تعذر حفظ بيانات الصنف: ' + (err.message || ''));
    } finally {
      setIsSavingEditProd(false);
    }
  };

  // Delete Product
  const handleDeleteProductAction = async (productId, imageUrl) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الصنف نهائياً من المتجر؟')) return;
    try {
      if (imageUrl) {
        await deleteProductImage(imageUrl);
      }
      if (onDeleteProduct) {
        onDeleteProduct(productId);
      }
      if (editingProductModal && editingProductModal.id === productId) {
        setEditingProductModal(null);
      }
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };

  // Handle Add Product Submit with Supabase Storage File Upload
  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdPrice) return;

    setIsUploadingNewProd(true);
    try {
      let finalImageUrl = newProdImage.trim() || null;

      // If user chose a file from their device, upload directly to Supabase Storage
      if (newProdImageFile) {
        finalImageUrl = await uploadProductImage(newProdImageFile, null);
      }

      const newProd = {
        name: newProdName.trim(),
        english_name: newProdEnglish.trim() || null,
        price_per_kg: Number(newProdPrice),
        category: newProdCategory,
        image_url: finalImageUrl,
        badge: null,
        description: newProdDesc.trim() || 'لحم بلدي طازج من أفضل القطعيات اليومية المختارة بعناية فائقة',
        has_cutting_options: newProdHasCutting,
        available_cuts: newProdHasCutting ? newProdCuts.filter((c) => Boolean(c && c.trim())) : [],
        fat_options: ['أحمر صافي', 'ملبس وسط'],
        is_in_stock: true,
        is_featured: false
      };

      onAddNewProduct(newProd);

      // Save to Supabase
      try {
        await supabase.from('products').insert([newProd]);
      } catch (err) {
        console.warn('Add product supabase:', err);
      }

      // Reset Form & Close
      setNewProdName('');
      setNewProdEnglish('');
      setNewProdPrice('');
      setNewProdDesc('');
      setNewProdImage('');
      setNewProdImageFile(null);
      setNewProdImagePreview(null);
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Failed to add product:', err);
      alert('تعذر إضافة الصنف: ' + (err.message || 'حدث خطأ أثناء الرفع'));
    } finally {
      setIsUploadingNewProd(false);
    }
  };

  // Filtered Products for Admin
  const filteredProducts = products.filter((p) => {
    const query = productSearch.toLowerCase().trim();
    if (!query) return true;
    return (
      p.name.toLowerCase().includes(query) ||
      (p.english_name && p.english_name.toLowerCase().includes(query)) ||
      (p.description && p.description.toLowerCase().includes(query))
    );
  });

  // Active Discounted Products
  const activeDiscountedProducts = products.filter(
    (p) => p.discount_percent && Number(p.discount_percent) > 0
  );

  // Filtered Products for Discount Picker
  const discountPickerFilteredProducts = products.filter((p) => {
    const matchesCat = discountCatFilter === 'all' || p.category === discountCatFilter;
    const q = discountProdSearch.toLowerCase().trim();
    const matchesQ =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.english_name && p.english_name.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q));
    return matchesCat && matchesQ;
  });

  return (
    <div className="admin-standalone-wrapper">
      {/* Top Admin Navigation Bar */}
      <header className="admin-portal-header">
        <div className="portal-brand">
          <img src="/assets/logo.jpg" alt="حلاوة العنتبلي" className="portal-logo" width="40" height="40" />
          <div>
            <h1 className="portal-title">منصة الإدارة والتحكم — حلاوة العنتبلي</h1>
            <span className="portal-badge">لوحة تحكم المتجر</span>
          </div>
        </div>

        <div className="portal-actions">
          <button
            type="button"
            className="store-link-btn"
            onClick={onReturnToStore}
            aria-label="الرجوع لمتجر العملاء"
          >
            <ExternalLink size={16} aria-hidden="true" />
            <span>عرض متجر العملاء</span>
          </button>

          <button
            type="button"
            className="admin-logout-btn"
            onClick={onLogout}
            aria-label="قفل وتسجيل الخروج من لوحة التحكم"
          >
            <LogOut size={16} aria-hidden="true" />
            <span>قفل وتسجيل الخروج</span>
          </button>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <div className="admin-body-container">
        {/* Navigation Tabs */}
        <nav className="admin-nav-strip" aria-label="أقسام لوحة التحكم">
          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <Package size={17} aria-hidden="true" />
            <span>المنتجات والصور والأسعار ({products.length})</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            <FolderTree size={17} aria-hidden="true" />
            <span>إدارة التصنيفات ({categories.length})</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'discounts' ? 'active' : ''}`}
            onClick={() => setActiveTab('discounts')}
          >
            <Percent size={17} aria-hidden="true" />
            <span>عروض وخصومات المنتجات ({activeDiscountedProducts.length})</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <ShoppingBag size={17} aria-hidden="true" />
            <span>سجل الطلبات الواردة ({orders.length})</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={17} aria-hidden="true" />
            <span>إعدادات المتجر ورقم الواتساب</span>
          </button>
        </nav>

        {/* TAB 1: PRODUCTS & IMAGES MANAGEMENT */}
        {activeTab === 'products' && (
          <section className="admin-tab-pane" aria-labelledby="products-mgmt-heading">
            <div className="pane-header-row">
              <div>
                <h2 id="products-mgmt-heading" className="pane-heading">إدارة قائمة الأصناف والصور والأسعار</h2>
                <p className="pane-subheading">يمكنك تعديل أسعار الكيلو أو روابط صور المنتجات مباشرة وحفظها فوراً.</p>
              </div>

              <button
                type="button"
                className="add-product-action-btn"
                onClick={() => setIsAddModalOpen(true)}
              >
                <Plus size={16} aria-hidden="true" />
                <span>إضافة صنف جديد</span>
              </button>
            </div>

            {/* Search Box in Admin */}
            <div className="admin-search-wrapper">
              <Search size={18} className="search-icon" aria-hidden="true" />
              <input
                type="search"
                placeholder="ابحث بالاسم لتعديل سعر أو صورة أي صنف…"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                aria-label="البحث عن منتج في لوحة التحكم"
              />
            </div>

            {/* Products List Table / Cards */}
            <div className="admin-products-table-grid">
              {filteredProducts.map((p) => {
                const currentPrice = Number(p.price_per_kg);
                const editedPrice = editingPrices[p.id] ?? currentPrice;
                const currentImage = (p.image_url && !p.image_url.includes('/assets/products/')) ? p.image_url : '';
                const editedImage = editingImages[p.id] !== undefined ? editingImages[p.id] : currentImage;
                const isSaved = saveStatus[p.id];
                const isAvailable = p.is_in_stock !== false;

                return (
                  <article key={p.id} className={`admin-item-row ${!isAvailable ? 'disabled-item' : ''}`}>
                    {/* Item Image Preview, Remove Image & Direct Supabase Upload / URL */}
                    <div className="item-image-col">
                      <div className="admin-thumb-wrapper">
                        {editedImage ? (
                          <div className="thumb-relative">
                            <img 
                              src={editedImage} 
                              alt={p.name} 
                              className="item-admin-thumb" 
                              width="76" 
                              height="56"
                              loading="lazy"
                            />
                            <button
                              type="button"
                              className="thumb-delete-photo-btn"
                              onClick={() => handleRemoveRowImage(p.id, editedImage)}
                              title="حذف الصورة من الصنف ومن Supabase"
                              aria-label={`حذف صورة ${p.name}`}
                            >
                              <Trash2 size={12} aria-hidden="true" />
                            </button>
                          </div>
                        ) : (
                          <div className="item-no-thumb">
                            <ImageOff size={18} aria-hidden="true" />
                            <span>بدون صورة</span>
                          </div>
                        )}

                        <label 
                          htmlFor={`row-upload-${p.id}`}
                          className={`row-file-upload-btn ${uploadingRowImage[p.id] ? 'uploading' : ''}`}
                          title="رفع صورة جديدة إلى Supabase (وحذف القديمة تلقائياً)"
                        >
                          {uploadingRowImage[p.id] ? (
                            <RefreshCw size={13} className="spin" aria-hidden="true" />
                          ) : (
                            <Upload size={13} aria-hidden="true" />
                          )}
                          <span>{uploadingRowImage[p.id] ? 'جاري الرفع…' : (editedImage ? 'تغيير' : 'رفع صورة')}</span>
                        </label>
                        <input
                          id={`row-upload-${p.id}`}
                          type="file"
                          accept="image/*"
                          className="visually-hidden"
                          disabled={uploadingRowImage[p.id]}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadRowImage(p.id, file, editedImage);
                          }}
                        />
                      </div>
                    </div>

                    {/* Item Title & Category */}
                    <div className="item-title-col">
                      <div className="item-name-row">
                        <h3 className="admin-item-title">{p.name}</h3>
                        {p.english_name && (
                          <span className="admin-item-en" lang="en">{p.english_name}</span>
                        )}
                      </div>
                      {p.discount_percent && Number(p.discount_percent) > 0 ? (
                        <div className="admin-row-discount-indicator">
                          <span className="discount-pill tabular-nums">خصم {p.discount_percent}%</span>
                          <span className="discounted-price-label tabular-nums">
                            (السعر المخفض: {Math.round(currentPrice * (1 - p.discount_percent / 100))} ج.م بدلاً من {currentPrice} ج.م)
                          </span>
                        </div>
                      ) : p.badge ? (
                        <span className="admin-badge-indicator">{p.badge}</span>
                      ) : null}
                    </div>

                    {/* Stock Status Switch */}
                    <div className="item-stock-col">
                      <button
                        type="button"
                        className={`stock-status-btn ${isAvailable ? 'available' : 'unavailable'}`}
                        onClick={() => onToggleStock(p.id)}
                        aria-label={`تغيير توفر ${p.name}`}
                      >
                        {isAvailable ? (
                          <>
                            <Check size={14} aria-hidden="true" />
                            <span>متاح للطلب</span>
                          </>
                        ) : (
                          <>
                            <X size={14} aria-hidden="true" />
                            <span>غير متوفر</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Price Editor, Quick Save & Full Edit Modal Action */}
                    <div className="item-price-col">
                      <label htmlFor={`price-${p.id}`} className="visually-hidden">سعر الكيلو</label>
                      <div className="price-input-cluster">
                        <input
                          id={`price-${p.id}`}
                          type="number"
                          min="1"
                          className="admin-price-box tabular-nums"
                          value={editedPrice}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingPrices((prev) => ({ ...prev, [p.id]: val }));
                          }}
                        />
                        <span className="price-box-unit">ج.م/كجم</span>
                      </div>

                      <button
                        type="button"
                        className={`item-save-btn ${isSaved ? 'success' : ''}`}
                        onClick={() => handleSaveProduct(p.id, currentPrice, editedImage)}
                        aria-label={`حفظ سعر ${p.name}`}
                        title="حفظ السعر"
                      >
                        {isSaved ? <Check size={15} aria-hidden="true" /> : <Save size={15} aria-hidden="true" />}
                        <span>{isSaved ? 'تم' : 'حفظ'}</span>
                      </button>

                      <button
                        type="button"
                        className="item-edit-btn"
                        onClick={() => handleOpenEditModal(p)}
                        aria-label={`تعديل تفاصيل ${p.name}`}
                        title="تعديل تفاصيل وبيانات الصنف بالكامل"
                      >
                        <Edit2 size={14} aria-hidden="true" />
                        <span>تعديل</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* TAB 2: CATEGORIES MANAGEMENT */}
        {activeTab === 'categories' && (
          <section className="admin-tab-pane" aria-labelledby="categories-mgmt-heading">
            <div className="pane-header-row">
              <div>
                <h2 id="categories-mgmt-heading" className="pane-heading">إدارة أقسام وتصنيفات المتجر ({categories.length})</h2>
                <p className="pane-subheading">يمكنك إضافة أقسام جديدة، تعديل أسمائها ومفتاح الرابط، أو حذف أي قسم بحرية تامة.</p>
              </div>

              <button
                type="button"
                className="add-product-action-btn"
                onClick={() => setIsAddCatModalOpen(true)}
              >
                <Plus size={16} aria-hidden="true" />
                <span>إضافة قسم جديد</span>
              </button>
            </div>

            <div className="categories-cards-grid">
              {categories.map((cat) => {
                const count = products.filter((p) => p.category === cat.slug).length;

                return (
                  <article key={cat.id || cat.slug} className="admin-category-card">
                    <div className="cat-card-header">
                      <div className="cat-icon-title">
                        <div className="cat-badge-icon">
                          <FolderTree size={20} aria-hidden="true" />
                        </div>
                        <div>
                          <h3 className="cat-title">{cat.name}</h3>
                          <span className="cat-slug-pill">{cat.slug}</span>
                        </div>
                      </div>

                      <span className="cat-count-badge tabular-nums">
                        {count} {count === 1 ? 'صنف' : 'أصناف'}
                      </span>
                    </div>

                    <p className="cat-card-desc">
                      {count > 0 
                        ? `يحتوي هذا القسم حالياً على ${count} من أصناف اللحوم في المتجر.`
                        : 'هذا القسم فارغ حالياً، يمكنك تعيين منتجات إليه عند إضافة أو تعديل أي صنف.'}
                    </p>

                    <div className="cat-card-actions">
                      <button
                        type="button"
                        className="cat-edit-btn"
                        onClick={() => {
                          setEditingCategory(cat);
                          setEditCatName(cat.name);
                          setEditCatSlug(cat.slug);
                        }}
                      >
                        <Edit2 size={14} aria-hidden="true" />
                        <span>تعديل الاسم</span>
                      </button>

                      <button
                        type="button"
                        className="cat-delete-btn"
                        onClick={() => {
                          if (count > 0) {
                            if (!window.confirm(`تنبيه: هذا القسم يحتوي على ${count} صنف! هل أنت متأكد من حذفه؟`)) return;
                          } else {
                            if (!window.confirm(`هل أنت متأكد من حذف قسم "${cat.name}"؟`)) return;
                          }
                          if (onDeleteCategory) {
                            onDeleteCategory(cat.id || cat.slug);
                          }
                        }}
                        title="حذف هذا القسم"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                        <span>حذف</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* TAB 3: PRODUCT DISCOUNTS & PROMOTIONS MANAGEMENT */}
        {activeTab === 'discounts' && (
          <section className="admin-tab-pane" aria-labelledby="discounts-mgmt-heading">
            <div className="pane-header-row">
              <div>
                <h2 id="discounts-mgmt-heading" className="pane-heading">إدارة عروض وتخفيضات المنتجات</h2>
                <p className="pane-subheading">
                  حدد أي منتجات أو قطعيات لتطبيق خصم مباشر عليها وتحديد فترة سريان العرض، أو ألغِ الخصومات بضغطة واحدة.
                </p>
              </div>

              {activeDiscountedProducts.length > 0 && (
                <button
                  type="button"
                  className="danger-outline-action-btn"
                  onClick={handleRemoveAllProductDiscounts}
                  disabled={isApplyingDiscounts}
                >
                  <Trash2 size={15} aria-hidden="true" />
                  <span>إلغاء الخصم عن كافة الأصناف ({activeDiscountedProducts.length})</span>
                </button>
              )}
            </div>

            {/* Top Feedback Banner if any */}
            {discountActionFeedback && (
              <div 
                className={`admin-action-alert-strip ${discountActionFeedback.type === 'success' ? 'success' : 'info'}`}
                role="status" 
                aria-live="polite"
              >
                <CheckCircle2 size={18} aria-hidden="true" />
                <span>{discountActionFeedback.text}</span>
              </div>
            )}

            {/* SECTION 1: CURRENTLY DISCOUNTED PRODUCTS */}
            <div className="admin-section-block">
              <div className="section-block-title-row">
                <div className="section-title-wrap">
                  <Tag size={18} className="gold-accent-icon" aria-hidden="true" />
                  <h3 className="section-block-title">الأصناف التي عليها خصم حالياً ({activeDiscountedProducts.length})</h3>
                </div>
                <span className="section-meta-hint">
                  {activeDiscountedProducts.length === 0 
                    ? 'لا توجد أصناف مخفضة حالياً' 
                    : `ساري على ${activeDiscountedProducts.length} صنف من أصل ${products.length} صنف بالمتجر`}
                </span>
              </div>

              {activeDiscountedProducts.length === 0 ? (
                <div className="empty-sub-card">
                  <AlertCircle size={28} className="empty-sub-icon" aria-hidden="true" />
                  <p>لا توجد منتجات عليها خصم حالياً في المتجر. حدد الأصناف من القسم بالأسفل لتطبيق خصم فوري عليها.</p>
                </div>
              ) : (
                <div className="discounted-items-grid">
                  {activeDiscountedProducts.map((p) => {
                    const basePrice = Number(p.price_per_kg);
                    const pct = Number(p.discount_percent);
                    const finalPrice = Math.round(basePrice * (1 - pct / 100));
                    const isTimeValid = isProductDiscountTimeValid(p);

                    return (
                      <div key={p.id} className="discounted-item-card">
                        <div className="disc-card-top">
                          <div className="disc-card-info">
                            <h4 className="disc-prod-title">{p.name}</h4>
                            {p.english_name && <span className="disc-prod-en" lang="en">{p.english_name}</span>}
                          </div>
                          <span className="disc-pct-badge tabular-nums">خصم {pct}%</span>
                        </div>

                        <div className="disc-card-pricing-row">
                          <span className="disc-old-price tabular-nums">{basePrice} ج.م</span>
                          <span className="disc-arrow" aria-hidden="true">←</span>
                          <span className="disc-new-price tabular-nums">{finalPrice} ج.م / كجم</span>
                        </div>

                        {/* Quick adjust percentage directly */}
                        <div className="disc-card-quick-edit-row">
                          <span className="quick-edit-lbl">تعديل النسبة مباشرة:</span>
                          <div className="quick-edit-stepper">
                            <button
                              type="button"
                              className="stepper-btn-sm"
                              onClick={() => handleQuickUpdateActiveDiscount(p.id, Math.max(1, pct - 5))}
                              title="تقليل 5%"
                              aria-label={`تقليل خصم ${p.name} بنسبة 5%`}
                            >
                              -5%
                            </button>
                            <span className="current-active-pct tabular-nums">{pct}%</span>
                            <button
                              type="button"
                              className="stepper-btn-sm"
                              onClick={() => handleQuickUpdateActiveDiscount(p.id, Math.min(90, pct + 5))}
                              title="زيادة 5%"
                              aria-label={`زيادة خصم ${p.name} بنسبة 5%`}
                            >
                              +5%
                            </button>
                          </div>
                        </div>

                        {/* Validity dates info */}
                        <div className="disc-dates-row">
                          <Calendar size={13} aria-hidden="true" />
                          <span className="disc-dates-text">
                            {p.discount_start_date || p.discount_end_date ? (
                              <>
                                {p.discount_start_date ? `من ${new Date(p.discount_start_date).toLocaleDateString('ar-EG')}` : 'فوري'}
                                {p.discount_end_date ? ` إلى ${new Date(p.discount_end_date).toLocaleDateString('ar-EG')}` : ' (مستمر)'}
                              </>
                            ) : (
                              'ساري مستمر حتى الإلغاء اليدوي'
                            )}
                          </span>
                          {!isTimeValid && (
                            <span className="disc-expired-tag">خارج وقت العرض</span>
                          )}
                        </div>

                        <button
                          type="button"
                          className="remove-single-disc-btn"
                          onClick={() => handleRemoveDiscountFromProduct(p.id)}
                          aria-label={`إلغاء الخصم عن ${p.name}`}
                        >
                          <X size={14} aria-hidden="true" />
                          <span>إلغاء الخصم عن هذا الصنف</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SECTION 2: APPLY DISCOUNT TO SPECIFIC PRODUCTS */}
            <div className="admin-section-block highlight-section">
              <div className="section-block-title-row">
                <div className="section-title-wrap">
                  <Percent size={18} className="gold-accent-icon" aria-hidden="true" />
                  <h3 className="section-block-title">تطبيق خصم جديد على أصناف محددة</h3>
                </div>
                <span className="section-meta-hint">
                  حدد نسبة الخصم وتاريخ السريان ثم اختر الأصناف التي ترغب بتخفيضها
                </span>
              </div>

              {/* Discount Parameters Form */}
              <div className="batch-discount-parameters-grid">
                <div className="form-group">
                  <label htmlFor="batch-discount-pct">نسبة الخصم المباشر (%): *</label>
                  <div className="input-with-icon">
                    <Percent size={18} className="field-icon" aria-hidden="true" />
                    <input
                      id="batch-discount-pct"
                      type="number"
                      min="1"
                      max="90"
                      value={batchDiscountPercent}
                      onChange={(e) => setBatchDiscountPercent(e.target.value)}
                      required
                      placeholder="10"
                      className="tabular-nums"
                    />
                  </div>
                  <div className="discount-presets-strip" aria-label="نسب خصم سريعة">
                    {[5, 10, 15, 20, 25, 30].map((pctVal) => (
                      <button
                        key={pctVal}
                        type="button"
                        className={`discount-preset-btn ${Number(batchDiscountPercent) === pctVal ? 'active' : ''}`}
                        onClick={() => setBatchDiscountPercent(pctVal)}
                      >
                        خصم {pctVal}%
                      </button>
                    ))}
                  </div>

                  {selectedDiscountProdIds.length > 0 && (
                    <div className="batch-apply-all-action-row">
                      <button
                        type="button"
                        className="batch-apply-to-all-selected-btn"
                        onClick={handleApplyBatchPctToAllSelected}
                        title="تطبيق هذه النسبة على كل الأصناف المختارة"
                      >
                        <Percent size={14} aria-hidden="true" />
                        <span>تطبيق {batchDiscountPercent}% كنسبة موحدة على كافة الأصناف المحددة ({selectedDiscountProdIds.length})</span>
                      </button>
                      <span className="batch-apply-hint">
                        أو يمكنك تخصيص نسبة مستقلة لكل صنف من بطاقته بالأسفل دون الحاجة للحفظ المتكرر!
                      </span>
                    </div>
                  )}

                  <span className="field-hint">اختر نسبة عامة للبدء بها، أو عدل نسبة كل صنف بشكل منفصل من بطاقته مباشرة.</span>
                </div>

                <div className="form-group">
                  <label htmlFor="batch-discount-start">تاريخ ووقت بدء الخصم (اختياري):</label>
                  <div className="input-with-icon">
                    <Calendar size={18} className="field-icon" aria-hidden="true" />
                    <input
                      id="batch-discount-start"
                      type="datetime-local"
                      value={batchDiscountStartDate}
                      onChange={(e) => setBatchDiscountStartDate(e.target.value)}
                    />
                  </div>
                  <span className="field-hint">اتركه فارغاً ليبدأ الخصم فوراً.</span>
                </div>

                <div className="form-group">
                  <label htmlFor="batch-discount-end">تاريخ ووقت انتهاء الخصم (اختياري):</label>
                  <div className="input-with-icon">
                    <Calendar size={18} className="field-icon" aria-hidden="true" />
                    <input
                      id="batch-discount-end"
                      type="datetime-local"
                      value={batchDiscountEndDate}
                      onChange={(e) => setBatchDiscountEndDate(e.target.value)}
                    />
                  </div>
                  <span className="field-hint">اتركه فارغاً ليستمر الخصم حتى تلغيه.</span>
                </div>
              </div>

              {/* Product Filtering & Selection Controls */}
              <div className="product-selector-toolbar">
                <div className="selector-filters-row">
                  <div className="input-with-icon selector-search">
                    <Search size={16} className="field-icon" aria-hidden="true" />
                    <input
                      type="search"
                      placeholder="ابحث بالاسم لتحديد القطعية (فلتو، ريش، كفتة، مفروم…)"
                      value={discountProdSearch}
                      onChange={(e) => setDiscountProdSearch(e.target.value)}
                      aria-label="البحث في المنتجات لتحديدها"
                    />
                  </div>

                  <select
                    value={discountCatFilter}
                    onChange={(e) => setDiscountCatFilter(e.target.value)}
                    className="selector-category-select"
                    aria-label="تصفية حسب القسم"
                  >
                    <option value="all">كافة الأقسام ({products.length} صنف)</option>
                    {categories.filter(c => c.slug !== 'all').map((c) => (
                      <option key={c.id || c.slug} value={c.slug}>
                        {c.name} ({products.filter(p => p.category === c.slug).length})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="selector-actions-row">
                  <button
                    type="button"
                    className="selector-pill-btn"
                    onClick={() => handleSelectAllFiltered(discountPickerFilteredProducts)}
                  >
                    تحديد الكل المعروض ({discountPickerFilteredProducts.length})
                  </button>

                  <button
                    type="button"
                    className="selector-pill-btn secondary"
                    onClick={handleDeselectAll}
                    disabled={selectedDiscountProdIds.length === 0}
                  >
                    إلغاء التحديد
                  </button>

                  <div className="selected-count-tag tabular-nums">
                    <span>المحدد حالياً:</span>
                    <strong>{selectedDiscountProdIds.length}</strong>
                    <span>صنف</span>
                  </div>
                </div>
              </div>

              {/* Product Checkboxes Cards Grid */}
              <div className="selectable-products-grid">
                {discountPickerFilteredProducts.map((p) => {
                  const isSelected = selectedDiscountProdIds.includes(p.id);
                  const basePrice = Number(p.price_per_kg);
                  const customItem = customDiscountMap[p.id];
                  const itemPct = customItem?.percent !== undefined
                    ? Number(customItem.percent)
                    : (p.discount_percent ? Number(p.discount_percent) : (Number(batchDiscountPercent) || 10));
                  const previewPrice = Math.round(basePrice * (1 - itemPct / 100));
                  const savedAmount = Math.max(0, basePrice - previewPrice);
                  const alreadyHasDiscount = Boolean(p.discount_percent && Number(p.discount_percent) > 0);

                  return (
                    <div
                      key={p.id}
                      className={`selectable-product-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleToggleSelectProduct(p.id)}
                      role="checkbox"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault();
                          handleToggleSelectProduct(p.id);
                        }
                      }}
                    >
                      <div className="card-selection-check">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // handled by parent onClick
                          tabIndex={-1}
                          aria-label={`تحديد ${p.name}`}
                        />
                      </div>

                      <div className="card-prod-meta">
                        <div className="meta-name-row">
                          <h4 className="meta-name">{p.name}</h4>
                          {alreadyHasDiscount && (
                            <span className="curr-disc-tag">خصم {p.discount_percent}% حالي</span>
                          )}
                        </div>
                        <span className="meta-category">
                          {categories.find(c => c.slug === p.category)?.name || p.category}
                        </span>

                        <div className="meta-pricing-calc tabular-nums">
                          <span className="base-price">{basePrice} ج.م</span>
                          <span className="preview-arrow">←</span>
                          <span className="new-price">{previewPrice} ج.م</span>
                          {isSelected && savedAmount > 0 && (
                            <span className="meta-savings-tag">وفر {savedAmount} ج.م</span>
                          )}
                        </div>

                        {/* CUSTOM PER-PRODUCT DISCOUNT CONTROLS WHEN SELECTED */}
                        {isSelected && (
                          <div
                            className="card-custom-discount-controls"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            <div className="card-discount-input-row">
                              <span className="card-discount-lbl">نسبة الخصم لهذا الصنف:</span>
                              <div className="card-discount-stepper">
                                <button
                                  type="button"
                                  className="stepper-btn"
                                  aria-label={`تقليل نسبة خصم ${p.name}`}
                                  onClick={() => handleStepCustomDiscount(p.id, -5)}
                                >
                                  -
                                </button>
                                <div className="stepper-input-wrap">
                                  <input
                                    type="number"
                                    min="1"
                                    max="90"
                                    value={itemPct}
                                    onChange={(e) => handleCustomDiscountChange(p.id, e.target.value)}
                                    className="card-discount-num tabular-nums"
                                    aria-label={`نسبة الخصم لصنف ${p.name}`}
                                  />
                                  <span className="stepper-unit">%</span>
                                </div>
                                <button
                                  type="button"
                                  className="stepper-btn"
                                  aria-label={`زيادة نسبة خصم ${p.name}`}
                                  onClick={() => handleStepCustomDiscount(p.id, +5)}
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            <div className="card-quick-pct-chips" aria-label={`نسب سريعة لصنف ${p.name}`}>
                              {[5, 10, 15, 20, 25, 30].map((chipPct) => (
                                <button
                                  key={chipPct}
                                  type="button"
                                  className={`card-mini-pct-chip ${itemPct === chipPct ? 'active' : ''}`}
                                  onClick={() => handleCustomDiscountChange(p.id, chipPct)}
                                >
                                  {chipPct}%
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Big CTA Button */}
              <div className="apply-batch-cta-row">
                <button
                  type="button"
                  className="apply-batch-discount-btn"
                  onClick={handleApplyDiscountToSelected}
                  disabled={selectedDiscountProdIds.length === 0 || isApplyingDiscounts}
                >
                  <Percent size={18} aria-hidden="true" />
                  <span>
                    {isApplyingDiscounts 
                      ? 'جاري حفظ الخصومات في Supabase…' 
                      : selectedDiscountProdIds.length === 1
                        ? `حفظ وتطبيق الخصم على الصنف المحدد الآن`
                        : `حفظ وتطبيق كافة الخصومات على (${selectedDiscountProdIds.length}) أصناف محددة بنسبها المختلفة دفعة واحدة`}
                  </span>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* TAB 4: STORE & WHATSAPP SETTINGS */}
        {activeTab === 'settings' && (
          <section className="admin-tab-pane" aria-labelledby="settings-heading">
            <form className="admin-clean-form" onSubmit={handleSaveSettings}>
              <div className="form-legend">
                <h2 id="settings-heading" className="pane-heading">مركز التحكم الشامل وتخصيص المتجر</h2>
                <p className="pane-subheading">تحكم كامل في هوية المتجر، الأشرطة الإعلانية، شاشة العروض، شروط التوصيل، ورقم الواتساب.</p>
              </div>

              {/* SECTION 1: STORE BRAND & IDENTITY */}
              <div className="admin-settings-section">
                <div className="settings-section-title-wrap">
                  <Store size={18} className="gold-accent-icon" aria-hidden="true" />
                  <h3 className="settings-section-heading">هوية وبيانات المتجر الأساسية</h3>
                </div>
                <p className="settings-section-desc">اسم المتجر، الشعار الترويجي، ورقم الواتساب الذي يستقبل رسائل فواتير العملاء.</p>

                <div className="form-two-cols">
                  <div className="form-group">
                    <label htmlFor="admin-store-name">اسم المتجر / العلامة التجارية: *</label>
                    <input
                      id="admin-store-name"
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="admin-slogan">الشعار (السلوجان):</label>
                    <input
                      id="admin-slogan"
                      type="text"
                      value={slogan}
                      onChange={(e) => setSlogan(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-two-cols">
                  <div className="form-group primary-highlight">
                    <label htmlFor="admin-whatsapp-number">
                      رقم الواتساب المستلم للطلبات: *
                      <span className="hint-text">(بكود الدولة بدون + مثال: 201012345678)</span>
                    </label>
                    <div className="input-with-icon">
                      <Phone size={18} className="field-icon" aria-hidden="true" />
                      <input
                        id="admin-whatsapp-number"
                        type="tel"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        placeholder="201012345678"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="admin-logo-url">رابط صورة الشعار (Logo URL):</label>
                    <input
                      id="admin-logo-url"
                      type="text"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="/assets/logo.jpg"
                    />
                  </div>
                </div>

                <div className="form-two-cols">
                  <div className="form-group">
                    <label htmlFor="admin-store-address">عنوان الفرع الرئيسي للجزارة (للاستلام من الفرع):</label>
                    <div className="input-with-icon">
                      <Store size={18} className="field-icon" aria-hidden="true" />
                      <input
                        id="admin-store-address"
                        type="text"
                        value={storeAddress}
                        onChange={(e) => setStoreAddress(e.target.value)}
                        placeholder="طريق 10، جمعية عرابي - خلف كارفور العبور، القاهرة"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="admin-maps-url">رابط موقع الفرع على خرائط جوجل (Google Maps URL):</label>
                    <div className="input-with-icon">
                      <MapPin size={18} className="field-icon" aria-hidden="true" />
                      <input
                        id="admin-maps-url"
                        type="url"
                        value={mapsUrl}
                        onChange={(e) => setMapsUrl(e.target.value)}
                        placeholder="https://maps.app.goo.gl/koT5YPn28VA48SZU7"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: TOP ANNOUNCEMENT BAR */}
              <div className="admin-settings-section">
                <div className="settings-section-title-wrap">
                  <Megaphone size={18} className="gold-accent-icon" aria-hidden="true" />
                  <h3 className="settings-section-heading">شريط الإعلانات الترويجي العلوي (Announcement Bar)</h3>
                </div>
                <p className="settings-section-desc">الشريط العريض في أعلى الشاشة لعرض التنبيهات، مواعيد العمل، أو مناطق التوصيل.</p>

                <div className="hero-toggle-area">
                  <label className="checkbox-label-toggle" htmlFor="announcement-enable-toggle">
                    <input
                      id="announcement-enable-toggle"
                      type="checkbox"
                      checked={announcementEnabled}
                      onChange={(e) => setAnnouncementEnabled(e.target.checked)}
                    />
                    <span>تفعيل وإظهار شريط الإعلانات أعلى المتجر</span>
                  </label>
                </div>

                {announcementEnabled && (
                  <div className="form-two-cols">
                    <div className="form-group">
                      <label htmlFor="admin-announcement-text">نص الإعلان الترويجي:</label>
                      <input
                        id="admin-announcement-text"
                        type="text"
                        value={announcement}
                        onChange={(e) => setAnnouncement(e.target.value)}
                        placeholder="طازج ومذبوح يومياً بإشراف بيطري كامل — توصيل سريع لمنطقة العبور فقط"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="admin-announcement-theme">لون وشكل الشريط:</label>
                      <select
                        id="admin-announcement-theme"
                        value={announcementTheme}
                        onChange={(e) => setAnnouncementTheme(e.target.value)}
                      >
                        <option value="crimson">أحمر المذبح الملكي (Crimson Red)</option>
                        <option value="gold">أسود بلمسة ذهبية فاخرة (Black & Gold)</option>
                        <option value="black">أسود داكن كلاسيكي (Deep Onyx)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="checkbox-label-toggle" htmlFor="announcement-ticker-toggle">
                        <input
                          id="announcement-ticker-toggle"
                          type="checkbox"
                          checked={announcementTicker}
                          onChange={(e) => setAnnouncementTicker(e.target.checked)}
                        />
                        <span>تأثير الشريط المتحرك المستمر (Marquee Ticker Animation)</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 3: HERO & PROMO SHOWCASE */}
              <div className="admin-settings-section">
                <div className="settings-section-title-wrap">
                  <Sparkles size={18} className="gold-accent-icon" aria-hidden="true" />
                  <h3 className="settings-section-heading">شاشة وعروض الواجهة والمقدمة (Hero & Promo Banner)</h3>
                </div>
                <p className="settings-section-desc">قسم الواجهة الترحيبية ("عارف يعني ايه لحمة ؟!") وأسفلها الوصف الترويجي المميز.</p>

                <div className="hero-toggle-area">
                  <label className="checkbox-label-toggle" htmlFor="hero-banner-switch">
                    <input
                      id="hero-banner-switch"
                      type="checkbox"
                      checked={showHeroBanner}
                      onChange={(e) => setShowHeroBanner(e.target.checked)}
                    />
                    <span>إظهار شاشة العروض والواجهة في المتجر</span>
                  </label>
                </div>

                {showHeroBanner && (
                  <div className="hero-fields-grid">
                    <div className="form-group">
                      <label htmlFor="admin-hero-badge">شارة العرض الترويجية (Badge Tag):</label>
                      <input
                        id="admin-hero-badge"
                        type="text"
                        value={heroBadge}
                        onChange={(e) => setHeroBadge(e.target.value)}
                        placeholder="جزارة بلدي 100% — ذبح يومي معتمد"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="admin-hero-title">العنوان الترحيبي الرئيسي (Hero Title):</label>
                      <input
                        id="admin-hero-title"
                        type="text"
                        value={heroTitle}
                        onChange={(e) => setHeroTitle(e.target.value)}
                        placeholder="عارف يعني ايه لحمة ؟!"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="admin-hero-desc">النص الوصفي والشعار التفصيلي:</label>
                      <textarea
                        id="admin-hero-desc"
                        rows="3"
                        value={heroDescription}
                        onChange={(e) => setHeroDescription(e.target.value)}
                        placeholder="أصول الجزارة البلدي من قلب المذبح. ننتقي لك أنعم القطعيات الطازجة..."
                      />
                    </div>

                    {/* Live Preview Box */}
                    <div className="hero-live-preview-box">
                      <span className="preview-tag">معاينة مباشرة كما تظهر للعميل في واجهة المتجر:</span>
                      <div className="preview-hero-content">
                        {heroBadge && <span className="hero-badge-pill">{heroBadge}</span>}
                        <h4 className="preview-title">{heroTitle || 'عارف يعني ايه لحمة ؟!'}</h4>
                        <p className="preview-desc">
                          {heroDescription || 'أصول الجزارة البلدي من قلب المذبح. ننتقي لك أنعم القطعيات الطازجة، ونجهزها بتقطيعك المفضل ونوصلها لباب بيتك مباشرة عبر الواتساب.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 4: PRODUCT DISCOUNTS PROMO BAR */}
              <div className="admin-settings-section">
                <div className="settings-section-title-wrap">
                  <Percent size={18} className="gold-accent-icon" aria-hidden="true" />
                  <h3 className="settings-section-heading">شريط تنبيه الخصومات والعروض السارية (Discounts Bar)</h3>
                </div>
                <p className="settings-section-desc">شريط ذهبي مميز يظهر تلقائياً أعلى المنتجات عند وجود أي قطعيات مخفضة بالمتجر.</p>

                <div className="hero-toggle-area">
                  <label className="checkbox-label-toggle" htmlFor="promo-bar-enable-switch">
                    <input
                      id="promo-bar-enable-switch"
                      type="checkbox"
                      checked={showPromoBanner}
                      onChange={(e) => setShowPromoBanner(e.target.checked)}
                    />
                    <span>إظهار شريط تنبيه التخفيضات أعلى المنتجات عند وجود عروض</span>
                  </label>
                </div>

                {showPromoBanner && (
                  <div className="form-group">
                    <label htmlFor="admin-promo-custom-text">
                      نص مخصص لشريط العروض (اختياري):
                      <span className="hint-text">(اتركه فارغاً ليقوم النظام بعد الأصناف المخفضة تلقائياً)</span>
                    </label>
                    <input
                      id="admin-promo-custom-text"
                      type="text"
                      value={promoBannerCustomText}
                      onChange={(e) => setPromoBannerCustomText(e.target.value)}
                      placeholder="مثال: عروض نهاية الأسبوع — تخفيضات كبرى على قطعيات اللحوم البلدية!"
                    />
                  </div>
                )}
              </div>

              {/* SECTION 5: DELIVERY & WORKING HOURS */}
              <div className="admin-settings-section">
                <div className="settings-section-title-wrap">
                  <Truck size={18} className="gold-accent-icon" aria-hidden="true" />
                  <h3 className="settings-section-heading">شروط التوصيل وحالة المتجر</h3>
                </div>

                <div className="form-two-cols">
                  <div className="form-group">
                    <label htmlFor="admin-store-status">حالة المتجر الآن:</label>
                    <select
                      id="admin-store-status"
                      value={isStoreOpen ? 'open' : 'closed'}
                      onChange={(e) => handleStoreStatusChange(e.target.value === 'open')}
                    >
                      <option value="open">المتجر مفتوح ويستقبل الطلبات فوراً</option>
                      <option value="closed">المتجر مغلق مؤقتاً</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="admin-delivery-fee">رسوم التوصيل الافتراضية (ج.م):</label>
                    <div className="input-with-icon">
                      <Truck size={18} className="field-icon" aria-hidden="true" />
                      <input
                        id="admin-delivery-fee"
                        type="number"
                        min="0"
                        step="5"
                        value={deliveryFee}
                        onChange={(e) => setDeliveryFee(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-two-cols">
                  <div className="form-group">
                    <label htmlFor="admin-min-order">الحد الأدنى لقيمة الطلب (ج.م):</label>
                    <input
                      id="admin-min-order"
                      type="number"
                      min="0"
                      value={minOrderAmount}
                      onChange={(e) => setMinOrderAmount(e.target.value)}
                      placeholder="0 يعني بدون حد أدنى"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="admin-free-delivery">توصيل مجاني للطلبات فوق (ج.م):</label>
                    <input
                      id="admin-free-delivery"
                      type="number"
                      min="0"
                      value={freeDeliveryThreshold}
                      onChange={(e) => setFreeDeliveryThreshold(e.target.value)}
                      placeholder="0 يعني بدون توصيل مجاني تلقائي"
                    />
                  </div>
                </div>

                {!isStoreOpen && (
                  <div className="form-group">
                    <label htmlFor="admin-store-closed-msg">رسالة تظهر للعملاء عند إغلاق المتجر:</label>
                    <textarea
                      id="admin-store-closed-msg"
                      rows="2"
                      value={storeClosedMessage}
                      onChange={(e) => setStoreClosedMessage(e.target.value)}
                      placeholder="المتجر مغلق حالياً، نستقبل طلباتكم غداً بدءاً من الساعة 9 صباحاً."
                    />
                  </div>
                )}
              </div>

              {/* ADMIN SECURITY & PIN CARD */}
              <div className="admin-hero-control-card security-pin-card">
                <div className="hero-control-header">
                  <div className="hero-control-meta">
                    <div className="hero-icon-title">
                      <ShieldCheck size={20} className="gold-accent-icon" aria-hidden="true" />
                      <h3 className="hero-control-heading">أمان وحماية لوحة التحكم (رمز PIN للدخول)</h3>
                    </div>
                    <p className="hero-control-desc">
                      تأمين لوحة الإدارة برمز PIN مشفر لمنع أي وصول غير مصرح به. الرمز الافتراضي الحالي هو <strong className="tabular-nums">1954</strong>.
                    </p>
                  </div>
                </div>

                <div className="hero-fields-grid">
                  <div className="form-group">
                    <label htmlFor="admin-new-pin">تغيير رمز PIN (4 إلى 8 أرقام):</label>
                    <input
                      id="admin-new-pin"
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={8}
                      value={newPinInput}
                      onChange={(e) => setNewPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="اتركه فارغاً إذا كنت لا ترغب بتغييره"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="admin-confirm-pin">تأكيد رمز PIN الجديد:</label>
                    <input
                      id="admin-confirm-pin"
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={8}
                      value={confirmPinInput}
                      onChange={(e) => setConfirmPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="أعد كتابة نفس الرمز للتأكيد"
                    />
                  </div>
                </div>

                {pinChangeFeedback && (
                  <div className="pin-change-alert" role="status" aria-live="polite">
                    <CheckCircle2 size={16} aria-hidden="true" />
                    <span>{pinChangeFeedback}</span>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="form-submit-row">
                <button type="submit" className="admin-submit-btn">
                  <Save size={17} aria-hidden="true" />
                  <span>حفظ التعديلات والإعدادات بالكامل</span>
                </button>

                {settingsSavedMessage && (
                  <span className="save-success-tag" role="status" aria-live="polite">
                    <Check size={16} aria-hidden="true" />
                    <span>تم حفظ كافة الإعدادات وتحديث المتجر بنجاح!</span>
                  </span>
                )}
              </div>
            </form>
          </section>
        )}

        {/* TAB 3: ORDERS LOG */}
        {activeTab === 'orders' && (
          <section className="admin-tab-pane" aria-labelledby="orders-log-heading">
            <div className="pane-header-row">
              <div>
                <h2 id="orders-log-heading" className="pane-heading">سجل الطلبات الواردة ({orders.length})</h2>
                <p className="pane-subheading">قائمة الطلبات المسجلة إلكترونياً عند تأكيد العميل إرسال الطلب عبر الواتساب (محدثة لحظياً).</p>
              </div>
              <button
                type="button"
                className="refresh-btn"
                onClick={fetchOrders}
                disabled={loadingOrders}
              >
                <RefreshCw size={15} className={loadingOrders ? 'spin' : ''} aria-hidden="true" />
                <span>{loadingOrders ? 'جاري التحديث…' : 'تحديث القائمة'}</span>
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="empty-pane-state">
                <ShoppingBag size={44} className="empty-icon" aria-hidden="true" />
                <h3>لا توجد طلبات مسجلة حتى الآن</h3>
                <p>ستظهر هنا تفاصيل أي طلب جديد يقوم العميل بطلبه عبر المتجر فوراً.</p>
              </div>
            ) : (
              <div className="orders-cards-list">
                {orders.map((ord) => {
                  const isPickup = ord.delivery_type === 'pickup' || (ord.customer_address && ord.customer_address.includes('استلام من الفرع'));
                  const status = ord.status || 'new';

                  return (
                    <div key={ord.id || ord.order_number} className="order-summary-card">
                      <div className="order-summary-header">
                        <div className="order-id-group">
                          <span className="order-num-pill tabular-nums">#{ord.order_number || String(ord.id).slice(0, 6)}</span>
                          
                          <span className={`order-status-pill ${status}`}>
                            {status === 'delivered' || status === 'completed'
                              ? 'تم التسليم'
                              : status === 'preparing'
                              ? 'قيد التحضير'
                              : 'طلب جديد'}
                          </span>

                          <span className={`order-delivery-pill ${isPickup ? 'pickup' : 'delivery'}`}>
                            {isPickup ? 'استلام من الفرع' : 'توصيل للمنزل'}
                          </span>

                          <span className="order-timestamp tabular-nums">
                            {new Date(ord.created_at || Date.now()).toLocaleString('ar-EG')}
                          </span>
                        </div>

                        <div className="order-header-right">
                          <span className="order-price-badge tabular-nums">
                            {Number(ord.total_amount).toLocaleString('ar-EG')} ج.م
                          </span>

                          <button
                            type="button"
                            className="order-delete-btn"
                            onClick={() => handleDeleteOrder(ord.id)}
                            aria-label="مسح الطلب"
                            title="مسح الطلب"
                          >
                            <Trash2 size={15} aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      {/* Customer Information */}
                      <div className="order-customer-details">
                        <p><strong>العميل:</strong> {ord.customer_name}</p>
                        <p>
                          <strong>الهاتف:</strong>{' '}
                          <a href={`tel:${ord.customer_phone}`} className="phone-anchor tabular-nums">
                            {ord.customer_phone}
                          </a>
                        </p>
                        <p>
                          <strong>{isPickup ? 'طريقة الاستلام:' : 'عنوان التوصيل:'}</strong>{' '}
                          {ord.customer_address}
                        </p>
                        {ord.notes && <p><strong>ملاحظات:</strong> {ord.notes}</p>}
                      </div>

                      {/* Ordered Items Breakdown */}
                      {Array.isArray(ord.items) && (
                        <div className="order-items-breakdown">
                          <h4>القطعيات المطلوبة:</h4>
                          <ul>
                            {ord.items.map((it, idx) => (
                              <li key={idx}>
                                <span>{it.name} ({it.weight} كجم)</span>
                                <span className="item-detail-note">
                                  {it.cutStyle ? `[${it.cutStyle}]` : ''} {it.fatOption ? `[${it.fatOption}]` : ''}
                                  {it.note ? ` (ملاحظة: ${it.note})` : ''}
                                </span>
                                <span className="tabular-nums font-bold">{it.totalPrice} ج.م</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Order Status Action Buttons Bar */}
                      <div className="order-actions-bar">
                        <div className="status-button-group" role="group" aria-label="تحديد حالة الطلب">
                          <button
                            type="button"
                            className={`status-choice-btn ${status === 'new' || status === 'pending' ? 'active-new' : ''}`}
                            onClick={() => handleSetOrderStatus(ord.id, 'new')}
                          >
                            <Clock size={14} aria-hidden="true" />
                            <span>طلب جديد</span>
                          </button>

                          <button
                            type="button"
                            className={`status-choice-btn ${status === 'preparing' ? 'active-prep' : ''}`}
                            onClick={() => handleSetOrderStatus(ord.id, 'preparing')}
                          >
                            <RefreshCw size={14} aria-hidden="true" />
                            <span>قيد التحضير</span>
                          </button>

                          <button
                            type="button"
                            className={`status-choice-btn ${status === 'delivered' || status === 'completed' ? 'active-done' : ''}`}
                            onClick={() => handleSetOrderStatus(ord.id, 'delivered')}
                          >
                            <CheckCircle2 size={14} aria-hidden="true" />
                            <span>تم التسليم</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          className="order-delete-inline-btn"
                          onClick={() => handleDeleteOrder(ord.id)}
                          title="حذف هذا الطلب نهائياً"
                        >
                          <Trash2 size={14} aria-hidden="true" />
                          <span>حذف الطلب</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>

      {/* MODAL: ADD NEW PRODUCT (Direct Supabase Storage Upload & Spacious Layout) */}
      {isAddModalOpen && (
        <div 
          className="admin-modal-backdrop" 
          onClick={() => {
            if (!isUploadingNewProd) setIsAddModalOpen(false);
          }} 
          role="dialog" 
          aria-modal="true"
          aria-labelledby="add-prod-modal-title"
        >
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h2 id="add-prod-modal-title" className="admin-modal-title">إضافة صنف لحم جديد لقائمة المتجر</h2>
                <p className="admin-modal-subtitle">أدخل بيانات القطعية وارفع صورتها لتنحفظ تلقائياً في Supabase Storage.</p>
              </div>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setIsAddModalOpen(false)}
                disabled={isUploadingNewProd}
                aria-label="إغلاق النافذة"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleAddProductSubmit} className="admin-modal-form">
              <div className="admin-modal-scroll-area">
                {/* Product Names: Arabic & English */}
                <div className="modal-two-columns">
                  <div className="form-group">
                    <label htmlFor="new-prod-name">اسم الصنف باللغة العربية: *</label>
                    <input
                      id="new-prod-name"
                      type="text"
                      placeholder="مثال: ريش بتلو بلدي"
                      value={newProdName}
                      onChange={(e) => setNewProdName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="new-prod-en">الاسم بالإنجليزية (اختياري):</label>
                    <input
                      id="new-prod-en"
                      type="text"
                      placeholder="مثال: Veal Ribs"
                      value={newProdEnglish}
                      onChange={(e) => setNewProdEnglish(e.target.value)}
                    />
                  </div>
                </div>

                {/* Price & Category */}
                <div className="modal-two-columns">
                  <div className="form-group">
                    <label htmlFor="new-prod-price">سعر الكيلو (ج.م): *</label>
                    <div className="price-input-wrapper">
                      <input
                        id="new-prod-price"
                        type="number"
                        min="1"
                        placeholder="550"
                        value={newProdPrice}
                        onChange={(e) => setNewProdPrice(e.target.value)}
                        required
                        className="tabular-nums"
                      />
                      <span className="unit-label">ج.م/كجم</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="new-prod-cat">القسم / التصنيف: *</label>
                    <select
                      id="new-prod-cat"
                      value={newProdCategory}
                      onChange={(e) => setNewProdCategory(e.target.value)}
                      className="modal-select-field"
                    >
                      {categories.map((c) => (
                        <option key={c.id || c.slug} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Cutting Options Toggle & Manager */}
                <div className="product-cutting-manager-card">
                  <div className="cutting-toggle-header">
                    <div className="toggle-info">
                      <label htmlFor="new-prod-has-cutting" className="cutting-label-bold">
                        هل يتوفر خيارات تقطيع لهذا الصنف؟
                      </label>
                      <span className="cutting-desc-hint">
                        فعّل هذا الخيار إذا كان الصنف يقبل التقطيع (مثل اللحوم والموز والاستيك)، أو عطّله إذا كان الصنف مجهزاً مسبقاً (مثل المصنعات أو السجق أو البرجر أو عجين الحواوشي).
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      id="new-prod-has-cutting"
                      checked={newProdHasCutting}
                      onChange={(e) => setNewProdHasCutting(e.target.checked)}
                      className="styled-toggle-checkbox"
                    />
                  </div>

                  {newProdHasCutting && (
                    <div className="cutting-tags-container">
                      <div className="cuts-tag-list">
                        {newProdCuts.map((cut, idx) => (
                          <span key={idx} className="cutting-tag-chip">
                            <span>{cut}</span>
                            <button
                              type="button"
                              className="remove-cut-btn"
                              onClick={() => setNewProdCuts((prev) => prev.filter((_, i) => i !== idx))}
                              aria-label={`حذف تقطيع ${cut}`}
                            >
                              <X size={12} aria-hidden="true" />
                            </button>
                          </span>
                        ))}
                      </div>

                      <div className="add-cut-input-row">
                        <input
                          type="text"
                          placeholder="اكتب خيار تقطيع جديد (مثلاً: شرائح بفتيك مدقوق، مكعبات كباب حلة...)"
                          value={newProdCutInput}
                          onChange={(e) => setNewProdCutInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newProdCutInput.trim() && !newProdCuts.includes(newProdCutInput.trim())) {
                                setNewProdCuts((prev) => [...prev, newProdCutInput.trim()]);
                                setNewProdCutInput('');
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="add-cut-btn"
                          onClick={() => {
                            if (newProdCutInput.trim() && !newProdCuts.includes(newProdCutInput.trim())) {
                              setNewProdCuts((prev) => [...prev, newProdCutInput.trim()]);
                              setNewProdCutInput('');
                            }
                          }}
                        >
                          <Plus size={14} aria-hidden="true" />
                          <span>إضافة خيار</span>
                        </button>
                      </div>

                      <div className="quick-presets-row">
                        <span className="presets-label">خيارات تقطيع شائعة للإضافة بنقرة واحدة:</span>
                        <div className="presets-chips">
                          {['قطع كباب حلة', 'مكعبات خضار', 'سلق للشوربة', 'شرائح ستيك', 'بفتيك مدقوق', 'شاورما', 'فرم وش واحد', 'فرم وشين', 'سليم بدون تقطيع'].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              className={`preset-chip-btn ${newProdCuts.includes(preset) ? 'disabled' : ''}`}
                              disabled={newProdCuts.includes(preset)}
                              onClick={() => setNewProdCuts((prev) => [...prev, preset])}
                            >
                              + {preset}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* SUPABASE STORAGE IMAGE UPLOAD SECTION */}
                <div className="form-group image-upload-section-group">
                  <label>صورة المنتج (يتم حفظها في Supabase Storage):</label>

                  <div className="uploader-composite-card">
                    {/* Visual File Dropzone */}
                    <label 
                      htmlFor="modal-file-upload-input" 
                      className={`upload-dropzone ${newProdImagePreview ? 'has-preview' : ''}`}
                    >
                      {newProdImagePreview ? (
                        <div className="preview-container">
                          <img 
                            src={newProdImagePreview} 
                            alt="معاينة الصورة" 
                            className="uploaded-image-preview" 
                          />
                          <div className="preview-overlay">
                            <Upload size={18} aria-hidden="true" />
                            <span>تغيير هذه الصورة</span>
                          </div>
                          <button
                            type="button"
                            className="remove-preview-corner-btn"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setNewProdImage('');
                              setNewProdImageFile(null);
                              setNewProdImagePreview(null);
                            }}
                            title="إزالة الصورة"
                            aria-label="إزالة الصورة"
                          >
                            <Trash2 size={15} aria-hidden="true" />
                          </button>
                        </div>
                      ) : (
                        <div className="dropzone-empty-state">
                          <div className="upload-circle-icon">
                            <Upload size={24} aria-hidden="true" />
                          </div>
                          <span className="dropzone-main-text">اضغط هنا لاختيار صورة من جهازك / هاتفك</span>
                          <span className="dropzone-sub-text">سيتم رفعها وحفظها في Supabase Storage تلقائياً (JPG, PNG, WEBP)</span>
                        </div>
                      )}

                      <input
                        id="modal-file-upload-input"
                        type="file"
                        accept="image/*"
                        className="visually-hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setNewProdImageFile(file);
                            setNewProdImagePreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>

                    {/* Presets & Direct URL Fallback */}
                    <div className="uploader-alternatives">
                      <div className="preset-shortcuts">
                        <span className="shortcuts-label">أو اختر صورة جاهزة سريعة:</span>
                        <div className="preset-buttons-strip">
                          <button
                            type="button"
                            className="preset-chip"
                            onClick={() => {
                              setNewProdImage('/assets/products/steaks.jpg');
                              setNewProdImagePreview('/assets/products/steaks.jpg');
                              setNewProdImageFile(null);
                            }}
                          >
                            ستيك فاخر
                          </button>
                          <button
                            type="button"
                            className="preset-chip"
                            onClick={() => {
                              setNewProdImage('/assets/products/stew.jpg');
                              setNewProdImagePreview('/assets/products/stew.jpg');
                              setNewProdImageFile(null);
                            }}
                          >
                            طبيخ وموزة
                          </button>
                          <button
                            type="button"
                            className="preset-chip"
                            onClick={() => {
                              setNewProdImage('/assets/products/specialties.jpg');
                              setNewProdImagePreview('/assets/products/specialties.jpg');
                              setNewProdImageFile(null);
                            }}
                          >
                            سجق ومفروم
                          </button>
                          <button
                            type="button"
                            className="preset-chip"
                            onClick={() => {
                              setNewProdImage('/assets/products/liver.jpg');
                              setNewProdImagePreview('/assets/products/liver.jpg');
                              setNewProdImageFile(null);
                            }}
                          >
                            كبدة بلدي
                          </button>
                        </div>
                      </div>

                      <div className="direct-url-fallback">
                        <label htmlFor="new-prod-image-url" className="url-label">أو الصق رابط صورة خارجي:</label>
                        <input
                          id="new-prod-image-url"
                          type="text"
                          value={newProdImage}
                          onChange={(e) => {
                            setNewProdImage(e.target.value);
                            setNewProdImagePreview(e.target.value);
                            setNewProdImageFile(null);
                          }}
                          placeholder="https://..."
                          className="url-input-field"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="form-group">
                  <label htmlFor="new-prod-desc">الوصف وطريقة الطهي المقترحة:</label>
                  <textarea
                    id="new-prod-desc"
                    rows="3"
                    placeholder="وصف مختصر لمميزات القطعية وأفضل طرق طهيها لتحفيز العميل على الطلب…"
                    value={newProdDesc}
                    onChange={(e) => setNewProdDesc(e.target.value)}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isUploadingNewProd}
                >
                  إلغاء
                </button>

                <button 
                  type="submit" 
                  className="modal-submit-action-btn"
                  disabled={isUploadingNewProd}
                >
                  {isUploadingNewProd ? (
                    <>
                      <RefreshCw size={17} className="spin" aria-hidden="true" />
                      <span>جاري الرفع لـ Supabase وحفظ الصنف…</span>
                    </>
                  ) : (
                    <>
                      <Plus size={17} aria-hidden="true" />
                      <span>إضافة المنتج للمتجر فوراً</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PRODUCT */}
      {editingProductModal && (
        <div 
          className="admin-modal-backdrop" 
          onClick={() => {
            if (!isSavingEditProd) setEditingProductModal(null);
          }} 
          role="dialog" 
          aria-modal="true"
          aria-labelledby="edit-prod-modal-title"
        >
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h2 id="edit-prod-modal-title" className="admin-modal-title">
                  تعديل صنف: {editProdName || editingProductModal.name}
                </h2>
                <p className="admin-modal-subtitle">
                  تعديل تفاصيل الصنف، السعر، القسم، أو تغيير / إزالة الصورة مع المزامنة التلقائية لـ Supabase.
                </p>
              </div>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setEditingProductModal(null)}
                disabled={isSavingEditProd}
                aria-label="إغلاق النافذة"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSaveEditProductSubmit} className="admin-modal-form">
              <div className="admin-modal-scroll-area">
                {/* Names: Arabic & English */}
                <div className="modal-two-columns">
                  <div className="form-group">
                    <label htmlFor="edit-prod-name">اسم الصنف باللغة العربية: *</label>
                    <input
                      id="edit-prod-name"
                      type="text"
                      placeholder="مثال: عرق فلتو"
                      value={editProdName}
                      onChange={(e) => setEditProdName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-prod-en">الاسم بالإنجليزية (اختياري):</label>
                    <input
                      id="edit-prod-en"
                      type="text"
                      placeholder="مثال: Fillet"
                      value={editProdEnglish}
                      onChange={(e) => setEditProdEnglish(e.target.value)}
                    />
                  </div>
                </div>

                {/* Price & Category */}
                <div className="modal-two-columns">
                  <div className="form-group">
                    <label htmlFor="edit-prod-price">سعر الكيلو (ج.م): *</label>
                    <div className="price-input-wrapper">
                      <input
                        id="edit-prod-price"
                        type="number"
                        min="1"
                        placeholder="520"
                        value={editProdPrice}
                        onChange={(e) => setEditProdPrice(e.target.value)}
                        required
                        className="tabular-nums"
                      />
                      <span className="unit-label">ج.م/كجم</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-prod-cat">القسم / التصنيف: *</label>
                    <select
                      id="edit-prod-cat"
                      value={editProdCategory}
                      onChange={(e) => setEditProdCategory(e.target.value)}
                      className="modal-select-field"
                    >
                      {categories.map((c) => (
                        <option key={c.id || c.slug} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Cutting Options Toggle & Manager */}
                <div className="product-cutting-manager-card">
                  <div className="cutting-toggle-header">
                    <div className="toggle-info">
                      <label htmlFor="edit-prod-has-cutting" className="cutting-label-bold">
                        هل يتوفر خيارات تقطيع لهذا الصنف؟
                      </label>
                      <span className="cutting-desc-hint">
                        فعّل هذا الخيار إذا كان الصنف يقبل التقطيع (مثل اللحوم والموز والاستيك)، أو عطّله إذا كان الصنف مجهزاً مسبقاً (مثل المصنعات أو السجق أو البرجر أو عجين الحواوشي).
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      id="edit-prod-has-cutting"
                      checked={editProdHasCutting}
                      onChange={(e) => setEditProdHasCutting(e.target.checked)}
                      className="styled-toggle-checkbox"
                    />
                  </div>

                  {editProdHasCutting && (
                    <div className="cutting-tags-container">
                      <div className="cuts-tag-list">
                        {editProdCuts.map((cut, idx) => (
                          <span key={idx} className="cutting-tag-chip">
                            <span>{cut}</span>
                            <button
                              type="button"
                              className="remove-cut-btn"
                              onClick={() => setEditProdCuts((prev) => prev.filter((_, i) => i !== idx))}
                              aria-label={`حذف تقطيع ${cut}`}
                            >
                              <X size={12} aria-hidden="true" />
                            </button>
                          </span>
                        ))}
                      </div>

                      <div className="add-cut-input-row">
                        <input
                          type="text"
                          placeholder="اكتب خيار تقطيع جديد (مثلاً: شرائح بفتيك مدقوق، مكعبات كباب حلة...)"
                          value={editProdCutInput}
                          onChange={(e) => setEditProdCutInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (editProdCutInput.trim() && !editProdCuts.includes(editProdCutInput.trim())) {
                                setEditProdCuts((prev) => [...prev, editProdCutInput.trim()]);
                                setEditProdCutInput('');
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="add-cut-btn"
                          onClick={() => {
                            if (editProdCutInput.trim() && !editProdCuts.includes(editProdCutInput.trim())) {
                              setEditProdCuts((prev) => [...prev, editProdCutInput.trim()]);
                              setEditProdCutInput('');
                            }
                          }}
                        >
                          <Plus size={14} aria-hidden="true" />
                          <span>إضافة خيار</span>
                        </button>
                      </div>

                      <div className="quick-presets-row">
                        <span className="presets-label">خيارات تقطيع شائعة للإضافة بنقرة واحدة:</span>
                        <div className="presets-chips">
                          {['قطع كباب حلة', 'مكعبات خضار', 'سلق للشوربة', 'شرائح ستيك', 'بفتيك مدقوق', 'شاورما', 'فرم وش واحد', 'فرم وشين', 'سليم بدون تقطيع'].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              className={`preset-chip-btn ${editProdCuts.includes(preset) ? 'disabled' : ''}`}
                              disabled={editProdCuts.includes(preset)}
                              onClick={() => setEditProdCuts((prev) => [...prev, preset])}
                            >
                              + {preset}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* PRODUCT-SPECIFIC DISCOUNT SECTION */}
                <div className="admin-modal-discount-group">
                  <div className="discount-group-header">
                    <label className="checkbox-label-toggle" htmlFor="edit-prod-discount-toggle">
                      <input
                        id="edit-prod-discount-toggle"
                        type="checkbox"
                        checked={editProdDiscountEnabled}
                        onChange={(e) => setEditProdDiscountEnabled(e.target.checked)}
                      />
                      <Percent size={15} className="gold-accent-icon" aria-hidden="true" />
                      <span className="toggle-title">تفعيل خصم خاص على هذا الصنف تحديداً</span>
                    </label>
                  </div>

                  {editProdDiscountEnabled && (
                    <div className="discount-group-fields">
                      <div className="form-group">
                        <label htmlFor="edit-prod-discount-pct">نسبة الخصم (%): *</label>
                        <div className="input-with-icon">
                          <Percent size={16} className="field-icon" aria-hidden="true" />
                          <input
                            id="edit-prod-discount-pct"
                            type="number"
                            min="1"
                            max="90"
                            value={editProdDiscountPercent}
                            onChange={(e) => setEditProdDiscountPercent(e.target.value)}
                            required
                            className="tabular-nums"
                          />
                        </div>
                      </div>

                      <div className="modal-two-columns">
                        <div className="form-group">
                          <label htmlFor="edit-prod-discount-start">تاريخ ووقت بدء الخصم (اختياري):</label>
                          <input
                            id="edit-prod-discount-start"
                            type="datetime-local"
                            value={editProdDiscountStartDate}
                            onChange={(e) => setEditProdDiscountStartDate(e.target.value)}
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="edit-prod-discount-end">تاريخ ووقت انتهاء الخصم (اختياري):</label>
                          <input
                            id="edit-prod-discount-end"
                            type="datetime-local"
                            value={editProdDiscountEndDate}
                            onChange={(e) => setEditProdDiscountEndDate(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Live Price Calculation Preview */}
                      {editProdPrice && (
                        <div className="modal-discount-preview-row">
                          <span className="preview-label">السعر بعد الخصم:</span>
                          <span className="preview-original-slashed tabular-nums">{editProdPrice} ج.م</span>
                          <span className="preview-arrow">←</span>
                          <span className="preview-calc-price tabular-nums">
                            {Math.round(Number(editProdPrice) * (1 - (Number(editProdDiscountPercent) || 0) / 100))} ج.م / كجم
                          </span>
                          <span className="preview-saving-badge tabular-nums">
                            (توفير {Math.round(Number(editProdPrice) * ((Number(editProdDiscountPercent) || 0) / 100))} ج.م)
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* IMAGE UPLOAD & REMOVE SECTION */}
                <div className="form-group image-upload-section-group">
                  <div className="image-field-label-row">
                    <label>صورة المنتج (Supabase Storage):</label>
                    {editProdImagePreview && (
                      <button
                        type="button"
                        className="remove-photo-inline-btn"
                        onClick={handleRemoveEditModalImage}
                        title="حذف الصورة وإزالتها تماماً من السيرفر"
                      >
                        <Trash2 size={13} aria-hidden="true" />
                        <span>إزالة الصورة تماماً</span>
                      </button>
                    )}
                  </div>

                  <div className="uploader-composite-card">
                    {/* Visual File Dropzone */}
                    <label 
                      htmlFor="edit-modal-file-input" 
                      className={`upload-dropzone ${editProdImagePreview ? 'has-preview' : ''}`}
                    >
                      {editProdImagePreview ? (
                        <div className="preview-container">
                          <img 
                            src={editProdImagePreview} 
                            alt="معاينة الصورة" 
                            className="uploaded-image-preview" 
                          />
                          <div className="preview-overlay">
                            <Upload size={18} aria-hidden="true" />
                            <span>رفع صورة بديلة من جهازك</span>
                          </div>
                          <button
                            type="button"
                            className="remove-preview-corner-btn"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRemoveEditModalImage();
                            }}
                            title="إزالة الصورة"
                            aria-label="إزالة الصورة"
                          >
                            <Trash2 size={15} aria-hidden="true" />
                          </button>
                        </div>
                      ) : (
                        <div className="dropzone-empty-state">
                          <div className="upload-circle-icon">
                            <Upload size={24} aria-hidden="true" />
                          </div>
                          <span className="dropzone-main-text">اضغط هنا لاختيار صورة من جهازك / هاتفك</span>
                          <span className="dropzone-sub-text">سيتم رفعها وحفظها في Supabase Storage تلقائياً (JPG, PNG, WEBP)</span>
                        </div>
                      )}

                      <input
                        id="edit-modal-file-input"
                        type="file"
                        accept="image/*"
                        className="visually-hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setEditProdImageFile(file);
                            setEditProdImagePreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>

                    {/* Presets & Direct URL Fallback */}
                    <div className="uploader-alternatives">
                      <div className="preset-shortcuts">
                        <span className="shortcuts-label">أو اختر صورة جاهزة سريعة:</span>
                        <div className="preset-buttons-strip">
                          <button
                            type="button"
                            className="preset-chip"
                            onClick={() => {
                              setEditProdImage('/assets/products/steaks.jpg');
                              setEditProdImagePreview('/assets/products/steaks.jpg');
                              setEditProdImageFile(null);
                            }}
                          >
                            ستيك فاخر
                          </button>
                          <button
                            type="button"
                            className="preset-chip"
                            onClick={() => {
                              setEditProdImage('/assets/products/stew.jpg');
                              setEditProdImagePreview('/assets/products/stew.jpg');
                              setEditProdImageFile(null);
                            }}
                          >
                            طبيخ وموزة
                          </button>
                          <button
                            type="button"
                            className="preset-chip"
                            onClick={() => {
                              setEditProdImage('/assets/products/specialties.jpg');
                              setEditProdImagePreview('/assets/products/specialties.jpg');
                              setEditProdImageFile(null);
                            }}
                          >
                            سجق ومفروم
                          </button>
                          <button
                            type="button"
                            className="preset-chip"
                            onClick={() => {
                              setEditProdImage('/assets/products/liver.jpg');
                              setEditProdImagePreview('/assets/products/liver.jpg');
                              setEditProdImageFile(null);
                            }}
                          >
                            كبدة بلدي
                          </button>
                        </div>
                      </div>

                      <div className="direct-url-fallback">
                        <label htmlFor="edit-prod-image-url" className="url-label">أو الصق رابط صورة خارجي (أو اتركه فارغاً بدون صورة):</label>
                        <input
                          id="edit-prod-image-url"
                          type="text"
                          value={editProdImage}
                          onChange={(e) => {
                            setEditProdImage(e.target.value);
                            setEditProdImagePreview(e.target.value || null);
                            setEditProdImageFile(null);
                          }}
                          placeholder="https://..."
                          className="url-input-field"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="form-group">
                  <label htmlFor="edit-prod-desc">الوصف وطريقة الطهي المقترحة:</label>
                  <textarea
                    id="edit-prod-desc"
                    rows="3"
                    placeholder="وصف مختصر لمميزات القطعية وأفضل طرق طهيها…"
                    value={editProdDesc}
                    onChange={(e) => setEditProdDesc(e.target.value)}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="modal-delete-danger-btn"
                  onClick={() => handleDeleteProductAction(editingProductModal.id, editingProductModal.image_url)}
                  disabled={isSavingEditProd}
                  title="مسح الصنف نهائياً"
                >
                  <Trash2 size={16} aria-hidden="true" />
                  <span>حذف الصنف</span>
                </button>

                <div className="modal-footer-actions-right">
                  <button
                    type="button"
                    className="modal-cancel-btn"
                    onClick={() => setEditingProductModal(null)}
                    disabled={isSavingEditProd}
                  >
                    إلغاء
                  </button>

                  <button 
                    type="submit" 
                    className="modal-submit-action-btn"
                    disabled={isSavingEditProd}
                  >
                    {isSavingEditProd ? (
                      <>
                        <RefreshCw size={17} className="spin" aria-hidden="true" />
                        <span>جاري حفظ التعديلات في Supabase…</span>
                      </>
                    ) : (
                      <>
                        <Check size={17} aria-hidden="true" />
                        <span>حفظ التعديلات الآن</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: ADD CATEGORY */}
      {isAddCatModalOpen && (
        <div
          className="admin-modal-backdrop"
          onClick={() => setIsAddCatModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-cat-modal-title"
        >
          <div className="admin-modal-card compact" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h2 id="add-cat-modal-title" className="admin-modal-title">إضافة قسم جديد للمتجر</h2>
                <p className="admin-modal-subtitle">أدخل اسم القسم الجديد باللغة العربية والمعرّف الإنجليزي.</p>
              </div>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setIsAddCatModalOpen(false)}
                aria-label="إغلاق النافذة"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleAddCategorySubmit} className="admin-modal-form">
              <div className="admin-modal-scroll-area">
                <div className="form-group">
                  <label htmlFor="new-cat-name">اسم القسم باللغة العربية: *</label>
                  <input
                    id="new-cat-name"
                    type="text"
                    placeholder="مثال: لحوم بتلو وضاني بلدي"
                    value={newCatName}
                    onChange={(e) => {
                      setNewCatName(e.target.value);
                      if (!newCatSlug) {
                        setNewCatSlug(
                          e.target.value
                            .trim()
                            .toLowerCase()
                            .replace(/\s+/g, '-')
                            .replace(/[^\w-]/g, '')
                        );
                      }
                    }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="new-cat-slug">
                    المعرّف بالإنجليزية (Slug):
                    <span className="hint-text">(يستخدم في الربط، اتركه فارغاً لإنشائه تلقائياً)</span>
                  </label>
                  <input
                    id="new-cat-slug"
                    type="text"
                    placeholder="مثال: veal-lamb"
                    value={newCatSlug}
                    onChange={(e) => setNewCatSlug(e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setIsAddCatModalOpen(false)}
                >
                  إلغاء
                </button>

                <button type="submit" className="modal-submit-action-btn">
                  <Plus size={16} aria-hidden="true" />
                  <span>إضافة القسم الآن</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT CATEGORY */}
      {editingCategory && (
        <div
          className="admin-modal-backdrop"
          onClick={() => setEditingCategory(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-cat-modal-title"
        >
          <div className="admin-modal-card compact" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h2 id="edit-cat-modal-title" className="admin-modal-title">تعديل القسم: {editingCategory.name}</h2>
                <p className="admin-modal-subtitle">تعديل اسم القسم أو المعرّف الخاص به.</p>
              </div>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setEditingCategory(null)}
                aria-label="إغلاق النافذة"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleEditCategorySubmit} className="admin-modal-form">
              <div className="admin-modal-scroll-area">
                <div className="form-group">
                  <label htmlFor="edit-cat-name">اسم القسم باللغة العربية: *</label>
                  <input
                    id="edit-cat-name"
                    type="text"
                    value={editCatName}
                    onChange={(e) => setEditCatName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-cat-slug">المعرّف بالإنجليزية (Slug):</label>
                  <input
                    id="edit-cat-slug"
                    type="text"
                    value={editCatSlug}
                    onChange={(e) => setEditCatSlug(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setEditingCategory(null)}
                >
                  إلغاء
                </button>

                <button type="submit" className="modal-submit-action-btn">
                  <Check size={16} aria-hidden="true" />
                  <span>حفظ التعديل</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
