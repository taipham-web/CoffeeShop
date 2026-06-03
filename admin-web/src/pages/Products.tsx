import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import api from '../api/axios';
import Modal from '../components/Modal';

interface Product {
  _id: string;
  name: string;
  subtitle: string;
  category: string;
  price: number;
  imageUrl: string;
  description: string;
  sizes?: { name: string; price: number }[];
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '', subtitle: '', category: 'Cappuccino', 
    price: '', imageUrl: '', description: '',
    sizes: [] as { name: string; price: string }[]
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append('image', file);

    setUploadingImage(true);
    try {
      const res = await api.post('/upload/product', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setFormData({ ...formData, imageUrl: res.data.url });
      } else {
        alert(res.data.message || 'Lỗi upload ảnh');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi upload ảnh lên server');
    } finally {
      setUploadingImage(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        sizes: formData.sizes.map(s => ({ name: s.name, price: Number(s.price) }))
      };
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
      } else {
        await api.post('/products', payload);
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      alert('Error saving product');
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xoá sản phẩm này?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (err) {
      alert('Error deleting product');
      console.error(err);
    }
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingId(product._id);
      setFormData({
        name: product.name, subtitle: product.subtitle || '',
        category: product.category, price: String(product.price),
        imageUrl: product.imageUrl, description: product.description || '',
        sizes: product.sizes?.map(s => ({ name: s.name, price: String(s.price) })) || []
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', subtitle: '', category: 'Cappuccino', price: '', imageUrl: '', description: '', sizes: [] });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800 }}>Sản phẩm</h1>
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
                <th style={{ width: '80px' }}>Ảnh</th>
                <th>Tên sản phẩm</th>
                <th>Danh mục</th>
                <th>Giá</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p._id}>
                  <td>
                    <img src={p.imageUrl || 'https://via.placeholder.com/50'} alt={p.name} style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover' }} />
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-gray)' }}>{p.subtitle}</div>
                  </td>
                  <td>
                    <span style={{ background: 'var(--secondary)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '99px', fontSize: '13px', fontWeight: 600 }}>
                      {p.category}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{p.price.toLocaleString('vi-VN')} VNĐ</td>
                  <td style={{ textAlign: 'right' }}>
                    <button onClick={() => openModal(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', marginRight: '16px' }}>
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(p._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Tên sản phẩm *</label>
            <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="input-group">
            <label>Subtitle (Mô tả ngắn)</label>
            <input value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} />
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Giá mặc định (VNĐ) *</label>
              <input type="number" step="1" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Danh mục *</label>
              <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option value="Cappuccino">Cappuccino</option>
                <option value="Machiato">Machiato</option>
                <option value="Latte">Latte</option>
                <option value="Americano">Americano</option>
                <option value="Espresso">Espresso</option>
              </select>
            </div>
          </div>
          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ marginBottom: 0 }}>Cấu hình Size (Tùy chọn)</label>
              <button 
                type="button" 
                onClick={() => setFormData({ ...formData, sizes: [...formData.sizes, { name: 'M', price: formData.price }] })}
                style={{ fontSize: '13px', background: 'var(--secondary)', color: 'var(--primary)', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
              >
                + Thêm Size
              </button>
            </div>
            {formData.sizes.map((size, index) => (
              <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input 
                  placeholder="Tên Size (VD: S, M, L)" 
                  value={size.name} 
                  onChange={e => {
                    const newSizes = [...formData.sizes];
                    newSizes[index].name = e.target.value;
                    setFormData({ ...formData, sizes: newSizes });
                  }} 
                  style={{ flex: 1 }}
                  required
                />
                <input 
                  type="number" 
                  placeholder="Giá (VNĐ)" 
                  value={size.price} 
                  onChange={e => {
                    const newSizes = [...formData.sizes];
                    newSizes[index].price = e.target.value;
                    setFormData({ ...formData, sizes: newSizes });
                  }} 
                  style={{ flex: 1 }}
                  required
                />
                <button 
                  type="button" 
                  onClick={() => {
                    const newSizes = formData.sizes.filter((_, i) => i !== index);
                    setFormData({ ...formData, sizes: newSizes });
                  }}
                  style={{ background: 'var(--danger)', color: 'white', border: 'none', padding: '0 12px', borderRadius: '8px', cursor: 'pointer' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <div className="input-group">
            <label>Ảnh sản phẩm</label>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '8px' }}>
              <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
              {uploadingImage && <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600 }}>Đang tải lên...</span>}
            </div>
            <input value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} placeholder="Hoặc nhập link URL trực tiếp" />
            {formData.imageUrl && (
              <div style={{ marginTop: '12px' }}>
                <img src={formData.imageUrl} alt="preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
              </div>
            )}
          </div>
          <div className="input-group">
            <label>Mô tả chi tiết</label>
            <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
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
