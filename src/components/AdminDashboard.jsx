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
  ShieldCheck
} from 'lucide-react';
import { supabase, uploadProductImage, deleteProductImage } from '../supabaseClient';
import { computePinHash } from './AdminAuthGuard';

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
  onReturnToStore,
  onLogout
}) {
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'settings', 'orders'
  
  // Settings Form State
  const [whatsappNumber, setWhatsappNumber] = useState(storeSettings?.whatsapp_number || '201000000000');
  const [storeName, setStoreName] = useState(storeSettings?.store_name || 'حلاوة العنتبلي');
  const [slogan, setSlogan] = useState(storeSettings?.slogan || 'عارف يعني ايه لحمة ؟!');
  const [storeAddress, setStoreAddress] = useState(storeSettings?.address || 'القاهرة، مصر');
  const [mapsUrl, setMapsUrl] = useState(storeSettings?.maps_url || 'https://maps.app.goo.gl/koT5YPn28VA48SZU7');
  const [deliveryFee, setDeliveryFee] = useState(storeSettings?.delivery_fee ?? 30);
  const [announcement, setAnnouncement] = useState(storeSettings?.announcement_banner || '');
  const [isStoreOpen, setIsStoreOpen] = useState(storeSettings?.is_store_open ?? true);
  const [showHeroBanner, setShowHeroBanner] = useState(storeSettings?.show_hero_banner !== false);
  const [heroTitle, setHeroTitle] = useState(storeSettings?.hero_title || 'عارف يعني ايه لحمة ؟!');
  const [heroDescription, setHeroDescription] = useState(
    storeSettings?.hero_description || 'أصول الجزارة البلدي من قلب المذبح. ننتقي لك أنعم القطعيات الطازجة، ونجهزها بتقطيعك المفضل ونوصلها لباب بيتك مباشرة عبر الواتساب.'
  );
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
  const [newProdImage, setNewProdImage] = useState('/assets/products/steaks.jpg');
  const [newProdImageFile, setNewProdImageFile] = useState(null);
  const [newProdImagePreview, setNewProdImagePreview] = useState(null);
  const [isUploadingNewProd, setIsUploadingNewProd] = useState(false);
  const [newProdDesc, setNewProdDesc] = useState('');

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
      setDeliveryFee(storeSettings.delivery_fee ?? 30);
      setAnnouncement(storeSettings.announcement_banner || '');
      setIsStoreOpen(storeSettings.is_store_open ?? true);
      setShowHeroBanner(storeSettings.show_hero_banner !== false);
      setHeroTitle(storeSettings.hero_title || 'عارف يعني ايه لحمة ؟!');
      setHeroDescription(
        storeSettings.hero_description || 'أصول الجزارة البلدي من قلب المذبح. ننتقي لك أنعم القطعيات الطازجة، ونجهزها بتقطيعك المفضل ونوصلها لباب بيتك مباشرة عبر الواتساب.'
      );
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

  // Change order status
  const handleToggleOrderStatus = (orderId, currentStatus) => {
    const nextStatus = currentStatus === 'delivered' ? 'new' : currentStatus === 'preparing' ? 'delivered' : 'preparing';
    const updated = orders.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o));
    setOrders(updated);
    try {
      localStorage.setItem('halawa_orders', JSON.stringify(updated));
      supabase.from('orders').update({ status: nextStatus }).eq('id', orderId).then();
    } catch {}
  };

  // Delete single order
  const handleDeleteOrder = (orderId) => {
    if (!window.confirm('هل تريد مسح هذا الطلب من السجل؟')) return;
    const updated = orders.filter((o) => o.id !== orderId);
    setOrders(updated);
    try {
      localStorage.setItem('halawa_orders', JSON.stringify(updated));
      supabase.from('orders').delete().eq('id', orderId).then();
    } catch {}
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
      delivery_fee: Number(deliveryFee),
      announcement_banner: announcement.trim(),
      is_store_open: isStoreOpen,
      show_hero_banner: showHeroBanner,
      hero_title: heroTitle.trim(),
      hero_description: heroDescription.trim()
    };

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

    // Save to Supabase (with fallback to core columns if new columns don't exist yet)
    try {
      const { error } = await supabase
        .from('store_settings')
        .upsert({ id: 'main_config', ...updated });

      if (error) {
        console.warn('Full settings upsert notice, using core fallback:', error.message);
        const corePayload = {
          id: 'main_config',
          whatsapp_number: cleanNumber,
          store_name: storeName.trim(),
          slogan: slogan.trim(),
          address: storeAddress.trim(),
          delivery_fee: Number(deliveryFee),
          announcement_banner: announcement.trim(),
          is_store_open: isStoreOpen
        };
        await supabase.from('store_settings').upsert(corePayload);
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
    setEditingProductModal(product);
    setEditProdName(product.name || '');
    setEditProdEnglish(product.english_name || '');
    setEditProdPrice(product.price_per_kg || '');
    setEditProdCategory(product.category || 'premium-steaks');
    setEditProdDesc(product.description || '');
    setEditProdImage(product.image_url || '');
    setEditProdImageFile(null);
    setEditProdImagePreview(product.image_url || null);
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
        description: editProdDesc.trim() || ''
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
      let finalImageUrl = newProdImage.trim() || '/assets/products/steaks.jpg';

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
        available_cuts: ['مكعبات وسط', 'قطع سلق', 'مفروم'],
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
      setNewProdImage('/assets/products/steaks.jpg');
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
            className={`admin-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={17} aria-hidden="true" />
            <span>إعدادات المتجر ورقم الواتساب</span>
          </button>

          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <ShoppingBag size={17} aria-hidden="true" />
            <span>سجل الطلبات الواردة</span>
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
                const currentImage = p.image_url || '/assets/products/steaks.jpg';
                const editedImage = editingImages[p.id] ?? currentImage;
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
                      {p.badge && (
                        <span className="admin-badge-indicator">{p.badge}</span>
                      )}
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

        {/* TAB 2: STORE & WHATSAPP SETTINGS */}
        {activeTab === 'settings' && (
          <section className="admin-tab-pane" aria-labelledby="settings-heading">
            <form className="admin-clean-form" onSubmit={handleSaveSettings}>
              <div className="form-legend">
                <h2 id="settings-heading" className="pane-heading">إعدادات الاتصال واستقبال الطلبات</h2>
                <p className="pane-subheading">تحديد رقم الواتساب الذي يستقبل رسائل فواتير العملاء.</p>
              </div>

              {/* WhatsApp Receiver Field */}
              <div className="form-group primary-highlight">
                <label htmlFor="admin-whatsapp-number">
                  رقم الواتساب المستلم للطلبات: *
                  <span className="hint-text">(اكتب الرقم بكود الدولة بدون علامة + وبدون مسافات، مثال: 201012345678)</span>
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
                <p className="field-instruction">
                  توجيه جميع طلبات سلة العملاء مباشرة إلى هذا الرقم كفاتورة إلكترونية مفصلة.
                </p>
              </div>

              {/* HERO BANNER EDIT & TOGGLE SECTION */}
              <div className="admin-hero-control-card">
                <div className="hero-control-header">
                  <div className="hero-control-meta">
                    <div className="hero-icon-title">
                      <Sparkles size={20} className="gold-accent-icon" aria-hidden="true" />
                      <h3 className="hero-control-heading">قسم الواجهة الترحيبية أعلى المتجر (Hero Banner)</h3>
                    </div>
                    <p className="hero-control-desc">
                      يمكنك تعديل نصوص قسم ("عارف يعني ايه لحمة ؟!") أو إخفائه بالكامل من المتجر في أي وقت.
                    </p>
                  </div>

                  <div className="hero-toggle-area">
                    <label className="hero-toggle-pill" htmlFor="hero-banner-switch">
                      <input
                        id="hero-banner-switch"
                        type="checkbox"
                        className="hero-switch-input"
                        checked={showHeroBanner}
                        onChange={(e) => handleToggleHeroBanner(e.target.checked)}
                      />
                      <span className="hero-toggle-indicator">
                        {showHeroBanner ? (
                          <>
                            <Eye size={15} aria-hidden="true" />
                            <span>معروض في المتجر</span>
                          </>
                        ) : (
                          <>
                            <EyeOff size={15} aria-hidden="true" />
                            <span>مخفي من المتجر</span>
                          </>
                        )}
                      </span>
                    </label>
                  </div>
                </div>

                {showHeroBanner && (
                  <div className="hero-fields-grid">
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
                        <h4 className="preview-title">{heroTitle || 'عارف يعني ايه لحمة ؟!'}</h4>
                        <p className="preview-desc">
                          {heroDescription || 'أصول الجزارة البلدي من قلب المذبح. ننتقي لك أنعم القطعيات الطازجة، ونجهزها بتقطيعك المفضل ونوصلها لباب بيتك مباشرة عبر الواتساب.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Store Name & Slogan */}
              <div className="form-two-cols">
                <div className="form-group">
                  <label htmlFor="admin-store-name">اسم المتجر / العلامة التجارية:</label>
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

              {/* Delivery Fee & Store Open Status */}
              <div className="form-two-cols">
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

                <div className="form-group">
                  <label htmlFor="admin-store-status">حالة المتجر الآن:</label>
                  <select
                    id="admin-store-status"
                    value={isStoreOpen ? 'open' : 'closed'}
                    onChange={(e) => handleStoreStatusChange(e.target.value === 'open')}
                  >
                    <option value="open">المتجر مفتوح ويستقبل الطلبات</option>
                    <option value="closed">المتجر مغلق مؤقتاً</option>
                  </select>
                </div>
              </div>

              {/* Store / Branch Address */}
              <div className="form-group">
                <label htmlFor="admin-store-address">عنوان الفرع الرئيسي للجزارة (للاستلام من الفرع):</label>
                <div className="input-with-icon">
                  <Store size={18} className="field-icon" aria-hidden="true" />
                  <input
                    id="admin-store-address"
                    type="text"
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                    placeholder="مثال: القاهرة، مصر — شارع التحرير، الدقي"
                  />
                </div>
                <small className="field-hint">يظهر هذا العنوان للعملاء عند اختيار طريقة (الاستلام من الفرع).</small>
              </div>

              {/* Store / Branch Google Maps Location URL */}
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
                <small className="field-hint">رابط اللوكيشن الذي يفتح خريطة Google Maps للعميل عند اختيار الاستلام من الفرع وفي رسالة الواتساب.</small>
              </div>

              {/* Announcement Banner */}
              <div className="form-group">
                <label htmlFor="admin-announcement">شريط الإعلانات الترويجي أعلى المتجر:</label>
                <input
                  id="admin-announcement"
                  type="text"
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  placeholder="طازج ومذبوح يومياً بإشراف بيطري كامل — توصيل سريع لجميع المناطق"
                />
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
                  <span>حفظ التعديلات والإعدادات</span>
                </button>

                {settingsSavedMessage && (
                  <span className="save-success-tag" role="status" aria-live="polite">
                    <Check size={16} aria-hidden="true" />
                    <span>تم حفظ الإعدادات وتحديث المتجر بنجاح!</span>
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
                            {status === 'delivered' ? 'تم التسليم' : status === 'preparing' ? 'جاري التجهيز' : 'طلب جديد'}
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

                      {/* Status Toggle Action */}
                      <div className="order-actions-bar">
                        <span className="status-label">تحديث الحالة:</span>
                        <button
                          type="button"
                          className="status-toggle-btn"
                          onClick={() => handleToggleOrderStatus(ord.id, status)}
                        >
                          <CheckCircle2 size={14} aria-hidden="true" />
                          <span>
                            {status === 'new' ? 'بدء التجهيز' : status === 'preparing' ? 'تأكيد التسليم' : 'إعادة كجديد'}
                          </span>
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
                      <option value="premium-steaks">قطعيات وستيك فاخر</option>
                      <option value="cooking-stew">لحوم طبيخ وسلق وطواجن</option>
                      <option value="minced-specialties">مفروم ومصنعات العنتبلي</option>
                      <option value="offal-liver">كبدة وحلويات لحوم بلدي</option>
                    </select>
                  </div>
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
                      <option value="premium-steaks">قطعيات وستيك فاخر</option>
                      <option value="cooking-stew">لحوم طبيخ وسلق وطواجن</option>
                      <option value="minced-specialties">مفروم ومصنعات العنتبلي</option>
                      <option value="offal-liver">كبدة وحلويات لحوم بلدي</option>
                    </select>
                  </div>
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
    </div>
  );
}
