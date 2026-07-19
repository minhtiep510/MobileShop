import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, ChevronRight, ChevronLeft, Star, Truck, ShieldCheck, RefreshCw } from 'lucide-react';
import api, { API_BASE_URL } from '../../services/api';
import { useToast } from '../../components/Toast';
import '../../styles/ProductDetail.css';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedsize, setSelectedsize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const thumbnailsRef = useRef(null);

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => {
      const newIndex = prev === 0 ? imageList.length - 1 : prev - 1;
      scrollToThumbnail(newIndex);
      return newIndex;
    });
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => {
      const newIndex = prev === imageList.length - 1 ? 0 : prev + 1;
      scrollToThumbnail(newIndex);
      return newIndex;
    });
  };

  const scrollToThumbnail = (index) => {
    if (thumbnailsRef.current) {
      const thumbnailWidth = 70;
      thumbnailsRef.current.scrollTo({
        left: index * thumbnailWidth - 100,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/Product/${id}`);
        setProduct(response.data);

        if (response.data.variants && response.data.variants.length > 0) {
          const firstInStock = response.data.variants.find(v => v.stockQuantity > 0) || response.data.variants[0];
          setSelectedVariant(firstInStock);
          setSelectedsize(firstInStock.size);
          setSelectedColor(firstInStock.color);
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
      toast.warning('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.');
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
        toast.success('Đã thêm sản phẩm vào giỏ hàng thành công!');
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch (err) {
      console.error('Lỗi khi thêm vào giỏ:', err);
      toast.error(err.response?.data?.message || 'Không thể thêm vào giỏ hàng. Vui lòng thử lại.');
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

  imageList = imageList.map(url => (url && url.startsWith('/')) ? `${API_BASE_URL}${url}` : url);

  const activeImage = imageList[currentImageIndex] || imageList[0];

  const getColorHex = (colorName) => {
    if (!colorName) return '#cccccc';
    const name = colorName.toLowerCase();
    
    if (name.includes('cam')) return '#f9a826';
    if (name.includes('đỏ') || name.includes('red')) return '#e3001b';
    if (name.includes('vàng') || name.includes('yellow') || name.includes('gold')) return '#fde047';
    if (name.includes('tím') || name.includes('purple')) return '#d8b4e2';
    if (name.includes('hồng') || name.includes('pink')) return '#f3c4d7';
    if (name.includes('xanh lá') || name.includes('green') || name.includes('olive')) return '#a3e4d7';
    if (name.includes('xanh dương') || name.includes('xanh thẳm') || name.includes('blue')) return '#2b547e';
    if (name.includes('xanh') || name.includes('cyan')) return '#87ceeb';
    if (name.includes('trắng') || name.includes('white') || name.includes('starlight')) return '#f5f5f7';
    if (name.includes('bạc') || name.includes('silver')) return '#c0c0c0';
    if (name.includes('titan') || name.includes('gray') || name.includes('xám')) return '#8c8c8c';
    if (name.includes('đen') || name.includes('black') || name.includes('midnight')) return '#333333';
    if (name.includes('vũ trụ')) return '#444444'; 
    
    return '#cccccc';
  };

  return (
    <div className="cps-container cps-product-detail-page">
      {/* Breadcrumb */}
      <div className="cps-breadcrumb">
        <span onClick={() => navigate('/')}>Trang chủ</span>
        <ChevronRight size={14} />
        <span 
          onClick={() => product.categoryId && navigate(`/category/${product.categoryId}`)}
          style={{ cursor: product.categoryId ? 'pointer' : 'default' }}
        >
          {product.categoryName || 'Điện thoại'}
        </span>
        <ChevronRight size={14} />
        <span className={selectedVariant?.sku ? "" : "active"}>{product.name}</span>
        {selectedVariant?.sku && (
          <>
            <ChevronRight size={14} />
            <span className="active">{selectedVariant.sku}</span>
          </>
        )}
      </div>

      <div className="cps-detail-header">
        <h1 className="cps-detail-title-main" style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1d1d1f' }}>
          {product.name}
        </h1>
      </div>

      <div className="cps-detail-main">
        {/* Left Column - Image Gallery */}
        <div className="cps-detail-left">
          <div className="cps-main-image-box">
            <img src={activeImage} alt={product.name} />
          </div>
          {imageList.length > 1 && (
            <div className="cps-thumbnails-wrapper" style={{ position: 'relative', marginTop: '10px' }}>
              <button 
                onClick={handlePrevImage}
                style={{
                  position: 'absolute', left: '-15px', top: '50%', transform: 'translateY(-50%)',
                  zIndex: 2, width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)',
                  border: '1px solid #e5e5ea', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', color: '#1d1d1f'
                }}
              >
                <ChevronLeft size={16} />
              </button>
              
              <div 
                className="cps-image-thumbnails" 
                ref={thumbnailsRef}
                style={{ 
                  display: 'flex', gap: '10px', overflowX: 'auto', padding: '5px',
                  scrollBehavior: 'smooth', scrollbarWidth: 'none', msOverflowStyle: 'none'
                }}
              >
                {imageList.map((url, idx) => (
                  <div
                    key={idx}
                    onClick={() => { setCurrentImageIndex(idx); scrollToThumbnail(idx); }}
                    style={{
                      width: '60px', height: '60px', border: currentImageIndex === idx ? '2px solid #1d1d1f' : '1px solid #e5e5ea',
                      borderRadius: '8px', cursor: 'pointer', overflow: 'hidden', flexShrink: 0,
                      opacity: currentImageIndex === idx ? 1 : 0.6,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <img src={url} alt={`${product.name} - ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                ))}
              </div>

              <button 
                onClick={handleNextImage}
                style={{
                  position: 'absolute', right: '-15px', top: '50%', transform: 'translateY(-50%)',
                  zIndex: 2, width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)',
                  border: '1px solid #e5e5ea', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', color: '#1d1d1f'
                }}
              >
                <ChevronRight size={16} />
              </button>

              <style>{`
                .cps-image-thumbnails::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
            </div>
          )}
          
          {selectedVariant?.sku && (
            <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '1.5rem', fontWeight: 'bold', color: '#1d1d1f' }}>
              {selectedVariant.sku}
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
            <>
              {(() => {
                const inStockVariants = product.variants.filter(v => v.stockQuantity > 0);
                const uniqueCapacities = [...new Set(
                  inStockVariants.map(v => v.size?.trim())
                  .filter(c => c && c.toLowerCase() !== 'mặc định' && c.toLowerCase() !== 'default')
                )];

                if (uniqueCapacities.length === 0) return null;
                return (
                  <div className="cps-variants-section">
                    <h2 className="cps-variant-label">Chọn Lưu trữ</h2>
                    <div className="cps-variants-grid">
                      {uniqueCapacities.map(cap => {
                        const isActive = selectedsize === cap;
                        const varsWithCap = inStockVariants.filter(v => v.size === cap);
                        const displayPrice = varsWithCap.length > 0 ? new Intl.NumberFormat('vi-VN').format(varsWithCap[0].price) + ' đ' : '';
                        
                        return (
                          <button
                            key={cap}
                            className={`cps-variant-btn ${isActive ? 'active' : ''}`}
                            onClick={() => {
                              setSelectedsize(cap);
                              let newVar = product.variants.find(v => v.size === cap && v.color === selectedColor && v.stockQuantity > 0);
                              if (!newVar) {
                                newVar = product.variants.find(v => v.size === cap && v.stockQuantity > 0);
                                if (newVar) setSelectedColor(newVar.color);
                              }
                              if (newVar) {
                                setSelectedVariant(newVar);
                                setCurrentImageIndex(0);
                              }
                            }}
                          >
                            <span className="variant-name">{cap}</span>
                            <span className="variant-price">{displayPrice}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {(() => {
                const inStockVariants = product.variants.filter(v => v.stockQuantity > 0);
                const uniqueColors = [...new Set(
                  inStockVariants.map(v => v.color?.trim())
                  .filter(c => c && c.toLowerCase() !== 'mặc định' && c.toLowerCase() !== 'default')
                )];

                if (uniqueColors.length === 0) return null;
                
                return (
                  <div className="cps-variants-section" style={{ marginTop: '10px' }}>
                    <h2 className="cps-variant-label" style={{ marginBottom: '10px' }}>Chọn Màu Sắc</h2>
                    <p style={{ fontSize: '1.1rem', marginBottom: '20px', color: '#333', fontWeight: '500' }}>
                      Màu sắc : <span style={{ color: '#666', fontWeight: 'normal' }}>{selectedColor || 'Chưa chọn'}</span>
                    </p>
                    <div className="color-swatches-grid">
                      {uniqueColors.map(col => {
                        const isActive = selectedColor === col;
                        let varForCol = product.variants.find(v => v.color === col && v.size === selectedsize && v.stockQuantity > 0);
                        const isCrossDisabled = !varForCol;

                        return (
                          <div
                            key={col}
                            className={`color-swatch-wrapper ${isActive ? 'active' : ''} ${isCrossDisabled ? 'disabled' : ''}`}
                            onClick={() => {
                              setSelectedColor(col);
                              let newVar = product.variants.find(v => v.size === selectedsize && v.color === col && v.stockQuantity > 0);
                              if (!newVar) {
                                newVar = product.variants.find(v => v.color === col && v.stockQuantity > 0);
                                if (newVar) setSelectedsize(newVar.size);
                              }
                              if (newVar) {
                                setSelectedVariant(newVar);
                                setCurrentImageIndex(0);
                              }
                            }}
                          >
                            <div className="color-swatch" style={{ backgroundColor: getColorHex(col) }}></div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </>
          )}

          {/* Sticky Summary Box */}
          <div className="cps-summary-box">
            <div className="summary-price-row">
              <span className="summary-label">Tổng cộng:

                {new Intl.NumberFormat('vi-VN').format(selectedVariant?.price || product.startingPrice || 0)} đ
              </span>
            </div>

            {selectedVariant && selectedVariant.stockQuantity > 0 ? (
              <span style={{ fontSize: '0.95rem', color: '#000000', fontWeight: 'bold' }}>
                ✓ Sẵn sàng giao hàng
              </span>
            ) : (
              <span style={{ fontSize: '0.95rem', color: '#d32f2f', fontWeight: 'bold' }}>
                Hết hàng
              </span>
            )}

            {/* Action Buttons */}
            <div className="cps-action-buttons">
              <button
                className="cps-btn-buy-now"
                onClick={() => handleAddToCart(true)}
                disabled={addingToCart || !selectedVariant || selectedVariant.stockQuantity <= 0}
              >
                Tiếp tục
              </button>
              <button
                className="cps-btn-add-cart"
                onClick={() => handleAddToCart(false)}
                disabled={addingToCart || !selectedVariant || selectedVariant.stockQuantity <= 0}
              >
                <ShoppingCart size={20} />
                Thêm vào giỏ
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
