import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Star, Smartphone, Laptop, Tablet, Watch, Headphones, Tv, ShieldCheck, Truck, RefreshCw, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import './Home.css';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Refs for carousels
  const hotCarouselRef = useRef(null);
  const newCarouselRef = useRef(null);

  // States for 'Hàng Mới Về' block
  const [activeNewTab, setActiveNewTab] = useState('new'); // 'deal', 'trend', 'new'
  const [activeNewCategory, setActiveNewCategory] = useState('all');

  const scrollCarousel = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollCarouselById = (id, direction) => {
    const el = document.getElementById(id);
    if (el) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await api.get('/Product?page=1&pageSize=100');
        if (response.data && response.data.items) {
          setProducts(response.data.items);
        } else if (Array.isArray(response.data)) {
          setProducts(response.data);
        }
      } catch (err) {
        console.error('Lỗi khi tải sản phẩm:', err);
      }

      try {
        const catRes = await api.get('/Category');
        if (catRes.data && catRes.data.items) {
          setCategories(catRes.data.items);
        } else if (Array.isArray(catRes.data)) {
          setCategories(catRes.data);
        }
      } catch (err) {
        console.error('Lỗi khi tải danh mục:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Placeholder if categories fetch is slow or empty
  const defaultCategories = [
    { name: 'Đang tải danh mục...', icon: <Smartphone size={18} /> }
  ];

  const displayCategories = categories.length > 0 ? categories : (loading ? defaultCategories : []);

  return (
    <div className="cps-home">
      <div className="cps-container">

        {/* Top Banner Section */}
        <section className="cps-banner-section">
          <div className="cps-home-menu">
            <ul className="cps-menu-list">
              {displayCategories.map((cat, idx) => (
                <li key={cat.id || idx} className="cps-menu-item">
                  <Smartphone size={18} />
                  <span>{cat.name}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="cps-main-slider">
            <div className="cps-slider-image">
              <img src="https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?q=80&w=690&h=300&fit=crop" alt="Banner 1" />
            </div>
            <div className="cps-slider-nav">
              <div className="cps-slider-nav-item active">
                <span>IPHONE 15 PRO MAX<br />Giá giảm sâu</span>
              </div>
              <div className="cps-slider-nav-item">
                <span>GALAXY S24 ULTRA<br />Ưu đãi khủng</span>
              </div>
              <div className="cps-slider-nav-item">
                <span>OPPO FIND X7<br />Mới nhất</span>
              </div>
              <div className="cps-slider-nav-item">
                <span>XIAOMI 14<br />Camera Leica</span>
              </div>
            </div>
          </div>
          <div className="cps-right-banners">
            <img src="https://images.unsplash.com/photo-1592899677974-c460ce17e4bf?q=80&w=265&h=180&fit=crop" alt="Right 1" onError={(e) => e.target.style.display = 'none'} />
            <img src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=265&h=180&fit=crop" alt="Right 2" onError={(e) => e.target.style.display = 'none'} />
            <div className="cps-right-banner-placeholder" style={{ display: 'none' }}>Quảng cáo 1</div>
            <div className="cps-right-banner-placeholder" style={{ display: 'none' }}>Quảng cáo 2</div>
          </div>
        </section>

        {/* Danh sách sản phẩm Nổi Bật theo từng danh mục (Grid) */}
        {displayCategories.map((category) => {
          const categoryProducts = products.filter(p => p.categoryId === category.id);
          if (categoryProducts.length === 0) return null;

          return (
            <section className="cps-block-products" key={`cat-hot-${category.id}`}>
              <div className="cps-block-header">
                <h2 className="cps-block-title" style={{ textTransform: 'uppercase' }}>
                  {category.name} NỔI BẬT
                </h2>
              </div>
              
              <div className="cps-product-grid">
                {categoryProducts.slice(0, 10).map((product) => (
                  <Link to={`/product/${product.id}`} key={product.id} className="cps-product-card">
                    <div className="cps-product-image">
                      <img 
                        src={product.thumbnailUrl || 'https://via.placeholder.com/200'} 
                        alt={product.name} 
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/200' }}
                      />
                    </div>
                    <div className="cps-product-info">
                      <h3 className="cps-product-name">{product.name}</h3>
                      <div className="cps-product-price-row">
                        <span className="cps-price-special">
                          {new Intl.NumberFormat('vi-VN').format(product.startingPrice || 0)} VNĐ
                        </span>
                        <span className="cps-price-old">
                          {new Intl.NumberFormat('vi-VN').format((product.startingPrice || 0) * 1.2)} VNĐ
                        </span>
                      </div>
                      <div className="cps-product-rating">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        {/* Xử lý hiển thị loading */}
        {loading && products.length === 0 && (
          <section className="cps-block-products">
            <div className="cps-product-grid">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="cps-skeleton-card"></div>
              ))}
            </div>
          </section>
        )}

        {/* Khung Hàng Mới Về */}
        {!loading && products.length > 0 && (
          <section className="cps-block-products cps-new-arrivals-block">
            <div className="cps-new-arrivals-tabs">
              <div 
                className="cps-na-tab active"
                style={{ flex: 'none', padding: '12px 40px', margin: '0 auto', fontSize: '1.4rem' }}
              >
                <div className="cps-na-tab-active-img">
                  HÀNG MỚI VỀ 🎉
                </div>
              </div>
            </div>

            <div className="cps-new-arrivals-content">
              {/* Category Sub-tabs */}
              <div className="cps-na-subtabs">
                <button
                  className={`cps-na-subtab ${activeNewCategory === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveNewCategory('all')}
                >
                  Tất cả
                </button>
                {displayCategories.map(cat => (
                  <button
                    key={`na-cat-${cat.id}`}
                    className={`cps-na-subtab ${activeNewCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setActiveNewCategory(cat.id)}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              <div className="cps-carousel-container">
                <button className="cps-carousel-btn cps-carousel-prev" onClick={() => scrollCarousel(newCarouselRef, 'left')}>
                  <ChevronLeft size={24} />
                </button>

                <div className="cps-product-carousel" ref={newCarouselRef}>
                  {/* Trộn danh sách giả lập sản phẩm mới và lọc theo danh mục */}
                  {[...products]
                    .filter(p => activeNewCategory === 'all' || p.categoryId === activeNewCategory)
                    .sort(() => 0.5 - Math.random())
                    .slice(0, 10).map((product) => (
                      <Link to={`/product/${product.id}`} key={`new-${product.id}`} className="cps-product-card">
                        <div className="cps-product-image">
                          {/* Fake badge */}
                          <div className="cps-card-badge">Giảm {Math.floor(Math.random() * 30 + 5)}%</div>
                          <img
                            src={product.thumbnailUrl || 'https://via.placeholder.com/200'}
                            alt={product.name}
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/200' }}
                          />
                        </div>
                        <div className="cps-product-info">
                          <h3 className="cps-product-name">{product.name}</h3>

                          <div className="cps-product-price-row">
                            <span className="cps-price-special">
                              {new Intl.NumberFormat('vi-VN').format(product.startingPrice || 0)} VNĐ
                            </span>
                          </div>

                          {/* Fake Smember & tags like the screenshot */}


                          <div className="cps-delivery-tag">
                            <Truck size={14} /> Giao siêu tốc 2h
                          </div>
                        </div>
                      </Link>
                    ))}
                </div>

                <button className="cps-carousel-btn cps-carousel-next" onClick={() => scrollCarousel(newCarouselRef, 'right')}>
                  <ChevronRight size={24} />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Xử lý hiển thị loading */}
        {loading && products.length === 0 && (
          <section className="cps-block-products">
            <div className="cps-product-grid">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="cps-skeleton-card"></div>
              ))}
            </div>
          </section>
        )}

        {/* Service Policies */}
        <section className="cps-services-section">
          <div className="cps-service-item">
            <ShieldCheck size={40} color="#d70018" />
            <div className="cps-service-text">
              <h4>Bảo hành 12 tháng</h4>
              <p>Chính hãng 100%</p>
            </div>
          </div>
          <div className="cps-service-item">
            <Truck size={40} color="#d70018" />
            <div className="cps-service-text">
              <h4>Giao hàng siêu tốc</h4>
              <p>Miễn phí toàn quốc</p>
            </div>
          </div>
          <div className="cps-service-item">
            <RefreshCw size={40} color="#d70018" />
            <div className="cps-service-text">
              <h4>Đổi trả 30 ngày</h4>
              <p>Lỗi là đổi mới</p>
            </div>
          </div>
          <div className="cps-service-item">
            <CreditCard size={40} color="#d70018" />
            <div className="cps-service-text">
              <h4>Thanh toán linh hoạt</h4>
              <p>Trả góp 0% lãi suất</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
