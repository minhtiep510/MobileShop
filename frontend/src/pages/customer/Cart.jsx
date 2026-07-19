import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, Truck, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/Toast';
import { useConfirm } from '../../components/ConfirmDialog';
import '../../styles/Cart.css';

export default function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shippingFee] = useState(0);
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const carouselRef = useRef(null);
  const toast = useToast();
  const confirm = useConfirm();

  const navigate = useNavigate();

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await api.get('/Cart');
      setCart(response.data);
      setError(null);
      // Auto-select all items on first load
      if (response.data?.items) {
        setSelectedIds(new Set(response.data.items.map(i => i.id)));
      }
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      console.error('Lỗi khi lấy giỏ hàng:', err);
      setError('Không thể tải giỏ hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();

    const fetchSuggested = async () => {
      try {
        const response = await api.get('/Product?page=1&pageSize=20');
        if (response.data && response.data.items) {
          setSuggestedProducts(response.data.items);
        } else if (Array.isArray(response.data)) {
          setSuggestedProducts(response.data.slice(0, 20));
        }
      } catch (err) {
        console.error('Lỗi khi lấy sản phẩm gợi ý:', err);
      }
    };
    fetchSuggested();
  }, []);

  // ── Selection helpers ──────────────────────────────────────────
  const allIds = cart?.items?.map(i => i.id) ?? [];
  const isAllSelected = allIds.length > 0 && allIds.every(id => selectedIds.has(id));
  const isIndeterminate = !isAllSelected && allIds.some(id => selectedIds.has(id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  };

  const toggleSelectItem = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Computed totals based on selection
  const selectedItems = cart?.items?.filter(i => selectedIds.has(i.id)) ?? [];
  const selectedSubtotal = selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const selectedCount = selectedItems.reduce((sum, i) => sum + i.quantity, 0);

  // ── Cart actions ───────────────────────────────────────────────
  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' });
    }
  };

  const handleUpdateQuantity = async (id, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) return;

    try {
      setCart((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        ),
        totalPrice: prev.items.reduce((total, item) => {
          const itemQ = item.id === id ? newQuantity : item.quantity;
          return total + item.price * itemQ;
        }, 0)
      }));

      await api.put(`/Cart/items/${id}`, { quantity: newQuantity });
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      console.error('Lỗi khi cập nhật số lượng:', err);
      fetchCart();
      toast.error('Không thể cập nhật số lượng. Vui lòng thử lại.');
    }
  };

  const handleRemoveItem = async (id) => {
    const ok = await confirm({
      title: 'Xóa sản phẩm',
      message: 'Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?',
      confirmLabel: 'Xóa',
      confirmType: 'danger',
    });
    if (!ok) return;

    try {
      await api.delete(`/Cart/items/${id}`);
      setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
      fetchCart();
    } catch (err) {
      console.error('Lỗi khi xóa sản phẩm:', err);
      toast.error('Không thể xóa sản phẩm. Vui lòng thử lại.');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    const ok = await confirm({
      title: 'Xóa sản phẩm đã chọn',
      message: `Bạn có chắc muốn xóa ${selectedIds.size} sản phẩm đã chọn khỏi giỏ hàng?`,
      confirmLabel: 'Xóa tất cả',
      confirmType: 'danger',
    });
    if (!ok) return;

    try {
      await Promise.all([...selectedIds].map(id => api.delete(`/Cart/items/${id}`)));
      setSelectedIds(new Set());
      fetchCart();
      toast.success('Đã xóa các sản phẩm đã chọn.');
    } catch (err) {
      toast.error('Có lỗi xảy ra khi xóa sản phẩm.');
      fetchCart();
    }
  };

  const handleCheckout = () => {
    if (selectedIds.size === 0) {
      toast.warning('Vui lòng chọn ít nhất một sản phẩm để thanh toán.');
      return;
    }
    // Lưu selectedIds vào sessionStorage để Checkout đọc
    sessionStorage.setItem('checkoutItemIds', JSON.stringify([...selectedIds]));
    navigate('/checkout');
  };

  // ── Render helpers ─────────────────────────────────────────────
  // ── Render suggested products ──────────────────────────────────
  const renderSuggestedProducts = () => {
    if (!suggestedProducts || suggestedProducts.length === 0) return null;
    return (
      <div className="cart-suggestions" style={{ marginTop: '50px', paddingBottom: '30px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '20px', color: '#1d1d1f' }}>Có thể bạn sẽ thích</h2>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <button onClick={() => scrollCarousel('left')} style={{ position: 'absolute', left: '-20px', zIndex: 10, width: '40px', height: '40px', borderRadius: '50%', background: '#fff', border: '1px solid #e5e5ea', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <ChevronLeft size={20} />
          </button>
          <div ref={carouselRef} style={{ display: 'flex', gap: '20px', overflowX: 'auto', scrollBehavior: 'smooth', paddingBottom: '20px', scrollbarWidth: 'none', msOverflowStyle: 'none', width: '100%' }}>
            {suggestedProducts.map(product => (
              <Link to={`/product/${product.id}`} key={`suggest-${product.id}`} style={{ minWidth: '220px', background: '#fff', borderRadius: '16px', padding: '15px', textDecoration: 'none', color: '#1d1d1f', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: 'transform 0.2s' }} className="suggest-card">
                <img src={product.thumbnailUrl || 'https://via.placeholder.com/150'} alt={product.name} style={{ width: '120px', height: '120px', objectFit: 'contain', marginBottom: '15px' }} onError={(e) => { e.target.src = 'https://via.placeholder.com/150' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 600, textAlign: 'center', marginBottom: '10px' }}>{product.name}</h3>

              </Link>
            ))}
          </div>
          <button onClick={() => scrollCarousel('right')} style={{ position: 'absolute', right: '-20px', zIndex: 10, width: '40px', height: '40px', borderRadius: '50%', background: '#fff', border: '1px solid #e5e5ea', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <ChevronRight size={20} />
          </button>
          <style>{`.suggest-card:hover { transform: translateY(-5px); } .cart-suggestions ::-webkit-scrollbar { display: none; }`}</style>
        </div>
      </div>
    );
  };

  // ── Guards ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="container cart-page">
        <div className="loading-container">
          <div className="loader"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container cart-page">
        <div className="empty-cart">
          <p className="empty-cart-text text-danger">{error}</p>
          <button className="cps-btn-primary" onClick={fetchCart}>Thử lại</button>
        </div>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="container cart-page">
        <div className="empty-cart">
          <ShoppingBag className="empty-cart-icon" size={64} />
          <h2 className="empty-cart-title">Giỏ hàng của bạn đang trống</h2>
          <p className="empty-cart-text">Hãy khám phá thêm các sản phẩm tuyệt vời của chúng tôi nhé!</p>
          <Link to="/" className="cps-btn-primary">Mua sắm ngay</Link>
        </div>
        {renderSuggestedProducts()}
      </div>
    );
  }

  return (
    <div className="container cart-page">
      <div className="cart-header">
        <h1 className="cart-title">Giỏ hàng ({cart.items.length} sản phẩm)</h1>
      </div>

      <div className="cart-content">
        <div className="cart-items-container">

          {/* ── Select-all bar ── */}
          <div className="cart-select-all-bar">
            <label className="cart-checkbox-wrap" onClick={toggleSelectAll}>
              <span className={`cart-checkbox ${isAllSelected ? 'checked' : ''} ${isIndeterminate ? 'indeterminate' : ''}`}>
                {isAllSelected && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                {isIndeterminate && !isAllSelected && <span className="cart-checkbox-dash" />}
              </span>
              <span className="cart-select-all-label">
                Chọn tất cả ({allIds.length})
              </span>
            </label>

            {selectedIds.size > 0 && (
              <button className="cart-delete-selected" onClick={handleDeleteSelected}>
                <Trash2 size={14} />
                Xóa đã chọn ({selectedIds.size})
              </button>
            )}
          </div>

          {/* ── Cart items ── */}
          {cart.items.map((item) => {
            const isSelected = selectedIds.has(item.id);
            return (
              <div
                key={item.id}
                className={`cart-item glass ${isSelected ? 'cart-item-selected' : ''}`}
              >
                {/* Checkbox */}
                <label className="cart-checkbox-wrap cart-item-check" onClick={() => toggleSelectItem(item.id)}>
                  <span className={`cart-checkbox ${isSelected ? 'checked' : ''}`}>
                    {isSelected && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </span>
                </label>

                <img
                  src={item.productImage || 'https://via.placeholder.com/100'}
                  alt={item.productName}
                  className="cart-item-image"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/100' }}
                />

                <div className="cart-item-details">
                  <h3 className="cart-item-name">{item.productName}</h3>
                  <div className="cart-item-variants">
                    {item.color && <span>Màu: {item.color}</span>}
                    {item.size && <span style={{ marginLeft: '10px' }}>Phân loại: {item.size}</span>}
                  </div>
                  <div className="cps-cart-price">
                    {new Intl.NumberFormat('vi-VN').format(item.price)} đ
                  </div>
                </div>

                <div className="cart-item-actions">
                  <div className="quantity-control">
                    <button
                      className="quantity-btn"
                      onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus size={16} />
                    </button>
                    <span className="quantity-value">{item.quantity}</span>
                    <button
                      className="quantity-btn"
                      onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <div className="cart-item-line-total">
                    {new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)} đ
                  </div>

                  <button
                    className="remove-btn"
                    onClick={() => handleRemoveItem(item.id)}
                  >
                    <Trash2 size={16} />
                    Xóa
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Summary ── */}
        <div className="cart-summary">
          <h2 className="summary-title">Tóm tắt đơn hàng</h2>

          <div className="cps-summary-row" style={{ fontSize: '0.88rem', color: 'var(--cps-text-light)', marginBottom: '4px' }}>
            <span>Sản phẩm đã chọn</span>
            <span>{selectedIds.size} / {allIds.length}</span>
          </div>
          <div className="cps-summary-row" style={{ fontSize: '0.88rem', color: 'var(--cps-text-light)', marginBottom: '12px' }}>
            <span>Số lượng</span>
            <span>{selectedCount}</span>
          </div>

          <div className="cps-summary-row">
            <span>Tạm tính:</span>
            <span>{new Intl.NumberFormat('vi-VN').format(selectedSubtotal)} đ</span>
          </div>

          <div className="cps-summary-row cps-shipping-fee-row" style={{ color: 'var(--cps-text-light)', fontSize: '0.9rem', marginTop: '10px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Truck size={16} /> Phí vận chuyển</span>
            <span>{selectedIds.size > 0 ? new Intl.NumberFormat('vi-VN').format(shippingFee) + ' đ' : '—'}</span>
          </div>

          <div className="cps-summary-total">
            <span>Tổng tiền:</span>
            <span>{new Intl.NumberFormat('vi-VN').format(selectedSubtotal + (selectedIds.size > 0 ? shippingFee : 0))} đ</span>
          </div>

          <button
            className="cps-btn-primary checkout-btn"
            onClick={handleCheckout}
            disabled={selectedIds.size === 0}
            style={{
              width: '100%',
              marginTop: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              background: selectedIds.size === 0
                ? '#ccc'
                : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              border: 'none',
              boxShadow: selectedIds.size > 0 ? '0 4px 12px rgba(234, 88, 12, 0.3)' : 'none',
              cursor: selectedIds.size === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Thanh toán ({selectedIds.size})
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {renderSuggestedProducts()}
    </div>
  );
}
