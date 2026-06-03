import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Coffee, Image as ImageIcon, LogOut, LayoutDashboard, MapPin, Ticket, MessageSquare, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/login');
  };

  const navItems = [
    { name: 'Sản phẩm', path: '/products', icon: <Coffee size={20} /> },
    { name: 'Chi nhánh', path: '/branches', icon: <MapPin size={20} /> },
    { name: 'Banner', path: '/banners', icon: <ImageIcon size={20} /> },
    { name: 'Mã giảm giá', path: '/vouchers', icon: <Ticket size={20} /> },
    { name: 'Đơn hàng', path: '/orders', icon: <LayoutDashboard size={20} /> },
    { name: 'Chat', path: '/chat', icon: <MessageSquare size={20} /> },
  ];

  return (
    <div className="app-container">
      {/* Mobile Header */}
      <div className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LayoutDashboard color="var(--primary)" size={24} />
          <h2 style={{ fontSize: '18px', color: 'var(--primary)', fontWeight: 700, margin: 0 }}>Admin Panel</h2>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="mobile-menu-btn">
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''} animate-fade-in`}>
        <button className="mobile-close-btn" onClick={() => setIsSidebarOpen(false)}>
          <X size={20} />
        </button>
        
        <div style={{ padding: '20px 0', borderBottom: '1px solid var(--border-color)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <LayoutDashboard color="var(--primary)" size={28} />
          <h2 style={{ fontSize: '20px', color: 'var(--primary)', margin: 0 }}>Admin Panel</h2>
        </div>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setIsSidebarOpen(false); // Close sidebar on navigate in mobile
                }}
                className="btn"
                style={{
                  justifyContent: 'flex-start',
                  background: isActive ? 'var(--primary)' : 'transparent',
                  color: isActive ? 'white' : 'var(--text-dark)',
                  boxShadow: isActive ? '0 4px 12px rgba(198, 124, 78, 0.2)' : 'none',
                }}
              >
                {item.icon}
                <span>{item.name}</span>
              </button>
            )
          })}
        </div>

        <button 
          onClick={handleLogout}
          className="btn btn-danger" 
          style={{ marginTop: 'auto', width: '100%' }}
        >
          <LogOut size={18} />
          <span>Đăng xuất</span>
        </button>
      </div>
      
      {/* Main Content */}
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}
