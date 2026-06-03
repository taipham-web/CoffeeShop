import { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';
import api from '../api/axios';
import Modal from '../components/Modal';

interface OrderItem {
  _id: string;
  name: string;
  subtitle: string;
  quantity: number;
  price: number;
  imageUrl: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

interface Order {
  _id: string;
  user: User;
  items: OrderItem[];
  orderType: string;
  deliveryAddress: { title: string; detail: string; note: string };
  subTotal: number;
  deliveryFee: number;
  totalPayment: number;
  paymentMethod: string;
  status: 'pending' | 'processing' | 'delivering' | 'completed' | 'cancelled';
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#FF9800',
  processing: '#2196F3',
  delivering: '#9C27B0',
  completed: '#4CAF50',
  cancelled: '#F44336'
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  processing: 'Đang chuẩn bị',
  delivering: 'Đang giao hàng',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy'
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/all');
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      fetchOrders();
    } catch (err) {
      alert('Lỗi cập nhật trạng thái đơn hàng');
      console.error(err);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800 }}>Quản lý Đơn hàng</h1>
      </div>

      <div className="table-wrapper glass-panel">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>Đang tải...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Loại đơn</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>#{order._id.slice(-6).toUpperCase()}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>
                      {new Date(order.createdAt).toLocaleString()}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{order.user?.name || 'Khách Vãng Lai'}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-gray)' }}>{order.user?.email || ''}</div>
                  </td>
                  <td>
                    <span style={{ 
                      background: order.orderType === 'delivery' ? '#E3F2FD' : '#FFF3E0', 
                      color: order.orderType === 'delivery' ? '#1565C0' : '#E65100', 
                      padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600 
                    }}>
                      {order.orderType === 'delivery' ? 'Giao hàng' : 'Nhận tại cửa hàng'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{order.totalPayment.toLocaleString('vi-VN')} VNĐ</td>
                  <td>
                    <select
                      value={order.status}
                      disabled={order.status === 'cancelled'}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      style={{
                        padding: '6px 12px', borderRadius: '8px', border: 'none', fontWeight: 600,
                        backgroundColor: `${STATUS_COLORS[order.status]}20`,
                        color: STATUS_COLORS[order.status],
                        outline: 'none', cursor: order.status === 'cancelled' ? 'not-allowed' : 'pointer',
                        opacity: order.status === 'cancelled' ? 0.7 : 1
                      }}
                    >
                      {Object.keys(STATUS_LABELS).map(key => (
                        <option key={key} value={key}>{STATUS_LABELS[key]}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button onClick={() => setSelectedOrder(order)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }} title="Xem chi tiết">
                      <Eye size={20} />
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>Chưa có đơn hàng nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Chi tiết đơn hàng #${selectedOrder?._id.slice(-6).toUpperCase()}`}>
        {selectedOrder && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: 'var(--text-gray)', marginBottom: '8px' }}>Thông tin khách hàng</h4>
              <div style={{ fontWeight: 600 }}>{selectedOrder.user?.name || 'Khách Vãng Lai'}</div>
              <div style={{ fontSize: '14px', marginTop: '4px' }}>{selectedOrder.user?.email || 'Không có email'}</div>
              <div style={{ fontSize: '14px', marginTop: '4px' }}>SDT: {selectedOrder.user?.phone || 'Chưa cung cấp'}</div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: 'var(--text-gray)', marginBottom: '8px' }}>Thông tin giao hàng</h4>
              {selectedOrder.orderType === 'delivery' ? (
                <>
                  <div style={{ fontWeight: 600 }}>{selectedOrder.deliveryAddress.title}</div>
                  <div style={{ fontSize: '14px' }}>{selectedOrder.deliveryAddress.detail}</div>
                  {selectedOrder.deliveryAddress.note && <div style={{ fontSize: '13px', color: 'var(--primary)', marginTop: '4px' }}>Ghi chú: {selectedOrder.deliveryAddress.note}</div>}
                </>
              ) : (
                <>
                  <div style={{ fontWeight: 600, color: 'var(--primary)' }}>Nhận tại chi nhánh: {selectedOrder.deliveryAddress.title}</div>
                  <div style={{ fontSize: '14px' }}>{selectedOrder.deliveryAddress.detail}</div>
                  {selectedOrder.deliveryAddress.note && <div style={{ fontSize: '13px', color: 'var(--primary)', marginTop: '4px' }}>Ghi chú: {selectedOrder.deliveryAddress.note}</div>}
                </>
              )}
            </div>

            <h4 style={{ color: 'var(--text-gray)', marginBottom: '12px' }}>Các món đã chọn</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {selectedOrder.items.map(item => (
                <div key={item._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#F8F9FA', padding: '12px', borderRadius: '12px' }}>
                  <img src={item.imageUrl} alt={item.name} style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>{item.subtitle}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600 }}>{item.price.toLocaleString('vi-VN')} VNĐ</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>x {item.quantity}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-gray)' }}>Phương thức thanh toán:</span>
                <span style={{ fontWeight: 600 }}>{selectedOrder.paymentMethod}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-gray)' }}>Tổng cộng:</span>
                <span style={{ fontWeight: 800, fontSize: '18px', color: 'var(--primary)' }}>{selectedOrder.totalPayment.toLocaleString('vi-VN')} VNĐ</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
