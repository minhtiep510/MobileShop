import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Star, ShieldCheck, Truck, RefreshCw, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import '../../styles/Home.css';
import BannerSlider from '../../components/BannerSlider';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Refs for carousels
  const newCarouselRef = useRef(null);

  const scrollCarousel = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([
          api.get('/Product?page=1&pageSize=100'),
          api.get('/Category?page=1&pageSize=100')
        ]);

        if (prodRes.data && prodRes.data.items) setProducts(prodRes.data.items);
        else if (Array.isArray(prodRes.data)) setProducts(prodRes.data);

        if (catRes.data && catRes.data.items) setCategories(catRes.data.items);
        else if (Array.isArray(catRes.data)) setCategories(catRes.data);
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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

    setTimeout(() => {
      const elements = document.querySelectorAll('.animate-on-scroll');
      elements.forEach(el => observer.observe(el));
    }, 100);

    return () => {
      const elements = document.querySelectorAll('.animate-on-scroll');
      elements.forEach(el => observer.unobserve(el));
    };
  }, [products, categories, selectedCategory, currentPage]);

  // Lọc sản phẩm theo danh mục đang chọn
  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.categoryId === parseInt(selectedCategory));

  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);
  const pagedProducts = filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    setCurrentPage(1); // reset về trang 1 khi đổi danh mục
  };

  return (
    <div className="cps-home">
      <div className="cps-container">

        {/* Dynamic Banner Slider - Grid layout: 1 lớn + 2 nhỏ */}
        <BannerSlider mode="grid" />

        {/* Chọn danh mục */}
        {!loading && categories.length > 0 && (
          <section className="home-category-tabs animate-on-scroll">
            <div className="home-category-header">
              <h2 className="home-category-title">Sản Phẩm</h2>
            </div>
            <div className="home-category-list">
              <button
                className={`home-cat-tab ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => handleCategoryChange('all')}
              >
                Tất cả
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`home-cat-tab ${selectedCategory === String(cat.id) ? 'active' : ''}`}
                  onClick={() => handleCategoryChange(String(cat.id))}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Lưới sản phẩm */}
        {!loading && filteredProducts.length > 0 && (
          <section className="cps-block-products animate-on-scroll">
            <div className="cps-product-grid">
              {pagedProducts.map((product) => (
                <Link to={`/product/${product.id}`} key={`prod-${product.id}`} className="cps-product-card">
                  <div className="cps-product-image">
                    <img
                      src={product.thumbnailUrl || 'https://via.placeholder.com/200'}
                      alt={product.name}
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/200' }}
                    />
                  </div>
                  <div className="cps-product-info">
                    <h3 className="cps-product-name">{product.name}</h3>
                    <div className="cps-product-rating">
                      {[...Array(5)].map((_, i) => (
                        <Star key={`star-${i}`} size={14} fill="#f59e0b" color="#f59e0b" />
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Phân trang */}
            {totalPages > 1 && (
              <div className="home-pagination">
                <button
                  className="home-page-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  &#8249;
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    className={`home-page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className="home-page-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  &#8250;
                </button>
              </div>
            )}
          </section>
        )}

        {/* Loading skeleton */}
        {loading && (
          <section className="cps-block-products">
            <div className="cps-product-grid">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="cps-skeleton-card"></div>
              ))}
            </div>
          </section>
        )}

        {/* Không có sản phẩm */}
        {!loading && filteredProducts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#86868b' }}>
            <p style={{ fontSize: '1.1rem' }}>Không có sản phẩm nào trong danh mục này.</p>
          </div>
        )}

        {/* Sản phẩm mới nhất - carousel */}
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
                    .sort((a, b) => b.id - a.id)
                    .slice(0, 10).map((product, index) => (
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
                  ))}
                </div>

                <button className="cps-carousel-btn cps-carousel-next" onClick={() => scrollCarousel(newCarouselRef, 'right')}>
                  <ChevronRight size={24} />
                </button>
              </div>
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
