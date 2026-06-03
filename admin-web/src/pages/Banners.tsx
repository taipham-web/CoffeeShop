import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Power } from 'lucide-react';
import api from '../api/axios';
import Modal from '../components/Modal';

interface Banner {
  _id: string;
  title: string;
  imageUrl: string;
  isActive: boolean;
}

export default function Banners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '', imageUrl: '', isActive: true
  });

  const fetchBanners = async () => {
    try {
      const res = await api.get('/banners/all');
      setBanners(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBanners();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/banners/${editingId}`, formData);
      } else {
        await api.post('/banners', formData);
      }
      setIsModalOpen(false);
      fetchBanners();
    } catch (err) {
      alert('Error saving banner');
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xoá khuyến mãi này?')) return;
    try {
      await api.delete(`/banners/${id}`);
      fetchBanners();
    } catch (err) {
      alert('Error deleting banner');
      console.error(err);
    }
  };

  const toggleActive = async (banner: Banner) => {
    try {
      await api.put(`/banners/${banner._id}`, { ...banner, isActive: !banner.isActive });
      fetchBanners();
    } catch (err) {
      alert('Error updating banner status');
      console.error(err);
    }
  };

  const openModal = (banner?: Banner) => {
    if (banner) {
      setEditingId(banner._id);
      setFormData({
        title: banner.title, imageUrl: banner.imageUrl, isActive: banner.isActive
      });
    } else {
      setEditingId(null);
      setFormData({ title: '', imageUrl: '', isActive: true });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800 }}>Khuyến mãi (Banners)</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={18} /> Thêm mới
        </button>
      </div>

      <div className="table-wrapper glass-panel">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>Đang tải...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: '120px' }}>Ảnh (Ngang)</th>
                <th>Tên chiến dịch</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {banners.map(b => (
                <tr key={b._id} style={{ opacity: b.isActive ? 1 : 0.5 }}>
                  <td>
                    <img src={b.imageUrl || 'https://via.placeholder.com/150x50'} alt={b.title} style={{ width: '100px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                  </td>
                  <td style={{ fontWeight: 600 }}>{b.title}</td>
                  <td>
                    <span style={{ 
                      background: b.isActive ? 'rgba(76, 175, 80, 0.1)' : 'rgba(117, 117, 117, 0.1)', 
                      color: b.isActive ? 'var(--success)' : 'var(--text-gray)', 
                      padding: '4px 10px', borderRadius: '99px', fontSize: '13px', fontWeight: 600 
                    }}>
                      {b.isActive ? 'Đang bật' : 'Đã tắt'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button onClick={() => toggleActive(b)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: b.isActive ? 'var(--text-gray)' : 'var(--success)', marginRight: '16px' }} title={b.isActive ? "Tắt hiển thị" : "Bật hiển thị"}>
                      <Power size={18} />
                    </button>
                    <button onClick={() => openModal(b)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', marginRight: '16px' }}>
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(b._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {banners.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '40px' }}>Chưa có banner khuyến mãi nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Sửa khuyến mãi' : 'Thêm khuyến mãi'}>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Tên khuyến mãi / Tiêu đề *</label>
            <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="VD: Mua 1 tặng 1" />
          </div>
          
          <div className="input-group">
            <label>Link Ảnh URL *</label>
            <input required value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} placeholder="https://..." />
            {formData.imageUrl && (
              <img src={formData.imageUrl} alt="Preview" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '12px', marginTop: '12px' }} />
            )}
          </div>
          <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} style={{ width: 'auto' }} />
            <label htmlFor="isActive" style={{ marginBottom: 0 }}>Hiển thị ngay trên App</label>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button type="button" className="btn btn-cancel" onClick={() => setIsModalOpen(false)}>Hủy</button>
            <button type="submit" className="btn btn-primary">Lưu</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
