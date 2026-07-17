import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Search, MapPin, PhoneCall, X } from 'lucide-react';
import api from '../services/api';
import '../styles/CustomerLayout.css';

export default function CustomerLayout() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  let user = null;
  if (userStr) {
    try { user = JSON.parse(userStr); } catch (e) { }
  }

  const [cartCount, setCartCount] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef(null);
  const searchBoxRef = useRef(null);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/Product?searchTerm=${encodeURIComponent(searchTerm)}&pageSize=5`);
        if (res.data && res.data.items) {
          setSuggestions(res.data.items);
        }
      } catch (err) {
        console.error('Lỗi tìm kiếm:', err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProductClick = (id) => {
    setShowSuggestions(false);
    navigate(`/product/${id}`);
  };


  useEffect(() => {
    const fetchCartCount = async () => {
      if (token) {
        try {
          const res = await api.get('/Cart');
          if (res.data && res.data.items) {
            const count = res.data.items.reduce((sum, item) => sum + item.quantity, 0);
            setCartCount(count);
          }
        } catch (err) {
          console.error('Lỗi lấy số lượng giỏ hàng:', err);
        }
      } else {
        setCartCount(0);
      }
    };

    fetchCartCount();

    const handleCartUpdated = () => {
      fetchCartCount();
    };

    window.addEventListener('cartUpdated', handleCartUpdated);
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdated);
    };
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="cps-layout">
      {/* Header */}
      <header className="cps-header">
        <div className="cps-container cps-header-inner">
          <Link to="/" className="cps-logo">Apple Store</Link>

          <div className="cps-search-box" ref={searchBoxRef}>
            <Search className="cps-search-icon-left" size={18} />
            <input 
              type="text" 
              placeholder="Bạn cần tìm gì?" 
              className="cps-search-input" 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => {
                if (searchTerm.trim() !== '') setShowSuggestions(true);
              }}
            />
            {searchTerm && (
              <button className="cps-clear-btn" onClick={() => { setSearchTerm(''); setSuggestions([]); }}>
                <X size={16} />
              </button>
            )}

            {/* Suggestions Dropdown */}
            {showSuggestions && searchTerm.trim() !== '' && (
              <div className="cps-search-suggestions">
                <div className="suggestions-section-title fire">
                  <span role="img" aria-label="fire">🔥</span> Sản phẩm gợi ý
                </div>
                
                {isSearching ? (
                  <div className="suggestions-loading">Đang tìm kiếm...</div>
                ) : suggestions.length > 0 ? (
                  <div className="suggestions-list">
                    {suggestions.map(product => {
                      const discountPrice = product.startingPrice || 0;
                      const originalPrice = discountPrice > 0 ? discountPrice + 1000000 : 0;
                      return (
                        <div key={product.id} className="suggestion-item" onClick={() => handleProductClick(product.id)}>
                          <img src={product.thumbnailUrl || 'https://via.placeholder.com/50'} alt={product.name} />
                          <div className="suggestion-info">
                            <h4>{product.name} | Chính hãng</h4>
                            <div className="suggestion-price">
                              <span className="price-discount">{new Intl.NumberFormat('vi-VN').format(discountPrice)}</span>
                              {originalPrice > 0 && (
                                <span className="price-original">{new Intl.NumberFormat('vi-VN').format(originalPrice)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="suggestions-empty">Không tìm thấy sản phẩm nào</div>
                )}
              </div>
            )}
          </div>

          <div className="cps-header-actions">
            <Link to="/cart" className="cps-action-item header-cart-item">
              <ShoppingCart size={24} />
              <span>Giỏ<br />hàng</span>
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>

            {token ? (
              user?.role?.toLowerCase() === 'admin' ? (
                <div className="cps-user-dropdown">
                  <div className="cps-action-item user-item">
                    <User size={24} />
                    <span>{user?.fullName || 'Admin'}</span>
                  </div>
                  <div className="cps-dropdown-menu">
                    <Link to="/account/profile" className="cps-dropdown-link">Trang cá nhân</Link>
                    <Link to="/admin" className="cps-dropdown-link text-primary">Trang quản trị</Link>
                    <button onClick={handleLogout} className="cps-dropdown-link text-danger w-full text-left">Đăng xuất</button>
                  </div>
                </div>
              ) : (
                <Link to="/account/profile" className="cps-action-item user-item" style={{ textDecoration: 'none' }}>
                  <User size={24} />
                  <span>{user?.fullName || 'Smember'}</span>
                </Link>
              )
            ) : (
              <Link to="/login" className="cps-action-item user-item">
                <User size={24} />
                <span>Đăng<br />nhập</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="cps-main">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="cps-footer">
        <div className="cps-container">
          <div className="footer-grid">
            <div className="footer-col">
              <h3>Mua Sắm & Tìm Hiểu</h3>
              <ul>
                <li><Link to="#">Mac</Link></li>
                <li><Link to="#">iPad</Link></li>
                <li><Link to="#">iPhone</Link></li>
                <li><Link to="#">Watch</Link></li>
                <li><Link to="#">AirPods</Link></li>
                <li><Link to="#">AirTag</Link></li>
                <li><Link to="#">Phụ kiện</Link></li>
              </ul>
            </div>
            
            <div className="footer-col">
              <h3>Dịch Vụ Apple</h3>
              <ul>
                <li><Link to="#">Apple Music</Link></li>
                <li><Link to="#">Apple TV+</Link></li>
                <li><Link to="#">Apple Arcade</Link></li>
                <li><Link to="#">iCloud</Link></li>
                <li><Link to="#">Apple One</Link></li>
                <li><Link to="#">Apple Pay</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h3>Hỗ Trợ & Chính Sách</h3>
              <ul>
                <li><Link to="#">Trang chủ Hỗ trợ</Link></li>
                <li><Link to="#">Bảo hành & Sửa chữa</Link></li>
                <li><Link to="#">AppleCare+</Link></li>
                <li><Link to="#">Hỗ trợ thanh toán</Link></li>
                <li><Link to="#">Tình trạng Đơn hàng</Link></li>
                <li><Link to="#">Liên hệ với chúng tôi</Link></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            &copy; {new Date().getFullYear()} Apple Store. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
