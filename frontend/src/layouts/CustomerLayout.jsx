import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Search, MapPin, PhoneCall } from 'lucide-react';
import api from '../services/api';
import './CustomerLayout.css';

export default function CustomerLayout() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  let user = null;
  if (userStr) {
    try { user = JSON.parse(userStr); } catch(e){}
  }

  const [cartCount, setCartCount] = useState(0);

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
          <Link to="/" className="cps-logo">PhoneStore</Link>

          <div className="cps-search-box">
            <input type="text" placeholder="Bạn cần tìm gì?" className="cps-search-input" />
            <button className="cps-search-btn"><Search size={20} /></button>
          </div>

          <div className="cps-header-actions">
            <Link to="/cart" className="cps-action-item header-cart-item">
              <ShoppingCart size={24} />
              <span>Giỏ<br/>hàng</span>
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>

            {token ? (
              <div className="cps-user-dropdown">
                <div className="cps-action-item user-item">
                  <User size={24} />
                  <span>{user?.fullName || 'Smember'}</span>
                </div>
                <div className="cps-dropdown-menu">
                  <Link to="/my-orders" className="cps-dropdown-link">Đơn hàng của tôi</Link>
                  {user?.role?.toLowerCase() === 'admin' && (
                    <Link to="/admin" className="cps-dropdown-link text-primary">Trang quản trị</Link>
                  )}
                  <button onClick={handleLogout} className="cps-dropdown-link text-danger w-full text-left">Đăng xuất</button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="cps-action-item user-item">
                <User size={24} />
                <span>Đăng<br/>nhập</span>
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
        <div className="cps-container text-center text-sm text-gray-500 py-8">
          &copy; {new Date().getFullYear()} PhoneStore - Clone phong cách CellphoneS. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
