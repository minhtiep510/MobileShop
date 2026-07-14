import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Star, Smartphone, Laptop, Tablet, Watch, Headphones, Tv, ShieldCheck, Truck, RefreshCw, CreditCard, ChevronLeft, ChevronRight, Box } from 'lucide-react';
import api from '../../services/api';
import '../../styles/Home.css';

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

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    // Give React a small tick to render the elements
    setTimeout(() => {
      const elements = document.querySelectorAll('.animate-on-scroll');
      elements.forEach(el => observer.observe(el));
    }, 100);

    return () => {
      const elements = document.querySelectorAll('.animate-on-scroll');
      elements.forEach(el => observer.unobserve(el));
    };
  }, [products, categories]);

  // Placeholder if categories fetch is slow or empty
  const defaultCategories = [
    { name: 'Đang tải danh mục...', icon: <Smartphone size={18} /> }
  ];

  const displayCategories = categories.length > 0 ? categories : (loading ? defaultCategories : []);

  // Map category name to icon
  const getCategoryIcon = (categoryName) => {
    if (!categoryName) return <Box size={18} />;
    const name = categoryName.toLowerCase();
    if (name.includes('điện thoại') || name.includes('phone') || name.includes('apple')) return <Smartphone size={18} />;
    if (name.includes('laptop') || name.includes('máy tính') || name.includes('mac')) return <Laptop size={18} />;
    if (name.includes('tablet') || name.includes('máy tính bảng') || name.includes('ipad')) return <Tablet size={18} />;
    if (name.includes('đồng hồ') || name.includes('watch')) return <Watch size={18} />;
    if (name.includes('tai nghe') || name.includes('âm thanh') || name.includes('loa')) return <Headphones size={18} />;
    if (name.includes('tivi') || name.includes('tv') || name.includes('màn hình')) return <Tv size={18} />;
    return <Box size={18} />; // Default icon
  };

  // Lấy ID danh mục dựa theo tên từ Backend để link động
  const getCatId = (keyword, fallbackIndex = 0) => {
    if (!categories.length) return '';
    const cat = categories.find(c => c.name.toLowerCase().includes(keyword.toLowerCase()));
    return cat ? cat.id : (categories[fallbackIndex]?.id || '');
  };

  return (
    <div className="cps-home">
      <div className="cps-container">

        {/* Top Navigation & Banner Section */}
        <div className="cps-home-menu">
          <ul className="cps-menu-list">
            {displayCategories.map((cat, idx) => (
              <Link 
                to={cat.id ? `/category/${cat.id}` : '#'} 
                key={cat.id || idx} 
                style={{ textDecoration: 'none' }}
              >
                <li className="cps-menu-item">
                  {getCategoryIcon(cat.name)}
                  <span>{cat.name}</span>
                </li>
              </Link>
            ))}
          </ul>
        </div>

        <section className="cps-banner-section animate-on-scroll">
          <div className="cps-main-slider premium-hero">
            <div className="premium-hero-content">
              <h1 className="hero-title">Pro. Beyond.</h1>
              <p className="hero-subtitle">iPhone 16 Pro Max. Titanium tinh xảo. Sức mạnh Apple Intelligence.</p>
              <div className="hero-actions">
                <Link to={`/category/${getCatId('điện thoại', 0)}`} className="btn-primary">Mua ngay</Link>
                <a href="#bento" className="btn-secondary">Tìm hiểu thêm</a>
              </div>
            </div>
            <div className="premium-hero-image-wrap">
              <img src="https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=2070&h=800&fit=crop" alt="iPhone 16 Pro Max" className="hero-img-scale" />
            </div>
          </div>
        </section>

        {/* Bento Box Grid - Nổi bật */}
        <section id="bento" className="cps-bento-section animate-on-scroll" style={{ marginTop: '40px' }}>
          <div className="bento-grid">
            {/* Box 1 - Big */}
            <Link to={`/category/${getCatId('mac', 1)}`} className="bento-box bento-large bento-macbook">
              <div className="bento-content dark-text">
                <h3>MacBook Pro M3</h3>
                <p>Khai phóng sức mạnh khủng khiếp.</p>
              </div>
              <img src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1000&fit=crop" alt="MacBook Pro" />
            </Link>

            {/* Box 2 - Medium */}
            <Link to={`/category/${getCatId('watch', 2)}`} className="bento-box bento-medium bento-watch">
              <div className="bento-content light-text">
                <h3>Apple Watch Series 9</h3>
                <p>Thông minh hơn. Sáng hơn.</p>
              </div>
              <img src="https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?q=80&w=600&fit=crop" alt="Apple Watch" />
            </Link>

            {/* Box 3 - Small 1 */}
            <Link to={`/category/${getCatId('ipad', 3)}`} className="bento-box bento-small bento-ipad">
              <div className="bento-content dark-text">
                <h3>iPad Pro</h3>
                <p>Siêu mỏng. Siêu mạnh.</p>
              </div>
              <img src="https://images.unsplash.com/photo-1589739900266-43b2843f4c12?q=80&w=600&fit=crop" alt="iPad Pro" />
            </Link>
            
            {/* Box 4 - Small 2 */}
            <Link to={`/category/${getCatId('tai nghe', 4)}`} className="bento-box bento-small bento-airpods">
              <div className="bento-content light-text">
                <h3>AirPods Pro 2</h3>
                <p>Chống ồn đỉnh cao.</p>
              </div>
              <img src="https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?q=80&w=600&fit=crop" alt="AirPods" />
            </Link>
          </div>
        </section>

        {/* Sản Phẩm Bán Chạy Nhất */}
        {!loading && products.length > 0 && (
          <section className="cps-block-products animate-on-scroll">
            <div className="cps-block-header">
              <h2 className="cps-block-title" style={{ textTransform: 'uppercase' }}>
                SẢN PHẨM BÁN CHẠY NHẤT
              </h2>
            </div>

            <div className="cps-product-grid">
              {products.slice(0, 15).map((product) => (
                <Link to={`/product/${product.id}`} key={`bestseller-${product.id}`} className="cps-product-card">
                  <div className="cps-product-image">
                    <img
                      src={product.thumbnailUrl || 'https://via.placeholder.com/200'}
                      alt={product.name}
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/200' }}
                    />
                  </div>
                  <div className="cps-product-info">
                    <h3 className="cps-product-name">{product.name}</h3>
                    {/* Price removed based on user request */}
                    <div className="cps-product-rating">
                      {[...Array(5)].map((_, i) => (
                        <Star key={`star-${i}`} size={14} fill="#f59e0b" color="#f59e0b" />
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
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

        {/* Khung Thế hệ mới nhất */}
        {!loading && products.length > 0 && (
          <section className="cps-block-products apple-new-arrivals-block dark-mode-section animate-on-scroll" style={{ marginTop: '60px' }}>
            <div className="apple-new-arrivals-header" style={{ marginBottom: '20px', paddingLeft: '20px' }}>
              <h2 className="apple-new-title" style={{ fontSize: '2.5rem', fontWeight: 500, color: '#f5f5f7', letterSpacing: '-0.015em' }}>
                <strong>Thế hệ mới nhất.</strong> <span style={{ color: '#86868b' }}>Xem ngay có gì mới.</span>
              </h2>
            </div>

            <div className="cps-new-arrivals-content">
              <div className="cps-carousel-container">
                <button className="cps-carousel-btn cps-carousel-prev" onClick={() => scrollCarousel(newCarouselRef, 'left')}>
                  <ChevronLeft size={24} />
                </button>

                <div className="cps-product-carousel apple-hero-carousel" ref={newCarouselRef}>
                  {[...products]
                    .filter(p => activeNewCategory === 'all' || p.categoryId === activeNewCategory)
                    .sort((a, b) => b.id - a.id) /* 10 sản phẩm nhập mới nhất */
                    .slice(0, 10).map((product, index) => {
                      const displayPrice = product.price || (product.variants && product.variants.length > 0 ? product.variants[0].price : 0);
                      return (
                      <Link to={`/product/${product.id}`} key={`new-${product.id}`} className={`apple-hero-card ${index === 0 ? 'dark' : 'light'}`}>
                        <div className="apple-hero-info">
                          <span className="apple-hero-label">MỚI</span>
                          <h3 className="apple-hero-name">{product.name}</h3>
                          <p className="apple-hero-desc">{product.categoryName || 'Siêu phẩm mới ra mắt'}</p>
                        </div>
                        <div className="apple-hero-image-wrap">
                          <img
                            src={product.thumbnailUrl || 'https://via.placeholder.com/400'}
                            alt={product.name}
                            className="apple-hero-image"
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/400' }}
                          />
                        </div>
                      </Link>
                    )})}
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
        <section className="cps-services-section animate-on-scroll">
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
