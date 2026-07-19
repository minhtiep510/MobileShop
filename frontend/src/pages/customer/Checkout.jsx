import React, { useState, useEffect, useMemo } from 'react';
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

  // Dữ liệu Tỉnh/Thành API
  const [locationData, setLocationData] = useState([]);

  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [ward, setWard] = useState('');
  const [street, setStreet] = useState('');

  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [shippingFee] = useState(0);

  // Lấy danh sách địa giới hành chính Việt Nam
  useEffect(() => {
    fetch('https://provinces.open-api.vn/api/?depth=3')
      .then(res => res.json())
      .then(data => setLocationData(data))
      .catch(err => console.error("Lỗi lấy dữ liệu tỉnh/thành:", err));
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      toast.warning('Vui lòng đăng nhập để thanh toán.');
      navigate('/login');
      return;
    }

    const fetchCheckoutData = async () => {
      try {
        setLoading(true);
        const [cartRes, profileRes] = await Promise.all([
          api.get('/Cart'),
          api.get('/Profile').catch(() => null)
        ]);

        let items = cartRes.data?.items || [];

        const selectedIdsStr = sessionStorage.getItem('checkoutItemIds');
        if (selectedIdsStr) {
          const selectedIds = JSON.parse(selectedIdsStr);
          if (selectedIds.length > 0) {
            items = items.filter(item => selectedIds.includes(item.id));
          }
        }

        if (items.length === 0) {
          toast.warning('Không có sản phẩm nào để thanh toán.');
          navigate('/cart');
          return;
        }

        const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        setCart({ ...cartRes.data, items, totalPrice });

        if (profileRes?.data) {
          setFullName(profileRes.data.fullName || '');
          setPhone(profileRes.data.phoneNumber || '');

          if (profileRes.data.address) {
            const parts = profileRes.data.address.split(',').map(s => s.trim());
            if (parts.length >= 4) {
              // Gán tạm giá trị. Vì API lấy từ text cũ có thể không khớp 100% với select
              // Nếu tên Tỉnh khớp với danh sách API thì select sẽ tự nhận.
              setProvince(parts[parts.length - 1]);
              setDistrict(parts[parts.length - 2]);
              setWard(parts[parts.length - 3]);
              setStreet(parts.slice(0, parts.length - 3).join(', '));
            } else {
              setStreet(profileRes.data.address);
            }
          }
        }

      } catch (err) {
        console.error('Lỗi khi lấy dữ liệu:', err);
        toast.error('Không thể tải dữ liệu để thanh toán.');
        navigate('/cart');
      } finally {
        setLoading(false);
      }
    };

    fetchCheckoutData();
  }, [navigate]);

  // Tính toán danh sách Quận/Huyện và Phường/Xã dựa trên Tỉnh/Thành đã chọn
  const availableDistricts = useMemo(() => {
    // Tìm province object theo tên
    const p = locationData.find(item => item.name === province || item.name.includes(province) || province.includes(item.name));
    return p?.districts || [];
  }, [locationData, province]);

  const availableWards = useMemo(() => {
    const d = availableDistricts.find(item => item.name === district || item.name.includes(district) || district.includes(item.name));
    return d?.wards || [];
  }, [availableDistricts, district]);

  // Handle changes to reset child dropdowns
  const handleProvinceChange = (e) => {
    setProvince(e.target.value);
    setDistrict('');
    setWard('');
  };

  const handleDistrictChange = (e) => {
    setDistrict(e.target.value);
    setWard('');
  };

  const handleCheckout = async (e) => {
    e.preventDefault();

    if (!province || !district || !ward || !street) {
      toast.warning('Vui lòng điền đầy đủ thông tin địa chỉ.');
      return;
    }

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
      sessionStorage.removeItem('checkoutItemIds');
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

          <div className="cps-checkout-form-box">
            <h2 className="checkout-section-title">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#0071e3' }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Thông tin giao hàng
            </h2>

            <div className="checkout-form-grid">
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
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

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
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
                <select
                  className="form-input"
                  value={province}
                  onChange={handleProvinceChange}
                  required
                  style={{ cursor: 'pointer', appearance: 'auto' }}
                >
                  <option value="" disabled>-- Chọn Tỉnh / Thành phố --</option>
                  {locationData.map(p => (
                    <option key={p.code} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Quận / Huyện</label>
                <select
                  className="form-input"
                  value={district}
                  onChange={handleDistrictChange}
                  disabled={!province || availableDistricts.length === 0}
                  required
                  style={{ cursor: 'pointer', appearance: 'auto' }}
                >
                  <option value="" disabled>-- Chọn Quận / Huyện --</option>
                  {availableDistricts.map(d => (
                    <option key={d.code} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Phường / Xã</label>
                <select
                  className="form-input"
                  value={ward}
                  onChange={e => setWard(e.target.value)}
                  disabled={!district || availableWards.length === 0}
                  required
                  style={{ cursor: 'pointer', appearance: 'auto' }}
                >
                  <option value="" disabled>-- Chọn Phường / Xã --</option>
                  {availableWards.map(w => (
                    <option key={w.code} value={w.name}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Số nhà, ngõ ngách, tên đường</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: Số 12, Ngõ 34..."
                  value={street}
                  onChange={e => setStreet(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="payment-method-section" style={{ marginTop: '20px' }}>
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

          <div className="cps-checkout-summary-box">
            <h2 className="checkout-section-title">Tóm tắt đơn hàng ({cart.items.length} sản phẩm)</h2>

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
                <span>Tạm tính:</span>
                <span>{new Intl.NumberFormat('vi-VN').format(subTotal)}đ</span>
              </div>
              <div className="summary-row">
                <span>Phí vận chuyển:</span>
                <span>{new Intl.NumberFormat('vi-VN').format(shippingFee)}đ</span>
              </div>
              <div className="summary-row total">
                <span>Tổng tiền:</span>
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
