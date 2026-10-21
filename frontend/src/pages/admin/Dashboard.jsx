import React, { useState, useEffect } from 'react';
import { ShoppingCart, Package, DollarSign, TrendingUp, Users, PieChart as PieIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api, { API_BASE_URL } from '../../services/api';

const PIE_COLORS = ['#0071e3', '#34c759', '#ff9500', '#af52de', '#ff2d55', '#5856d6', '#00c7be'];

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalStock: 0
  });
  const navigate = useNavigate();
  const [recentOrders, setRecentOrders] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [categoryRevenueData, setCategoryRevenueData] = useState([]);
  const [bestSellersData, setBestSellersData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [ordersRes, productsRes, stockRes, revenueRes, bestSellersRes, categoryRes] = await Promise.all([
          api.get('/Order?page=1&pageSize=5'),
          api.get('/Product?page=1&pageSize=1'),
          api.get('/Product/total-stock'),
          api.get('/Dashboard/monthly-revenue'),
          api.get('/Dashboard/best-sellers?limit=10'),
          api.get('/Dashboard/category-revenue')
        ]);

        const ordersData = ordersRes.data;
        const productsData = productsRes.data;
        const stockData = stockRes.data;

        if (ordersData.items) {
          setRecentOrders(ordersData.items);
        }

        setRevenueData(revenueRes.data.map(item => ({
          name: `Tháng ${item.month}`,
          revenue: item.revenue
        })));

        // Tính tổng doanh thu thực tế trong năm
        const realTotalRevenue = revenueRes.data.reduce((sum, item) => sum + item.revenue, 0);

        setStats({
          totalOrders: ordersData.totalCount || 0,
          totalRevenue: realTotalRevenue,
          totalProducts: productsData.totalCount || 0,
          totalStock: stockData?.totalStock || 0
        });

        setBestSellersData(bestSellersRes.data || []);
        
        // Dữ liệu biểu đồ hình tròn theo danh mục
        setCategoryRevenueData((categoryRes.data || []).map(item => ({
          name: item.categoryName,
          value: item.totalRevenue,
          sold: item.totalSold
        })));

      } catch (error) {
        console.error('Lỗi khi tải dữ liệu dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '64vh' }}>
        <div className="loader" style={{
          border: '3px solid var(--background)',
          borderTop: '3px solid var(--primary)',
          borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  const statCards = [
    { title: 'Tổng đơn hàng', value: stats.totalOrders, icon: <ShoppingCart size={24} />, colorClass: 'blue', link: '/admin/orders' },
    { title: 'Tổng doanh thu (Năm nay)', value: new Intl.NumberFormat('vi-VN').format(stats.totalRevenue) + ' đ', icon: <DollarSign size={24} />, colorClass: 'green', link: '/admin/orders' },
    { title: 'Sản phẩm', value: stats.totalProducts, icon: <Package size={24} />, colorClass: 'purple', link: '/admin/products' },
    { title: 'Tồn kho', value: stats.totalStock, icon: <TrendingUp size={24} />, colorClass: 'orange', link: '/admin/products' },
  ];

  return (
    <div>
      <div className="admin-header">
        <h1 className="admin-title">Tổng quan thống kê</h1>
      </div>

      {/* Stats Grid */}
      <div className="stat-grid">
        {statCards.map((card, index) => (
          <div key={index} className="stat-card" onClick={() => navigate(card.link)} style={{ cursor: 'pointer' }}>
            <div className={`stat-icon ${card.colorClass}`}>
              {card.icon}
            </div>
            <div className="stat-info">
              <p>{card.title}</p>
              <h3>{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px', marginBottom: '24px' }}>
        
        {/* Cột 1: Biểu đồ cột Doanh thu theo tháng (Chiếm 7/12 cột) */}
        <div className="admin-card" style={{ gridColumn: 'span 7' }}>
          <div className="admin-card-header">
            <h2 className="admin-card-title">Doanh thu theo tháng (Năm {new Date().getFullYear()})</h2>
          </div>
          <div style={{ width: '100%', height: 350, padding: '20px 0' }}>
            <ResponsiveContainer>
              <BarChart data={revenueData} margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => new Intl.NumberFormat('vi-VN', { notation: "compact", compactDisplay: "short" }).format(value)}
                />
                <Tooltip
                  formatter={(value) => new Intl.NumberFormat('vi-VN').format(value) + ' đ'}
                  cursor={{ fill: 'transparent' }}
                />
                <Legend />
                <Bar dataKey="revenue" name="Doanh thu" fill="#0071e3" radius={[4, 4, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cột 2: BIỂU ĐỒ HÌNH TRÒN - Doanh thu theo Danh mục sản phẩm (Chiếm 5/12 cột) */}
        <div className="admin-card" style={{ gridColumn: 'span 5' }}>
          <div className="admin-card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieIcon size={20} color="#0071e3" />
            <h2 className="admin-card-title">Doanh thu theo Danh mục</h2>
          </div>
          <div style={{ width: '100%', height: 350, padding: '10px 0' }}>
            {categoryRevenueData.length === 0 ? (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Chưa có dữ liệu danh mục
              </div>
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Tooltip
                    formatter={(value) => [new Intl.NumberFormat('vi-VN').format(value) + ' đ', 'Doanh thu']}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span style={{ color: '#1d1d1f', fontSize: '13px', fontWeight: '500' }}>{value}</span>}
                  />
                  <Pie
                    data={categoryRevenueData}
                    cx="50%"
                    cy="45%"
                    innerRadius={65}
                    outerRadius={105}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryRevenueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Row 2: Top 10 Bán chạy & Đơn hàng gần đây */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px', marginBottom: '24px' }}>
        
        {/* Top 10 Bán chạy */}
        <div className="admin-card" style={{ gridColumn: 'span 5' }}>
          <div className="admin-card-header">
            <h2 className="admin-card-title">Top 10 sản phẩm bán chạy nhất</h2>
          </div>
          <div style={{ width: '100%', height: 380, overflowY: 'auto', padding: '0 20px' }}>
            {bestSellersData.length === 0 ? (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Chưa có dữ liệu
              </div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {bestSellersData.map((item, index) => (
                  <li key={index} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: index < 3 ? '#0071e3' : 'var(--text-muted)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px', flexShrink: 0 }}>
                      {index + 1}
                    </div>
                    <img src={item.thumbnailUrl ? (item.thumbnailUrl.startsWith('/') ? `${API_BASE_URL}${item.thumbnailUrl}` : item.thumbnailUrl) : 'https://via.placeholder.com/50'} alt="product" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} onError={e => e.target.src = 'https://via.placeholder.com/50'} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.productName}</h4>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#0071e3', fontWeight: 600 }}>SKU: {item.variantSku}</p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Đã bán</p>
                      <h3 style={{ margin: 0, color: 'var(--green)', fontSize: '0.95rem' }}>{item.totalSold}</h3>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Đơn hàng gần đây */}
        <div className="admin-card" style={{ gridColumn: 'span 7' }}>
          <div className="admin-card-header">
            <h2 className="admin-card-title">Đơn hàng gần đây</h2>
          </div>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã ĐH</th>
                  <th>Khách hàng</th>
                  <th>Ngày đặt</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có đơn hàng nào.</td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td><strong>DH-{order.id}</strong></td>
                      <td>{order.customerName}</td>
                      <td>{new Date(order.date).toLocaleDateString('vi-VN')}</td>
                      <td style={{ fontWeight: '600', color: '#0071e3' }}>{new Intl.NumberFormat('vi-VN').format(order.totalAmount)} đ</td>
                      <td>
                        <span className={`admin-badge badge-${
                          order.status?.toLowerCase() === 'delivered' ? 'green' :
                          order.status?.toLowerCase() === 'shipped' ? 'blue' :
                          order.status?.toLowerCase() === 'cancelled' ? 'red' : 'yellow'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
