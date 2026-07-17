import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, PackageX, ChevronRight, Home, ChevronDown } from 'lucide-react';
import api from '../../services/api';
import '../../styles/CategoryProducts.css';
import BannerSlider from '../../components/BannerSlider';

export default function CategoryProducts() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categoryName, setCategoryName] = useState('Đang tải...');
  const [loading, setLoading] = useState(true);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [sortBy, setSortBy] = useState('Theo Khuyến Nghị');

  const sortOptions = [
    'Mới Nhất',
    'Phổ Biến Nhất',
    'Highest Rated',
    'Theo Khuyến Nghị',
    'Giá: từ cao đến thấp',
    'Giá: từ thấp đến cao'
  ];

  const filterButtons = [
    'Bộ nhớ',
    'Khoảng Giá'
  ];

  const getSortedProducts = () => {
    let sorted = [...products];
    switch (sortBy) {
      case 'Giá: từ thấp đến cao':
        sorted.sort((a, b) => (a.startingPrice || 0) - (b.startingPrice || 0));
        break;
      case 'Giá: từ cao đến thấp':
        sorted.sort((a, b) => (b.startingPrice || 0) - (a.startingPrice || 0));
        break;
      case 'Mới Nhất':
        sorted.sort((a, b) => b.id - a.id);
        break;
      default:
        // 'Theo Khuyến Nghị', 'Phổ Biến Nhất', 'Highest Rated' - giữ nguyên hoặc theo ID
        break;
    }
    return sorted;
  };

  const displayedProducts = getSortedProducts();

  useEffect(() => {
    const fetchCategoryAndProducts = async () => {
      setLoading(true);
      try {
        // Fetch all categories to get the name of the current one
        const catRes = await api.get('/Category');
        let cats = [];
        if (catRes.data && catRes.data.items) {
          cats = catRes.data.items;
        } else if (Array.isArray(catRes.data)) {
          cats = catRes.data;
        }
        
        const currentCat = cats.find(c => c.id === parseInt(id));
        if (currentCat) {
          setCategoryName(currentCat.name);
        } else {
          setCategoryName('Danh mục không xác định');
        }

        // Fetch products for this category
        const prodRes = await api.get(`/Product?page=1&pageSize=100&categoryId=${id}`);
        if (prodRes.data && prodRes.data.items) {
          setProducts(prodRes.data.items);
        } else if (Array.isArray(prodRes.data)) {
          setProducts(prodRes.data.filter(p => p.categoryId === parseInt(id))); // Fallback filtering
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu danh mục:', err);
        setCategoryName('Lỗi tải danh mục');
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryAndProducts();
  }, [id]);

  return (
    <div className="category-page-wrapper">
      <div className="cps-container">
        
        {/* Breadcrumb */}
        <div className="cps-breadcrumb" style={{ padding: '20px 0' }}>
          <span onClick={() => navigate('/')}>Trang chủ</span>
          <ChevronRight size={14} />
          <span className="active">{categoryName}</span>
        </div>

        {/* Category Banner */}
        <div className="category-banner">
          <h1 className="category-banner-title">Mua {categoryName}.</h1>
          <p className="category-banner-subtitle">Sự lựa chọn hoàn hảo của bạn.</p>
        </div>

        {/* Dynamic Banner Slider */}
        <BannerSlider />

        {/* Filter Section */}
        <div className="category-filter-section">
          <div className="filter-top-bar">
            <div className="filter-info">
              <span className="filter-label">Bộ lọc</span>
              <span className="filter-divider">|</span>
              <span className="filter-results"><strong>{displayedProducts.length}</strong> Kết quả</span>
            </div>
            
            <div className="filter-sort">
              <span className="sort-label">Sắp xếp</span>
              <div className="sort-dropdown-container">
                <button 
                  className="sort-dropdown-button"
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                >
                  {sortBy} <ChevronDown size={18} />
                </button>
                {showSortDropdown && (
                  <div className="sort-dropdown-menu">
                    {sortOptions.map((option, idx) => (
                      <div 
                        key={idx} 
                        className={`sort-option ${sortBy === option ? 'selected' : ''}`}
                        onClick={() => {
                          setSortBy(option);
                          setShowSortDropdown(false);
                        }}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="filter-bottom-bar">
            {filterButtons.map((btn, idx) => (
              <button key={idx} className="filter-pill-button">
                {btn} <ChevronDown size={16} />
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="cps-product-grid">
            {[...Array(10)].map((_, index) => (
              <div key={index} className="cps-skeleton-card"></div>
            ))}
          </div>
        ) : (
          /* Products Grid */
          displayedProducts.length > 0 ? (
            <div className="cps-product-grid category-products-grid">
              {displayedProducts.map((product) => (
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
                    {/* Price removed based on user request */}
                    <div className="cps-product-rating">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="category-empty-state">
              <PackageX size={64} />
              <h3>Không tìm thấy sản phẩm</h3>
              <p>Hiện tại chưa có sản phẩm nào trong danh mục này. Vui lòng quay lại sau.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
