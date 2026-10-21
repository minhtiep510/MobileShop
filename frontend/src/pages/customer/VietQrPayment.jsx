import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Copy, AlertCircle, ShoppingBag, CheckCircle2, ArrowRight, XCircle, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/Toast';
import '../../styles/VietQrPayment.css';

export default function VietQrPayment() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const state = location.state || {};
  const orderId = state.orderId;
  const amount = state.amount || 0;

  const [loadingOrder, setLoadingOrder] = useState(!amount && !!orderId);
  const [currentAmount, setCurrentAmount] = useState(amount);
  const [paymentStatus, setPaymentStatus] = useState('waiting'); // 'waiting' | 'success' | 'failed'
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Cấu hình tài khoản MB Bank của bạn
  const BANK_ID = "MB"; // MB Bank
  const ACCOUNT_NO = "0963615863"; // Số tài khoản MB Bank
  const ACCOUNT_NAME = "NGUYEN MINH TIEP"; // Tên chủ tài khoản
  const TRANSFER_CONTENT = `DH${orderId}`;

  // Link sinh mã VietQR chuẩn Napas 247 chính thức
  const qrCodeUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png?amount=${currentAmount}&addInfo=${encodeURIComponent(TRANSFER_CONTENT)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;

  useEffect(() => {
    if (!orderId) {
      toast.warning('Không tìm thấy thông tin đơn hàng');
      navigate('/account/orders');
      return;
    }

    // Nếu vào từ trang Lịch sử đơn hàng mà chưa có amount, tự động fetch chi tiết đơn
    if (!amount) {
      api.get(`/Order/${orderId}`)
        .then(res => {
          if (res.data?.totalAmount) {
            setCurrentAmount(res.data.totalAmount);
          }
        })
        .catch(err => {
          console.error("Lỗi lấy chi tiết đơn hàng:", err);
        })
        .finally(() => {
          setLoadingOrder(false);
        });
    }
  }, [orderId, amount, navigate, toast]);

  // Cơ chế Polling tự động kiểm tra trạng thái thanh toán từ SePay mỗi 2 giây
  useEffect(() => {
    if (!orderId || paymentStatus === 'success') return;

    const intervalId = setInterval(async () => {
      try {
        const res = await api.get(`/Sepay/check-status/${orderId}`);
        if (res.data?.isPaid) {
          setPaymentStatus('success');
          toast.success('Hệ thống đã nhận được tiền chuyển khoản của bạn!');
          clearInterval(intervalId);
        }
      } catch (err) {
        // Bỏ qua lỗi mạng tạm thời khi polling
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [orderId, paymentStatus, toast]);

  // Khi bấm "Tôi đã chuyển khoản thành công" -> Kiểm tra với hệ thống xem tiền đã vào chưa
  const handleCheckPayment = async () => {
    try {
      setCheckingPayment(true);
      const res = await api.get(`/Sepay/check-status/${orderId}`);
      
      if (res.data?.isPaid) {
        setPaymentStatus('success');
        toast.success('Thanh toán thành công! Hệ thống đã nhận được tiền.');
      } else {
        // Chưa nhận được tiền -> Hiện màn hình báo lỗi giao dịch chưa nhận được
        setPaymentStatus('failed');
        setErrorMessage('Hệ thống chưa nhận được khoản chuyển của bạn. Có thể do ngân hàng xử lý chậm hoặc sai nội dung chuyển khoản.');
        toast.error('Chưa nhận được thanh toán. Vui lòng kiểm tra lại!');
      }
    } catch (err) {
      console.error('Lỗi kiểm tra:', err);
      setPaymentStatus('failed');
      setErrorMessage('Đã xảy ra lỗi khi kiểm tra giao dịch với máy chủ. Vui lòng thử lại sau giây lát.');
      toast.error('Đã xảy ra lỗi khi kiểm tra giao dịch.');
    } finally {
      setCheckingPayment(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}!`);
  };

  // MÀN HÌNH 1: THANH TOÁN THÀNH CÔNG
  if (paymentStatus === 'success') {
    return (
      <div className="vietqr-container">
        <div className="vietqr-card" style={{ textAlign: 'center', padding: '48px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <CheckCircle2 size={72} color="#10b981" />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1d1d1f', marginBottom: '10px' }}>
            Thanh toán thành công!
          </h2>
          <p style={{ color: '#6e6e73', fontSize: '15px', marginBottom: '24px' }}>
            Đơn hàng <strong>#DH{orderId}</strong> của bạn đã được thanh toán và tự động xác nhận. Chúng tôi sẽ tiến hành đóng gói và giao hàng sớm nhất!
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn-confirm-paid"
              onClick={() => navigate('/account/orders')}
              style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <ShoppingBag size={18} /> Xem đơn hàng của tôi
            </button>
            <button
              type="button"
              className="btn-view-order"
              onClick={() => navigate('/')}
              style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              Tiếp tục mua sắm <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MÀN HÌNH 2: BÁO LỖI KHI CHƯA NHẬN ĐƯỢC TIỀN
  if (paymentStatus === 'failed') {
    return (
      <div className="vietqr-container">
        <div className="vietqr-card" style={{ textAlign: 'center', padding: '48px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <XCircle size={72} color="#ef4444" />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1d1d1f', marginBottom: '10px' }}>
            Chưa nhận được thanh toán
          </h2>
          <p style={{ color: '#6e6e73', fontSize: '15px', marginBottom: '20px', lineHeight: 1.5 }}>
            {errorMessage}
          </p>
          
          <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', padding: '14px 16px', textAlign: 'left', marginBottom: '24px', fontSize: '13.5px', color: '#991b1b' }}>
            <div style={{ fontWeight: 600, marginBottom: '6px' }}>Các nguyên nhân có thể xảy ra:</div>
            <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>Nội dung chuyển khoản chưa đúng <strong>{TRANSFER_CONTENT}</strong>.</li>
              <li>Chuyển chưa đủ số tiền <strong>{new Intl.NumberFormat('vi-VN').format(currentAmount)} đ</strong>.</li>
              <li>Ngân hàng đang xử lý giao dịch chậm hơn bình thường.</li>
            </ul>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-confirm-paid"
              onClick={() => setPaymentStatus('waiting')}
              style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '8px', background: '#0071e3' }}
            >
              <RefreshCw size={18} /> Quét lại mã QR
            </button>
            <button
              type="button"
              className="btn-view-order"
              onClick={() => navigate('/account/orders')}
              style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <ShoppingBag size={18} /> Xem đơn hàng
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MÀN HÌNH 3: MÀN HÌNH QUÉT MÃ QR CHỜ THANH TOÁN
  return (
    <div className="vietqr-container">
      <div className="vietqr-card">
        
        {/* Header VietQR */}
        <div className="vietqr-header">
          <div className="bank-brand-badge">
            <span className="brand-mb">MB BANK</span>
            <span className="brand-napas">NAPAS 247</span>
          </div>
          <h2>Quét mã VietQR chuyển khoản</h2>
          <p>Mở ứng dụng <strong>MB Bank, MoMo hoặc bất kỳ App ngân hàng nào</strong> để quét</p>
        </div>

        {/* Khung mã QR VietQR Napas chuẩn */}
        <div className="vietqr-wrapper">
          <div className="vietqr-frame">
            <img src={qrCodeUrl} alt="Mã VietQR" className="vietqr-image" />
          </div>
          <div className="vietqr-scan-hint" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px' }}>
            <div className="loader inline-block" style={{ width: '16px', height: '16px', border: '2px solid #e5e5ea', borderTop: '2px solid #0071e3', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <span>Đang chờ bạn quét mã và chuyển tiền...</span>
          </div>
        </div>

        {/* Thông tin chuyển tiền chi tiết */}
        <div className="transfer-details">
          
          <div className="detail-row">
            <span className="label">Ngân hàng thụ hưởng:</span>
            <span className="value"><strong>MB Bank (Ngân hàng Quân Đội)</strong></span>
          </div>

          <div className="detail-row">
            <span className="label">Chủ tài khoản:</span>
            <span className="value"><strong>{ACCOUNT_NAME}</strong></span>
          </div>

          <div className="detail-row">
            <span className="label">Số tài khoản:</span>
            <div className="value-with-copy">
              <strong>{ACCOUNT_NO}</strong>
              <button 
                type="button" 
                className="btn-copy" 
                onClick={() => copyToClipboard(ACCOUNT_NO, "Số tài khoản")}
              >
                <Copy size={13} /> Sao chép
              </button>
            </div>
          </div>

          <div className="detail-row">
            <span className="label">Số tiền:</span>
            <div className="value-with-copy">
              <strong className="amount-highlight">
                {new Intl.NumberFormat('vi-VN').format(currentAmount)} đ
              </strong>
              <button 
                type="button" 
                className="btn-copy" 
                onClick={() => copyToClipboard(currentAmount.toString(), "Số tiền")}
              >
                <Copy size={13} /> Sao chép
              </button>
            </div>
          </div>

          <div className="detail-row">
            <span className="label">Nội dung chuyển khoản:</span>
            <div className="value-with-copy">
              <strong className="content-highlight">{TRANSFER_CONTENT}</strong>
              <button 
                type="button" 
                className="btn-copy" 
                onClick={() => copyToClipboard(TRANSFER_CONTENT, "Nội dung")}
              >
                <Copy size={13} /> Sao chép
              </button>
            </div>
          </div>

        </div>

        {/* Lưu ý */}
        <div className="notice-box">
          <AlertCircle size={18} color="#0071e3" style={{ flexShrink: 0 }} />
          <span>Vui lòng giữ nguyên nội dung chuyển khoản <strong>{TRANSFER_CONTENT}</strong> để hệ thống tự động nhận diện và hoàn tất đơn hàng trong 3 giây.</span>
        </div>

        {/* Nút hành động */}
        <div className="action-buttons">
          <button 
            type="button" 
            className="btn-confirm-paid"
            onClick={handleCheckPayment}
            disabled={checkingPayment}
          >
            <CheckCircle size={18} /> {checkingPayment ? 'Đang kiểm tra tài khoản...' : 'Tôi đã chuyển khoản thành công'}
          </button>
          
          <button 
            type="button" 
            className="btn-view-order"
            onClick={() => navigate('/account/orders')}
          >
            <ShoppingBag size={18} /> Xem đơn hàng của tôi
          </button>
        </div>

      </div>
    </div>
  );
}
