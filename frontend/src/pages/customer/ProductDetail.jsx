import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, ChevronRight, Star, Truck, ShieldCheck, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import './ProductDetail.css';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/Product/${id}`);
        setProduct(response.data);
        
        if (response.data.variants && response.data.variants.length > 0) {
          const firstInStock = response.data.variants.find(v => v.stockQuantity > 0) || response.data.variants[0];
          setSelectedVariant(firstInStock);
        }
      } catch (err) {
        console.error('Lỗi khi tải chi tiết sản phẩm:', err);
        setError('Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = async (buyNow = false) => {
    if (!selectedVariant) return;
    
    if (!localStorage.getItem('token')) {
      alert('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.');
      navigate('/login');
      return;
    }

    try {
      setAddingToCart(true);
      await api.post('/Cart/items', {
        productVariantId: selectedVariant.id,
        quantity: 1
      });
      if (buyNow) {
        navigate('/cart');
      } else {
        alert('Đã thêm sản phẩm vào giỏ hàng thành công!');
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch (err) {
      console.error('Lỗi khi thêm vào giỏ:', err);
      alert(err.response?.data?.message || 'Không thể thêm vào giỏ hàng. Vui lòng thử lại.');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="cps-container" style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <div className="loader" style={{ borderTopColor: 'var(--cps-red)', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="cps-container" style={{ textAlign: 'center', padding: '100px 0' }}>
        <h2 style={{ color: 'var(--cps-red)', marginBottom: '20px' }}>Lỗi</h2>
        <p>{error || 'Sản phẩm không tồn tại.'}</p>
        <button onClick={() => navigate('/')} className="cps-btn-catalog" style={{ margin: '20px auto', background: 'var(--cps-red)' }}>Quay về trang chủ</button>
      </div>
    );
  }

  let imageList = [];
  if (selectedVariant && selectedVariant.images && selectedVariant.images.length > 0) {
    imageList = selectedVariant.images.map(img => img.imageUrl);
  } else if (product.images && product.images.length > 0) {
    imageList = product.images.map(img => img.imageUrl);
  } else if (product.thumbnailUrl) {
    imageList = [product.thumbnailUrl];
  } else {
    imageList = ['https://via.placeholder.com/500'];
  }

  // Nếu là đường dẫn tương đối (từ backend), thêm domain vào
  imageList = imageList.map(url => (url && url.startsWith('/')) ? `http://localhost:5136${url}` : url);

  const activeImage = imageList[currentImageIndex] || imageList[0];

  return (
    <div className="cps-container cps-product-detail-page">
      {/* Breadcrumb */}
      <div className="cps-breadcrumb">
        <span onClick={() => navigate('/')}>Trang chủ</span>
        <ChevronRight size={14} />
        <span>{product.categoryName || 'Điện thoại'}</span>
        <ChevronRight size={14} />
        <span className="active">{product.name}</span>
      </div>

      <div className="cps-detail-header">
        <h1 className="cps-detail-title">{product.name}</h1>
        <div className="cps-detail-rating">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={16} fill="#f59e0b" color="#f59e0b" />
          ))}
          <span className="rating-count">10 đánh giá</span>
        </div>
      </div>

      <div className="cps-detail-main">
        {/* Left Column - Image Gallery */}
        <div className="cps-detail-left">
          <div className="cps-main-image-box">
            <img src={activeImage} alt={product.name} />
          </div>
          {imageList.length > 1 && (
            <div className="cps-image-thumbnails" style={{ display: 'flex', gap: '10px', marginTop: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
              {imageList.map((url, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setCurrentImageIndex(idx)}
                  style={{ 
                    width: '60px', height: '60px', border: currentImageIndex === idx ? '2px solid var(--cps-red)' : '1px solid var(--cps-border)',
                    borderRadius: '8px', cursor: 'pointer', overflow: 'hidden', flexShrink: 0
                  }}
                >
                  <img src={url} alt={`${product.name} - ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              ))}
            </div>
          )}
          <div className="cps-policy-box">
            <div className="policy-item">
              <RefreshCw size={24} color="var(--cps-red)" />
              <span>Hư gì đổi nấy <strong>12 tháng</strong> tại 3000 siêu thị toàn quốc (miễn phí tháng đầu)</span>
            </div>
            <div className="policy-item">
              <ShieldCheck size={24} color="var(--cps-red)" />
              <span>Bảo hành <strong>chính hãng 1 năm</strong> tại các trung tâm bảo hành hãng</span>
            </div>
            <div className="policy-item">
              <Truck size={24} color="var(--cps-red)" />
              <span>Giao hàng nhanh toàn quốc</span>
            </div>
          </div>
        </div>

        {/* Right Column - Info & Actions */}
        <div className="cps-detail-right">
          
          {/* Variants Selection */}
          {product.variants && product.variants.length > 0 && (
            <div className="cps-variants-section">
              <p className="cps-variant-label">Chọn phiên bản:</p>
              <div className="cps-variants-grid">
                {product.variants.map((variant) => {
                  const label = [variant.capacity, variant.color].filter(Boolean).join(' - ') || variant.sku;
                  const isOutOfStock = variant.stockQuantity <= 0;
                  const isActive = selectedVariant?.id === variant.id;
                  
                  return (
                    <button
                      key={variant.id}
                      className={`cps-variant-btn ${isActive ? 'active' : ''} ${isOutOfStock ? 'disabled' : ''}`}
                      onClick={() => {
                        if (!isOutOfStock) {
                          setSelectedVariant(variant);
                          setCurrentImageIndex(0);
                        }
                      }}
                      disabled={isOutOfStock}
                    >
                      <div className="variant-name">{label}</div>
                      <div className="variant-price">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(variant.price)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Price Block */}
          <div className="cps-price-block">
            <div className="cps-price-current">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedVariant?.price || product.startingPrice || 0)}
            </div>
            <div className="cps-price-old">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((selectedVariant?.price || product.startingPrice || 0) * 1.2)}
            </div>
          </div>

          {selectedVariant && (
            <div style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#fff0f0', borderRadius: '4px', border: '1px solid #ffd0d0', display: 'inline-flex', gap: '1rem', alignItems: 'center' }}>
              {selectedVariant.condition && (
                <span style={{ fontSize: '0.9rem', color: '#d70018', fontWeight: 'bold' }}>Tình trạng: {selectedVariant.condition}</span>
              )}
              <span style={{ fontSize: '0.9rem', color: '#d70018', fontWeight: 'bold' }}>
                {selectedVariant.condition && '| '}
                Số lượng kho: {selectedVariant.stockQuantity > 0 ? selectedVariant.stockQuantity : 'Hết hàng'}
              </span>
            </div>
          )}

          {/* Promotion Box */}
          <div className="cps-promo-box">
            <div className="promo-header">KHUYẾN MÃI</div>
            <div className="promo-body">
              <ul>
                <li>Thu cũ đổi mới: Giảm thêm đến 2 triệu.</li>
                <li>Thanh toán qua thẻ tín dụng: Giảm 500.000đ.</li>
                <li>Tặng ốp lưng chính hãng.</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="cps-action-buttons">
            <button 
              className="cps-btn-buy-now"
              onClick={() => handleAddToCart(true)}
              disabled={addingToCart || !selectedVariant || selectedVariant.stockQuantity <= 0}
            >
              <strong>MUA NGAY</strong>
              <span>(Giao tận nơi hoặc lấy tại cửa hàng)</span>
            </button>
            <div className="cps-action-group">
              <button className="cps-btn-installment">
                <strong>TRẢ GÓP 0%</strong>
                <span>(Duyệt hồ sơ trong 5 phút)</span>
              </button>
              <button 
                className="cps-btn-add-cart"
                onClick={() => handleAddToCart(false)}
                disabled={addingToCart || !selectedVariant || selectedVariant.stockQuantity <= 0}
              >
                <ShoppingCart size={24} />
                <span>Thêm vào giỏ</span>
              </button>
            </div>
          </div>
          
        </div>
      </div>

      {/* Description and Specs */}
      <div className="cps-detail-bottom">
        <div className="cps-description-box">
          <h2>ĐẶC ĐIỂM NỔI BẬT</h2>
          <div className="description-content" dangerouslySetInnerHTML={{ __html: product.description || 'Đang cập nhật mô tả...' }} />
        </div>
        
        <div className="cps-specs-box">
          <h2>THÔNG SỐ KỸ THUẬT</h2>
          {product.specifications && product.specifications.length > 0 ? (
            <table className="cps-specs-table">
              <tbody>
                {product.specifications.map((spec, index) => (
                  <tr key={index}>
                    <th>{spec.key}</th>
                    <td>{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: 'var(--cps-text-light)', padding: '15px' }}>Đang cập nhật thông số...</p>
          )}
        </div>
      </div>
    </div>
  );
}
