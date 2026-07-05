import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { User, Package, Key, LogOut, Shield } from 'lucide-react';
import './ProfileLayout.css';

export default function ProfileLayout() {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  let user = null;
  if (userStr) {
    try { user = JSON.parse(userStr); } catch(e){}
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="cps-container py-8">
      <div className="account-layout">
        {/* Sidebar */}
        <div className="account-sidebar">
          <div className="account-sidebar-header">
            <div className="account-sidebar-avatar">
              <User size={28} />
            </div>
            <div className="account-sidebar-info">
              <h3>{user.fullName || 'Thành viên'}</h3>
              <p>Tài khoản của tôi</p>
            </div>
          </div>
          <ul className="account-menu">
            <li>
              <NavLink to="/account/profile" className={({ isActive }) => `account-menu-link ${isActive ? 'active' : ''}`}>
                <User size={20} />
                Hồ sơ của tôi
              </NavLink>
            </li>
            <li>
              <NavLink to="/account/orders" className={({ isActive }) => `account-menu-link ${isActive ? 'active' : ''}`}>
                <Package size={20} />
                Đơn mua
              </NavLink>
            </li>
            <li>
              <NavLink to="/account/password" className={({ isActive }) => `account-menu-link ${isActive ? 'active' : ''}`}>
                <Key size={20} />
                Đổi mật khẩu
              </NavLink>
            </li>
            {user && user.role && user.role.toLowerCase() === 'admin' && (
              <li style={{ borderTop: '1px solid var(--cps-border)', marginTop: '10px', paddingTop: '10px' }}>
                <NavLink to="/admin" className="account-menu-link" style={{ color: '#2563eb' }}>
                  <Shield size={20} />
                  Trang quản trị
                </NavLink>
              </li>
            )}
            <li style={{ borderTop: '1px solid var(--cps-border)', marginTop: '10px', paddingTop: '10px' }}>
              <button onClick={handleLogout} className="account-menu-link" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', borderLeft: '3px solid transparent' }}>
                <LogOut size={20} />
                Đăng xuất
              </button>
            </li>
          </ul>
        </div>

        {/* Main Content Area */}
        <div className="account-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
