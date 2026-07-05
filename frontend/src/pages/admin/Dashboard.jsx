import React, { useState, useEffect } from 'react';
import { ShoppingCart, Package, DollarSign, TrendingUp, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalStock: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [bestSellersData, setBestSellersData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const ordersRes = await api.get('/Order?page=1&pageSize=5');
        const ordersData = ordersRes.data;
        
        const productsRes = await api.get('/Product?page=1&pageSize=1');
        const productsData = productsRes.data;

        const stockRes = await api.get('/Product/total-stock');

        let calculatedRevenue = 0;
        if (ordersData.items && Array.isArray(ordersData.items)) {
           calculatedRevenue = ordersData.items.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        }

        setStats({
          totalOrders: ordersData.totalCount || 0,
          totalRevenue: calculatedRevenue,
          totalProducts: productsData.totalCount || 0,
          totalStock: stockRes.data?.totalStock || 0
        });

        if (ordersData.items) {
          setRecentOrders(ordersData.items);
        }

        const revenueRes = await api.get('/Dashboard/monthly-revenue');
        setRevenueData(revenueRes.data.map(item => ({
          name: `Tháng ${item.month}`,
          revenue: item.revenue
        })));

        const bestSellersRes = await api.get('/Dashboard/best-sellers');
        setBestSellersData(bestSellersRes.data.map(item => ({
          name: item.productName,
          value: item.totalSold
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
    { title: 'Tổng đơn hàng', value: stats.totalOrders, icon: <ShoppingCart size={24} />, colorClass: 'blue' },
    { title: 'Doanh thu ước tính (Trang 1)', value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.totalRevenue), icon: <DollarSign size={24} />, colorClass: 'green' },
    { title: 'Sản phẩm', value: stats.totalProducts, icon: <Package size={24} />, colorClass: 'purple' },
    { title: 'Tồn kho', value: stats.totalStock, icon: <TrendingUp size={24} />, colorClass: 'orange' },
  ];

  return (
    <div>
      <div className="admin-header">
        <h1 className="admin-title">Tổng quan thống kê</h1>
      </div>
      
      {/* Stats Grid */}
      <div className="stat-grid">
        {statCards.map((card, index) => (
          <div key={index} className="stat-card">
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
      <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="admin-card" style={{ gridColumn: 'span 2' }}>
          <div className="admin-card-header">
            <h2 className="admin-card-title">Doanh thu theo tháng (Năm {new Date().getFullYear()})</h2>
          </div>
          <div style={{ width: '100%', height: 350, padding: '20px 0' }}>
            <ResponsiveContainer>
              <BarChart data={revenueData} margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tickFormatter={(value) => new Intl.NumberFormat('vi-VN', { notation: "compact", compactDisplay: "short" }).format(value)} 
                />
                <Tooltip 
                  formatter={(value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)}
                  cursor={{fill: 'transparent'}}
                />
                <Legend />
                <Bar dataKey="revenue" name="Doanh thu" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Sản phẩm bán chạy nhất</h2>
          </div>
          <div style={{ width: '100%', height: 350 }}>
            {bestSellersData.length === 0 ? (
              <div style={{display:'flex', height:'100%', alignItems:'center', justifyContent:'center', color:'var(--text-muted)'}}>
                Chưa có dữ liệu
              </div>
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={bestSellersData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => percent > 0.05 ? `${name.substring(0, 15)}... (${(percent * 100).toFixed(0)}%)` : null}
                    outerRadius={100}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={5}
                  >
                    {bestSellersData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} sản phẩm`, 'Đã bán']} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="admin-card">
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
                    <td><strong>#{order.id}</strong></td>
                    <td>{order.customerName}</td>
                    <td>{new Date(order.orderDate).toLocaleDateString('vi-VN')}</td>
                    <td style={{ color: 'var(--primary)', fontWeight: '600' }}>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}
                    </td>
                    <td>
                      <span className={`admin-badge badge-${
                        order.status === 'Pending' ? 'yellow' :
                        order.status === 'Processing' ? 'blue' :
                        order.status === 'Delivered' ? 'green' : 'gray'
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
  );
}
