import React from 'react';
import { Outlet, Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, LogOut, Users, Home, List } from 'lucide-react';
import '../styles/Admin.css';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  // Basic role check
  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    if (user.role?.toLowerCase() !== 'admin') {
      return <Navigate to="/" replace />;
    }
  } catch (e) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname.includes(path) ? 'active' : '';
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <Link to="/admin" className="admin-sidebar-logo">Admin Panel</Link>
        </div>

        <nav className="admin-nav">
          <Link to="/admin/dashboard" className={`admin-nav-link ${isActive('dashboard')}`}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link to="/admin/products" className={`admin-nav-link ${isActive('products')}`}>
            <Package size={20} />
            <span>Sản phẩm</span>
          </Link>
          <Link to="/admin/categories" className={`admin-nav-link ${isActive('categories')}`}>
            <List size={20} />
            <span>Danh mục</span>
          </Link>
          <Link to="/admin/orders" className={`admin-nav-link ${isActive('orders')}`}>
            <ShoppingCart size={20} />
            <span>Đơn hàng</span>
          </Link>
          <Link to="/admin/users" className={`admin-nav-link ${isActive('users')}`}>
            <Users size={20} />
            <span>Người dùng</span>
          </Link>
          <Link to="/" className={`admin-nav-link ${isActive('home')}`}>
            <Home size={20} />
            <span>Về trang chủ</span>
          </Link>
        </nav>

        <div className="admin-sidebar-footer">
          <button onClick={handleLogout} className="admin-logout-btn">
            <LogOut size={20} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
