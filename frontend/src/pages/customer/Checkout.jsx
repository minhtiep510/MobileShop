import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ShieldCheck } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/Toast';
import '../../styles/Checkout.css';

export default function Checkout() {
  const navigate = useNavigate();
  const toast = useToast();
  
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [ward, setWard] = useState('');
  const [street, setStreet] = useState('');
  
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [shippingFee] = useState(30000);
  
  useEffect(() => {
    // Check auth
    if (!localStorage.getItem('token')) {
      toast.warning('Vui lòng đăng nhập để thanh toán.');
      navigate('/login');
      return;
    }
    
    // Fetch cart data
    const fetchCart = async () => {
      try {
        setLoading(true);
        const response = await api.get('/Cart');
        if (!response.data || !response.data.items || response.data.items.length === 0) {
          toast.warning('Giỏ hàng của bạn đang trống.');
          navigate('/cart');
          return;
        }
        setCart(response.data);
      } catch (err) {
        console.error('Lỗi khi lấy giỏ hàng:', err);
        toast.error('Không thể tải giỏ hàng để thanh toán.');
        navigate('/cart');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCart();
  }, [navigate]);

  const handleCheckout = async (e) => {
    e.preventDefault();
    
    if (!province || !district || !ward || !street) {
      toast.warning('Vui lòng điền đầy đủ thông tin địa chỉ giao hàng.');
      return;
    }
    
    // Ghép địa chỉ
    const fullAddress = `${street}, ${ward}, ${district}, ${province}`;
    
    try {
      setCheckingOut(true);
      await api.post('/Order/checkout', {
        shippingAddress: fullAddress,
        phone,
        paymentMethod,
        shippingFee
      });
      
      toast.success('Đặt hàng thành công!');
      navigate('/account/orders');
    } catch (err) {
      console.error('Lỗi khi đặt hàng:', err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.');
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading || !cart) {
    return (
      <div className="cps-checkout-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="loader" style={{ borderTopColor: '#0071e3', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  const subTotal = cart.totalPrice;
  const finalTotal = subTotal + shippingFee;

  return (
    <div className="cps-checkout-page">
      <div className="cps-checkout-container">
        
        {/* Stepper */}
        <div className="cps-checkout-stepper">
          <div className="stepper-item" style={{ cursor: 'pointer' }} onClick={() => navigate('/cart')}>
            <div className="stepper-number"><Check size={14} /></div>
            <span>Giỏ hàng</span>
          </div>
          <div className="stepper-line active"></div>
          <div className="stepper-item active">
            <div className="stepper-number">2</div>
            <span>Thông tin thanh toán</span>
          </div>
          <div className="stepper-line"></div>
          <div className="stepper-item">
            <div className="stepper-number">3</div>
            <span>Hoàn tất</span>
          </div>
        </div>
        
        <form onSubmit={handleCheckout} className="cps-checkout-layout">
          
          {/* Left Column: Customer Info */}
          <div className="cps-checkout-form-box">
            <h2 className="checkout-section-title">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#0071e3' }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Thông tin khách hàng
            </h2>
            
            <div className="checkout-form-grid">
              <div className="form-group">
                <label className="form-label">Họ và tên</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Nguyễn Văn A" 
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required 
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Số điện thoại</label>
                <input 
                  type="tel" 
                  className="form-input" 
                  placeholder="0912345678" 
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required 
                />
              </div>
              

              <div className="form-group">
                <label className="form-label">Tỉnh / Thành phố</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Nhập Tỉnh / Thành phố" 
                  value={province}
                  onChange={e => setProvince(e.target.value)}
                  required 
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Quận / Huyện</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Nhập Quận / Huyện" 
                  value={district}
                  onChange={e => setDistrict(e.target.value)}
                  required 
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Phường / Xã</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Nhập Phường / Xã" 
                  value={ward}
                  onChange={e => setWard(e.target.value)}
                  required 
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Địa chỉ chi tiết</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Số nhà, tên đường..." 
                  value={street}
                  onChange={e => setStreet(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="payment-method-section">
              <h2 className="checkout-section-title">
                <ShieldCheck style={{ color: '#0071e3' }} />
                Phương thức thanh toán
              </h2>
              <div className="payment-method-options">
                <label className="payment-option">
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="COD" 
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                  />
                  <span>Thanh toán khi nhận hàng (COD)</span>
                </label>
                <label className="payment-option">
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="BankTransfer" 
                    checked={paymentMethod === 'BankTransfer'}
                    onChange={() => setPaymentMethod('BankTransfer')}
                  />
                  <span>Chuyển khoản qua ngân hàng</span>
                </label>
              </div>
            </div>
            
          </div>
          
          {/* Right Column: Order Summary */}
          <div className="cps-checkout-summary-box">
            <h2 className="checkout-section-title">Tóm tắt đơn hàng</h2>
            
            <div className="summary-item-list">
              {cart.items.map(item => (
                <div className="summary-item" key={item.id}>
                  <img 
                    src={item.productImage || 'https://via.placeholder.com/60'} 
                    alt={item.productName} 
                    className="summary-item-img" 
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/60' }}
                  />
                  <div className="summary-item-info">
                    <div className="summary-item-name">{item.productName}</div>
                    <div className="summary-item-variant">
                      {item.color}{item.color && item.size ? ' | ' : ''}{item.size}
                    </div>
                  </div>
                  <div className="summary-item-price-col">
                    <div className="summary-item-qty">Số lượng: {item.quantity}</div>
                    <div className="summary-item-price">{new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)}đ</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="voucher-section">
              <div className="voucher-label">Mã giảm giá / Quà tặng</div>
              <div className="voucher-input-group">
                <input type="text" className="voucher-input" placeholder="Nhập mã ưu đãi" />
                <button type="button" className="voucher-btn">Áp dụng</button>
              </div>
            </div>
            
            <div className="summary-totals">
              <div className="summary-row">
                <span>Tạm tính</span>
                <span>{new Intl.NumberFormat('vi-VN').format(subTotal)}đ</span>
              </div>
              <div className="summary-row">
                <span>Phí vận chuyển</span>
                <span>{new Intl.NumberFormat('vi-VN').format(shippingFee)}đ</span>
              </div>
              <div className="summary-row total">
                <span>Tổng tiền</span>
                <span style={{ color: '#0071e3' }}>{new Intl.NumberFormat('vi-VN').format(finalTotal)}đ</span>
              </div>
            </div>
            
            <button 
              type="submit" 
              className="cps-btn-submit-order"
              disabled={checkingOut}
            >
              {checkingOut ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
            </button>
            
          </div>
          
        </form>
      </div>
    </div>
  );
}
