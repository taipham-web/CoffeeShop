import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import api from '../api/axios';
import Modal from '../components/Modal';

interface Voucher {
  _id: string;
  code: string;
  discountType: 'percent' | 'fixed' | 'freeship';
  discountValue: number;
  minOrderValue: number;
  maxDiscount: number | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageLimit: number | null;
  usedCount: number;
}

export default function Vouchers() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'fixed',
    discountValue: '',
    minOrderValue: '',
    maxDiscount: '',
    startDate: '',
    endDate: '',
    isActive: true,
    usageLimit: ''
  });

  const fetchVouchers = async () => {
    try {
      const res = await api.get('/vouchers/all');
      setVouchers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const openAddModal = () => {
    setEditingVoucher(null);
    setFormData({
      code: '',
      discountType: 'fixed',
      discountValue: '',
      minOrderValue: '',
      maxDiscount: '',
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      isActive: true,
      usageLimit: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (voucher: Voucher) => {
    setEditingVoucher(voucher);
    setFormData({
      code: voucher.code,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue.toString(),
      minOrderValue: voucher.minOrderValue.toString(),
      maxDiscount: voucher.maxDiscount ? voucher.maxDiscount.toString() : '',
      startDate: new Date(voucher.startDate).toISOString().slice(0, 16),
      endDate: new Date(voucher.endDate).toISOString().slice(0, 16),
      isActive: voucher.isActive,
      usageLimit: voucher.usageLimit ? voucher.usageLimit.toString() : ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        discountValue: formData.discountType === 'freeship' ? 0 : Number(formData.discountValue),
        minOrderValue: Number(formData.minOrderValue),
        maxDiscount: formData.maxDiscount === '' ? null : Number(formData.maxDiscount),
        usageLimit: formData.usageLimit === '' ? null : Number(formData.usageLimit)
      };

      if (editingVoucher) {
        await api.put(`/vouchers/${editingVoucher._id}`, payload);
      } else {
        await api.post('/vouchers', payload);
      }
      setIsModalOpen(false);
      fetchVouchers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra');
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa mã giảm giá này?')) {
      try {
        await api.delete(`/vouchers/${id}`);
        fetchVouchers();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const toggleActive = async (voucher: Voucher) => {
    try {
      await api.put(`/vouchers/${voucher._id}`, { isActive: !voucher.isActive });
      fetchVouchers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800 }}>Quản lý Mã Giảm Giá</h1>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={20} />
          <span>Thêm Mã</span>
        </button>
      </div>

      <div className="table-wrapper glass-panel">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>Đang tải...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Mã</th>
                <th>Giảm giá</th>
                <th>Điều kiện</th>
                <th>Thời gian</th>
                <th>Lượt dùng</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map((voucher) => (
                <tr key={voucher._id}>
                  <td>
                    <div style={{ fontWeight: 800, color: 'var(--primary)', letterSpacing: '1px' }}>{voucher.code}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>
                      {voucher.discountType === 'freeship' ? (
                        'Miễn phí vận chuyển'
                      ) : voucher.discountType === 'percent' ? (
                        `${voucher.discountValue}%`
                      ) : (
                        `${voucher.discountValue.toLocaleString('vi-VN')}đ`
                      )}
                    </div>
                    {['percent', 'freeship'].includes(voucher.discountType) && voucher.maxDiscount && (
                      <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>Tối đa: {voucher.maxDiscount.toLocaleString('vi-VN')}đ</div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: '13px' }}>Đơn tối thiểu:</div>
                    <div style={{ fontWeight: 600 }}>{voucher.minOrderValue.toLocaleString('vi-VN')}đ</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '12px' }}>Từ: {new Date(voucher.startDate).toLocaleDateString('vi-VN')}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-gray)' }}>Đến: {new Date(voucher.endDate).toLocaleDateString('vi-VN')}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px' }}>{voucher.usedCount} / {voucher.usageLimit === null ? '∞' : voucher.usageLimit}</div>
                  </td>
                  <td>
                    <button 
                      onClick={() => toggleActive(voucher)}
                      style={{ 
                        background: voucher.isActive ? '#E8F5E9' : '#FFEBEE',
                        color: voucher.isActive ? '#2E7D32' : '#C62828',
                        border: 'none', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer'
                      }}
                    >
                      {voucher.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                    </button>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button onClick={() => openEditModal(voucher)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-gray)' }} title="Sửa">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(voucher._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }} title="Xóa">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {vouchers.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>Chưa có mã giảm giá nào</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingVoucher ? 'Sửa Mã Giảm Giá' : 'Thêm Mã Giảm Giá'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="input-group">
            <label>Mã Voucher (Ví dụ: SUMMER2024)</label>
            <input type="text" required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} />
          </div>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Loại giảm giá</label>
              <select value={formData.discountType} onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}>
                <option value="fixed">Số tiền cố định (VNĐ)</option>
                <option value="percent">Phần trăm (%)</option>
                <option value="freeship">Miễn phí vận chuyển</option>
              </select>
            </div>
            {formData.discountType !== 'freeship' && (
              <div className="input-group" style={{ flex: 1 }}>
                <label>Mức giảm</label>
                <input type="number" required min="0" placeholder="0" value={formData.discountValue} onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })} />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Đơn tối thiểu (VNĐ)</label>
              <input type="number" required min="0" placeholder="0" value={formData.minOrderValue} onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })} />
            </div>
            {['percent', 'freeship'].includes(formData.discountType) && (
              <div className="input-group" style={{ flex: 1 }}>
                <label>Giảm tối đa (VNĐ) - Tùy chọn</label>
                <input type="number" placeholder="Không giới hạn" min="0" value={formData.maxDiscount} onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })} />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Thời gian bắt đầu</label>
              <input type="datetime-local" required value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Thời gian kết thúc</label>
              <input type="datetime-local" required value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
            </div>
          </div>

          <div className="input-group">
            <label>Giới hạn lượt dùng (Tùy chọn)</label>
            <input type="number" placeholder="Không giới hạn" min="1" value={formData.usageLimit} onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })} />
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '20px' }}>
            <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} style={{ width: '18px', height: '18px' }} />
            <label htmlFor="isActive" style={{ margin: 0, fontWeight: 600, cursor: 'pointer' }}>Đang hoạt động</label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn" onClick={() => setIsModalOpen(false)}>Hủy</button>
            <button type="submit" className="btn btn-primary">{editingVoucher ? 'Cập nhật' : 'Thêm mới'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
