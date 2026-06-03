import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Power } from 'lucide-react';
import api from '../api/axios';
import Modal from '../components/Modal';

interface Branch {
  _id: string;
  name: string;
  address: string;
  phone: string;
  isActive: boolean;
}

export default function Branches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '', address: '', phone: '', isActive: true
  });

  const fetchBranches = async () => {
    try {
      const res = await api.get('/branches/all');
      setBranches(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBranches();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/branches/${editingId}`, formData);
      } else {
        await api.post('/branches', formData);
      }
      setIsModalOpen(false);
      fetchBranches();
    } catch (err) {
      alert('Error saving branch');
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xoá chi nhánh này?')) return;
    try {
      await api.delete(`/branches/${id}`);
      fetchBranches();
    } catch (err) {
      alert('Error deleting branch');
      console.error(err);
    }
  };

  const toggleActive = async (branch: Branch) => {
    try {
      await api.put(`/branches/${branch._id}`, { ...branch, isActive: !branch.isActive });
      fetchBranches();
    } catch (err) {
      alert('Error updating branch status');
      console.error(err);
    }
  };

  const openModal = (branch?: Branch) => {
    if (branch) {
      setEditingId(branch._id);
      setFormData({
        name: branch.name, address: branch.address, phone: branch.phone, isActive: branch.isActive
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', address: '', phone: '', isActive: true });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800 }}>Chi nhánh (Branches)</h1>
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
                <th>Tên chi nhánh</th>
                <th>Địa chỉ</th>
                <th>Số ĐT</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {branches.map(b => (
                <tr key={b._id} style={{ opacity: b.isActive ? 1 : 0.5 }}>
                  <td style={{ fontWeight: 600 }}>{b.name}</td>
                  <td>{b.address}</td>
                  <td>{b.phone || '-'}</td>
                  <td>
                    <span style={{ 
                      background: b.isActive ? 'rgba(76, 175, 80, 0.1)' : 'rgba(117, 117, 117, 0.1)', 
                      color: b.isActive ? 'var(--success)' : 'var(--text-gray)', 
                      padding: '4px 10px', borderRadius: '99px', fontSize: '13px', fontWeight: 600 
                    }}>
                      {b.isActive ? 'Hoạt động' : 'Đã đóng cửa'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button onClick={() => toggleActive(b)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: b.isActive ? 'var(--text-gray)' : 'var(--success)', marginRight: '16px' }} title={b.isActive ? "Đóng cửa" : "Mở lại"}>
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
              {branches.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>Chưa có chi nhánh nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Sửa chi nhánh' : 'Thêm chi nhánh'}>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Tên chi nhánh *</label>
            <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="VD: Chi nhánh Quận 1" />
          </div>
          
          <div className="input-group">
            <label>Địa chỉ *</label>
            <input required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="VD: 123 Đường XYZ, TP. HCM" />
          </div>

          <div className="input-group">
            <label>Số điện thoại</label>
            <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="VD: 0901234567" />
          </div>

          <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} style={{ width: 'auto' }} />
            <label htmlFor="isActive" style={{ marginBottom: 0 }}>Đang hoạt động</label>
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
