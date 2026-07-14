import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, PackageX, ChevronRight, Home } from 'lucide-react';
import api from '../../services/api';
import '../../styles/CategoryProducts.css';

export default function CategoryProducts() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categoryName, setCategoryName] = useState('Đang tải...');
  const [loading, setLoading] = useState(true);

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

        {/* Loading State */}
        {loading ? (
          <div className="cps-product-grid">
            {[...Array(10)].map((_, index) => (
              <div key={index} className="cps-skeleton-card"></div>
            ))}
          </div>
        ) : (
          /* Products Grid */
          products.length > 0 ? (
            <div className="cps-product-grid category-products-grid">
              {products.map((product) => (
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
