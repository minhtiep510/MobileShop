import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import './Cart.css';

export default function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Checkout states
  const [showCheckout, setShowCheckout] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [checkingOut, setCheckingOut] = useState(false);
  
  const navigate = useNavigate();

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await api.get('/Cart');
      setCart(response.data);
      setError(null);
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
  }, []);

  const handleUpdateQuantity = async (id, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) return;

    try {
      // Optimistic update
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
      // Revert on error by refetching
      fetchCart();
      alert('Không thể cập nhật số lượng. Vui lòng thử lại.');
    }
  };

  const handleRemoveItem = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?')) return;
    
    try {
      await api.delete(`/Cart/items/${id}`);
      fetchCart();
    } catch (err) {
      console.error('Lỗi khi xóa sản phẩm:', err);
      alert('Không thể xóa sản phẩm. Vui lòng thử lại.');
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!shippingAddress || !phone) {
      alert('Vui lòng điền đầy đủ địa chỉ và số điện thoại giao hàng.');
      return;
    }

    try {
      setCheckingOut(true);
      await api.post('/Order/checkout', {
        shippingAddress,
        phone,
        paymentMethod
      });
      
      alert('Đặt hàng thành công!');
      setShowCheckout(false);
      navigate('/my-orders');
    } catch (err) {
      console.error('Lỗi khi đặt hàng:', err);
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.');
    } finally {
      setCheckingOut(false);
    }
  };

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
          {cart.items.map((item) => (
            <div key={item.id} className="cart-item glass">
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
                  {item.capacity && <span style={{marginLeft: '10px'}}>Dung lượng: {item.capacity}</span>}
                </div>
                <div className="cart-item-price">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
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
                
                <button 
                  className="remove-btn"
                  onClick={() => handleRemoveItem(item.id)}
                >
                  <Trash2 size={16} />
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h2 className="summary-title">Tóm tắt đơn hàng</h2>
          
          <div className="summary-row">
            <span>Tạm tính</span>
            <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cart.totalPrice)}</span>
          </div>
          
          <div className="summary-row">
            <span>Giảm giá</span>
            <span>0 ₫</span>
          </div>
          
          <div className="summary-row">
            <span>Phí giao hàng</span>
            <span>Miễn phí</span>
          </div>
          
          <div className="summary-row total">
            <span>Tổng cộng</span>
            <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cart.totalPrice)}</span>
          </div>
          
          <button 
            className="cps-btn-primary checkout-btn"
            onClick={() => setShowCheckout(true)}
            style={{ width: '100%', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            Tiến hành thanh toán
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="bg-surface rounded-xl p-6 max-w-md w-full shadow-2xl" style={{ backgroundColor: 'var(--surface)', padding: '2rem', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '500px' }}>
            <h2 className="text-2xl font-bold mb-6">Thông tin giao hàng</h2>
            
            <form onSubmit={handleCheckout} className="flex flex-col gap-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ display: 'block', marginBottom: '0.5rem' }}>Số điện thoại người nhận</label>
                <input 
                  type="tel" 
                  required 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)}
                  className="w-full p-2 border border-border rounded-md focus:outline-none focus:border-primary"
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
                  placeholder="Ví dụ: 0912345678"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" style={{ display: 'block', marginBottom: '0.5rem' }}>Địa chỉ giao hàng</label>
                <textarea 
                  required 
                  value={shippingAddress} 
                  onChange={e => setShippingAddress(e.target.value)}
                  className="w-full p-2 border border-border rounded-md focus:outline-none focus:border-primary"
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', minHeight: '80px' }}
                  placeholder="Nhập địa chỉ chi tiết (Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ display: 'block', marginBottom: '0.5rem' }}>Phương thức thanh toán</label>
                <select 
                  value={paymentMethod} 
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full p-2 border border-border rounded-md focus:outline-none focus:border-primary"
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
                >
                  <option value="COD">Thanh toán khi nhận hàng (COD)</option>
                  <option value="BankTransfer">Chuyển khoản ngân hàng</option>
                </select>
              </div>

              <div className="flex gap-4 mt-6" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button 
                  type="button" 
                  className="btn-outline flex-1"
                  style={{ flex: 1 }}
                  onClick={() => setShowCheckout(false)}
                  disabled={checkingOut}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="cps-btn-primary flex-1"
                  style={{ flex: 1 }}
                  disabled={checkingOut}
                >
                  {checkingOut ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
