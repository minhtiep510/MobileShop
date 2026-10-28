import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Tag, Check, X, ShieldCheck, MapPin, CreditCard, ChevronRight } from 'lucide-react';
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

  // Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  // Lấy danh sách địa giới hành chính Việt Nam
  useEffect(() => {
    fetch('https://provinces.open-api.vn/api/?depth=3')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setLocationData(data);
        }
      })
      .catch(err => {
        console.warn("API provinces chậm/lỗi:", err);
      });
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
          const addr = profileRes.data.address || '';
          if (addr) {
            const parts = addr.split(',').map(p => p.trim());
            if (parts.length >= 4) {
              setStreet(parts.slice(0, parts.length - 3).join(', '));
              setWard(parts[parts.length - 3]);
              setDistrict(parts[parts.length - 2]);
              setProvince(parts[parts.length - 1]);
            } else {
              setStreet(addr);
            }
          }
        }
      } catch (err) {
        console.error('Lỗi khi lấy dữ liệu:', err);
        toast.error('Không thể tải thông tin thanh toán.');
        navigate('/cart');
      } finally {
        setLoading(false);
      }
    };

    fetchCheckoutData();
  }, [navigate]);

  // Tìm đối tượng tỉnh đang được chọn
  const selectedProvinceObj = useMemo(() => {
    return locationData.find(p => p.name === province);
  }, [locationData, province]);

  // Danh sách Quận/Huyện dựa theo Tỉnh
  const availableDistricts = useMemo(() => {
    return selectedProvinceObj ? selectedProvinceObj.districts : [];
  }, [selectedProvinceObj]);

  // Tìm đối tượng huyện đang được chọn
  const selectedDistrictObj = useMemo(() => {
    return availableDistricts.find(d => d.name === district);
  }, [availableDistricts, district]);

  // Danh sách Phường/Xã dựa theo Huyện
  const availableWards = useMemo(() => {
    return selectedDistrictObj ? selectedDistrictObj.wards : [];
  }, [selectedDistrictObj]);

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

  const subTotal = cart ? cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0) : 0;
  const discountAmount = appliedCoupon ? Math.min(appliedCoupon.discountAmount, subTotal) : 0;
  const finalTotal = Math.max(0, subTotal - discountAmount + shippingFee);

  // Áp dụng mã giảm giá qua API Backend
  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) {
      toast.warning('Vui lòng nhập mã giảm giá');
      return;
    }

    try {
      setCheckingCoupon(true);
      const res = await api.post('/Coupon/apply', {
        code: couponCodeInput.trim().toUpperCase(),
        orderAmount: subTotal
      });

      if (res.data && res.data.success) {
        setAppliedCoupon(res.data);
        toast.success(res.data.message || 'Áp dụng mã giảm giá thành công!');
      }
    } catch (err) {
      console.error('Lỗi kiểm tra coupon:', err);
      toast.error(err.response?.data?.message || 'Mã giảm giá không hợp lệ.');
    } finally {
      setCheckingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput('');
    toast.info('Đã hủy áp dụng mã giảm giá');
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
      const res = await api.post('/Order/checkout', {
        shippingAddress: fullAddress,
        phone,
        paymentMethod,
        shippingFee,
        couponCode: appliedCoupon ? appliedCoupon.code : null
      });

      const orderId = res.data?.orderId;
      sessionStorage.removeItem('checkoutItemIds');

      // Nếu khách chọn chuyển khoản qua VietQR
      if ((paymentMethod === 'VietQR' || paymentMethod === 'BankTransfer') && orderId) {
        toast.success('Đơn hàng đã được tạo. Chuyển sang trang quét mã VietQR...');
        navigate('/payment/vietqr', {
          state: {
            orderId: orderId,
            amount: finalTotal
          }
        });
        return;
      }

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
        <div className="loader inline-block"></div>
      </div>
    );
  }

  return (
    <div className="cps-checkout-page">
      <div className="cps-checkout-container">

        {/* Stepper Header */}
        <div className="cps-checkout-stepper">
          <div className="stepper-item">
            <span className="stepper-number">1</span>
            <span>Giỏ hàng</span>
          </div>
          <div className="stepper-line active" />
          <div className="stepper-item active">
            <span className="stepper-number">2</span>
            <span>Đặt hàng & Thanh toán</span>
          </div>
          <div className="stepper-line" />
          <div className="stepper-item">
            <span className="stepper-number">3</span>
            <span>Hoàn tất</span>
          </div>
        </div>

        {/* Back Link */}
        <button type="button" className="cps-btn-back" onClick={() => navigate('/cart')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#0071e3', cursor: 'pointer', marginBottom: '20px', fontSize: '0.95rem', fontWeight: 500 }}>
          <ArrowLeft size={16} /> Quay lại giỏ hàng
        </button>

        <form onSubmit={handleCheckout} className="cps-checkout-layout">

          {/* CỘT TRÁI: Form Địa Chỉ & Thanh Toán */}
          <div className="cps-checkout-form-box">
            <h2 className="checkout-section-title">
              <MapPin size={22} color="#0071e3" /> Thông tin giao hàng
            </h2>

            <div className="checkout-form-grid">
              <div className="form-group">
                <label className="form-label">Họ và tên người nhận *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nhập họ và tên"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Số điện thoại *</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="Nhập số điện thoại"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tỉnh / Thành phố *</label>
                <select
                  className="form-select"
                  value={province}
                  onChange={handleProvinceChange}
                  required
                >
                  <option value="" disabled>-- Chọn Tỉnh / Thành phố --</option>
                  {locationData.map(p => (
                    <option key={p.code} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Quận / Huyện *</label>
                <select
                  className="form-select"
                  value={district}
                  onChange={handleDistrictChange}
                  disabled={!province || availableDistricts.length === 0}
                  required
                >
                  <option value="" disabled>-- Chọn Quận / Huyện --</option>
                  {availableDistricts.map(d => (
                    <option key={d.code} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Phường / Xã *</label>
                <select
                  className="form-select"
                  value={ward}
                  onChange={e => setWard(e.target.value)}
                  disabled={!district || availableWards.length === 0}
                  required
                >
                  <option value="" disabled>-- Chọn Phường / Xã --</option>
                  {availableWards.map(w => (
                    <option key={w.code} value={w.name}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Số nhà, ngõ ngách, tên đường *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: Số 12, Ngõ 45, Đường Cầu Giấy"
                  value={street}
                  onChange={e => setStreet(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Phương thức thanh toán */}
            <div className="payment-method-section">
              <h2 className="checkout-section-title" style={{ marginTop: '1.5rem' }}>
                <CreditCard size={22} color="#0071e3" /> Phương thức thanh toán
              </h2>

              <div className="payment-method-options">
                <label className={`payment-option ${paymentMethod === 'COD' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={e => setPaymentMethod(e.target.value)}
                  />
                  <div>
                    <span>Thanh toán khi nhận hàng (COD)</span>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#8c8c8c' }}>Thanh toán tiền mặt cho shipper khi nhận kiện hàng</p>
                  </div>
                </label>

                <label className={`payment-option ${paymentMethod === 'VietQR' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="VietQR"
                    checked={paymentMethod === 'VietQR'}
                    onChange={e => setPaymentMethod(e.target.value)}
                  />
                  <div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      Chuyển khoản Ngân hàng (Mã VietQR 24/7)
                      <span style={{ fontSize: '11px', background: '#0071e3', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>Khuyên dùng</span>
                    </span>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#8c8c8c' }}>Quét mã QR qua app ngân hàng MB Bank, Techcombank, Vietcombank... xác nhận ngay</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: Tóm tắt Đơn hàng & Mã giảm giá */}
          <div className="cps-checkout-summary-box">
            <h2 className="checkout-section-title">Đơn hàng của bạn ({cart.items.length})</h2>

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
                      {[item.color, item.size].filter(Boolean).join(' - ')}
                    </div>
                  </div>
                  <div className="summary-item-price-col">
                    <div className="summary-item-qty">x{item.quantity}</div>
                    <div className="summary-item-price">
                      {new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)} đ
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Voucher Box */}
            <div className="voucher-section">
              <div className="voucher-label">
                <Tag size={15} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '6px' }} />
                Mã giảm giá (Coupon)
              </div>
              
              {!appliedCoupon ? (
                <div className="voucher-input-group">
                  <input
                    type="text"
                    className="voucher-input"
                    placeholder="Nhập mã coupon..."
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                  />
                  <button
                    type="button"
                    className="voucher-btn"
                    onClick={handleApplyCoupon}
                    disabled={checkingCoupon || !couponCodeInput.trim()}
                  >
                    {checkingCoupon ? '...' : 'Áp dụng'}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ecfdf5', padding: '10px 14px', border: '1px solid #a7f3d0', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontSize: '0.9rem', fontWeight: 600 }}>
                    <Check size={16} /> Đã áp dụng: <strong>{appliedCoupon.code}</strong> (-{new Intl.NumberFormat('vi-VN').format(discountAmount)}đ)
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }}
                    title="Hủy mã"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="summary-totals">
              <div className="summary-row">
                <span>Tạm tính:</span>
                <span>{new Intl.NumberFormat('vi-VN').format(subTotal)} đ</span>
              </div>

              {discountAmount > 0 && (
                <div className="summary-row" style={{ color: '#059669', fontWeight: 600 }}>
                  <span>Giảm giá ({appliedCoupon?.code}):</span>
                  <span>-{new Intl.NumberFormat('vi-VN').format(discountAmount)} đ</span>
                </div>
              )}

              <div className="summary-row">
                <span>Phí vận chuyển:</span>
                <span>{shippingFee === 0 ? 'Miễn phí' : `${new Intl.NumberFormat('vi-VN').format(shippingFee)} đ`}</span>
              </div>

              <div className="summary-row total">
                <span>Tổng thanh toán:</span>
                <span style={{ color: '#0071e3' }}>{new Intl.NumberFormat('vi-VN').format(finalTotal)} đ</span>
              </div>
            </div>

            <button
              type="submit"
              className="cps-btn-submit-order"
              disabled={checkingOut}
            >
              {checkingOut ? 'Đang tạo đơn hàng...' : 'Xác nhận đặt hàng'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
