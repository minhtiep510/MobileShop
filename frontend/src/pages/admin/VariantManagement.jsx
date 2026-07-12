import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Save, ArrowLeft } from 'lucide-react';
import api from '../../services/api';

export default function VariantManagement() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const [variantForm, setVariantForm] = useState({
    id: null, sku: '', price: 0, stockQuantity: 0, color: '', capacity: '', condition: 'Mới 100%', images: []
  });
  const [isEditingVariant, setIsEditingVariant] = useState(false);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/Product/${id}`);
      setSelectedProduct(res.data);
      resetVariantForm();
    } catch (err) {
      console.error('Lỗi lấy chi tiết sản phẩm:', err);
      alert('Không thể tải thông tin sản phẩm.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const resetVariantForm = () => {
    setVariantForm({ id: null, sku: `SKU-${Date.now()}`, price: 0, stockQuantity: 0, color: '', capacity: '', condition: 'Mới 100%', images: [] });
    setIsEditingVariant(false);
  };

  const handleVariantImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    try {
      const uploadPromises = files.map(file => {
        const uploadData = new FormData();
        uploadData.append('file', file);
        return api.post('/Upload', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      });

      const responses = await Promise.all(uploadPromises);
      const newImages = responses
        .filter(res => res.data && res.data.url)
        .map(res => ({ imageUrl: res.data.url, isMain: false }));

      const currentImages = variantForm.images || [];
      const updatedImages = [...currentImages, ...newImages];
      if (updatedImages.length > 0) updatedImages[0].isMain = true;

      setVariantForm({
        ...variantForm,
        images: updatedImages
      });
    } catch (err) {
      console.error('Lỗi upload ảnh:', err);
      alert('Không thể upload ảnh, vui lòng thử lại.');
    }
  };

  const removeVariantImage = (indexToRemove) => {
    const updatedImages = variantForm.images.filter((_, i) => i !== indexToRemove);
    if (updatedImages.length > 0) updatedImages[0].isMain = true;
    setVariantForm({
      ...variantForm,
      images: updatedImages
    });
  };

  const handleVariantSpecChange = (index, field, value) => {
    const newSpecs = [...(selectedProduct.specifications || [])];
    newSpecs[index][field] = value;
    setSelectedProduct({ ...selectedProduct, specifications: newSpecs });
  };

  const addVariantSpec = () => {
    setSelectedProduct({
      ...selectedProduct,
      specifications: [...(selectedProduct.specifications || []), { key: '', value: '' }]
    });
  };

  const removeVariantSpec = (index) => {
    const newSpecs = [...(selectedProduct.specifications || [])];
    newSpecs.splice(index, 1);
    setSelectedProduct({ ...selectedProduct, specifications: newSpecs });
  };

  const handleSaveVariantSpecs = async () => {
    try {
      const payload = {
        name: selectedProduct.name,
        description: selectedProduct.description || '',
        categoryId: selectedProduct.categoryId,
        variants: selectedProduct.variants && selectedProduct.variants.length > 0
          ? selectedProduct.variants
          : [{ sku: `SKU-${Date.now()}`, price: 0, stockQuantity: 0, condition: 'Mới 100%' }],
        specifications: (selectedProduct.specifications || []).map(s => ({
          specName: s.key,
          specValue: s.value
        }))
      };
      await api.put(`/Product/${selectedProduct.id}`, payload);
      alert('Cập nhật thông số kỹ thuật thành công!');
      fetchProduct();
    } catch (err) {
      console.error('Lỗi khi lưu thông số:', err);
      alert('Không thể lưu thông số kỹ thuật.');
    }
  };

  const handleEditVariantClick = (variant) => {
    setVariantForm({ ...variant });
    setIsEditingVariant(true);
  };

  const handleSaveVariant = async (e) => {
    e.preventDefault();
    try {
      if (isEditingVariant) {
        await api.put(`/Product/variant/${variantForm.id}`, variantForm);
        alert('Cập nhật biến thể thành công!');
      } else {
        const { id: _id, ...createForm } = variantForm;
        await api.post(`/Product/${selectedProduct.id}/variants`, createForm);
        alert('Thêm biến thể thành công!');
      }
      fetchProduct();
    } catch (err) {
      console.error('Lỗi khi lưu biến thể:', err);
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi lưu biến thể.');
    }
  };

  const handleDeleteVariant = async (variantId) => {
    if (!window.confirm('Bạn có chắc muốn xóa biến thể này?')) return;
    try {
      await api.delete(`/Product/variant/${variantId}`);
      alert('Xóa biến thể thành công!');
      fetchProduct();
    } catch (err) {
      console.error('Lỗi khi xóa biến thể:', err);
      alert('Không thể xóa biến thể này.');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="loader inline-block" style={{
          border: '3px solid var(--background)',
          borderTop: '3px solid var(--primary)',
          borderRadius: '50%', width: '30px', height: '30px', animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  if (!selectedProduct) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Không tìm thấy sản phẩm.
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '2rem' }}>
      <div className="admin-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button
          onClick={() => navigate('/admin/products')}
          className="btn-outline"
          style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Quay lại danh sách sản phẩm"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="admin-title" style={{ marginBottom: 0 }}>
            Quản lý Biến thể
          </h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Sản phẩm: <strong style={{ color: 'var(--primary)' }}>{selectedProduct.name}</strong>
          </p>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-body">
          {/* Variant Form */}
          <div className="admin-variant-box" style={{ marginBottom: '2rem' }}>
            <h3 className="admin-variant-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isEditingVariant ? <Edit size={16} /> : <Plus size={16} />}
              {isEditingVariant ? 'Cập nhật biến thể' : 'Thêm biến thể mới'}
            </h3>
            <form onSubmit={handleSaveVariant} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
              <div>
                <label className="admin-form-label" style={{ fontSize: '0.75rem' }}>SKU *</label>
                <input type="text" required value={variantForm.sku} onChange={e => setVariantForm({ ...variantForm, sku: e.target.value })} className="admin-form-input" style={{ padding: '0.5rem' }} />
              </div>
              <div>
                <label className="admin-form-label" style={{ fontSize: '0.75rem' }}>Giá (đ) *</label>
                <input type="number" required min="0" value={variantForm.price} onChange={e => setVariantForm({ ...variantForm, price: parseFloat(e.target.value) })} className="admin-form-input" style={{ padding: '0.5rem' }} />
              </div>
              <div>
                <label className="admin-form-label" style={{ fontSize: '0.75rem' }}>Kho *</label>
                <input type="number" required min="0" value={variantForm.stockQuantity} onChange={e => setVariantForm({ ...variantForm, stockQuantity: parseInt(e.target.value) })} className="admin-form-input" style={{ padding: '0.5rem' }} />
              </div>
              <div>
                <label className="admin-form-label" style={{ fontSize: '0.75rem' }}>Màu sắc</label>
                <input type="text" value={variantForm.color} onChange={e => setVariantForm({ ...variantForm, color: e.target.value })} className="admin-form-input" style={{ padding: '0.5rem' }} />
              </div>
              <div>
                <label className="admin-form-label" style={{ fontSize: '0.75rem' }}>Dung lượng</label>
                <input type="text" value={variantForm.capacity} onChange={e => setVariantForm({ ...variantForm, capacity: e.target.value })} className="admin-form-input" style={{ padding: '0.5rem' }} />
              </div>
              <div>
                <label className="admin-form-label" style={{ fontSize: '0.75rem' }}>Tình trạng *</label>
                <input type="text" required value={variantForm.condition} onChange={e => setVariantForm({ ...variantForm, condition: e.target.value })} className="admin-form-input" style={{ padding: '0.5rem' }} />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <label className="admin-form-label" style={{ fontSize: '0.75rem' }}>Hình ảnh biến thể</label>
                  <input type="file" multiple accept="image/*" onChange={handleVariantImageUpload} className="admin-form-input" style={{ padding: '0.4rem' }} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  {variantForm.images && variantForm.images.map((img, idx) => (
                    <div key={idx} style={{ position: 'relative' }}>
                      <img src={img.imageUrl} alt="preview" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border)' }} />
                      <button type="button" onClick={() => removeVariantImage(idx)} style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', fontSize: '10px' }}>&times;</button>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                {isEditingVariant && (
                  <button type="button" onClick={resetVariantForm} className="btn-outline" style={{ padding: '0.6rem 1.5rem' }}>
                    Hủy sửa
                  </button>
                )}
                <button type="submit" className="btn-primary" style={{ padding: '0.6rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Save size={18} /> {isEditingVariant ? 'Lưu cập nhật' : 'Thêm biến thể'}
                </button>
              </div>
            </form>
          </div>

          <div style={{ marginTop: '3rem' }}>
            <h3 className="admin-variant-title" style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Danh sách Biến thể hiện tại</h3>
            <div className="admin-table-container" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ảnh</th>
                    <th>SKU</th>
                    <th>Màu sắc</th>
                    <th>Dung lượng</th>
                    <th>Tình trạng</th>
                    <th>Giá</th>
                    <th style={{ textAlign: 'center' }}>Kho</th>
                    <th style={{ textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {(!selectedProduct.variants || selectedProduct.variants.length === 0) ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có biến thể nào.</td>
                    </tr>
                  ) : (
                    selectedProduct.variants.map((v) => (
                      <tr key={v.id} style={{ backgroundColor: isEditingVariant && variantForm.id === v.id ? 'var(--primary-light)' : 'transparent' }}>
                        <td>
                          <img src={v.images && v.images.length > 0 ? v.images[0].imageUrl : 'https://via.placeholder.com/30'} alt="variant" style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '4px' }} onError={(e) => { e.target.src = 'https://via.placeholder.com/30' }} />
                        </td>
                        <td><strong>{v.sku}</strong></td>
                        <td>{v.color || '-'}</td>
                        <td>{v.capacity || '-'}</td>
                        <td>{v.condition || 'Mới 100%'}</td>
                        <td style={{ color: 'var(--primary)', fontWeight: '600' }}>{new Intl.NumberFormat('vi-VN').format(v.price)} đ</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`admin-badge badge-${v.stockQuantity > 0 ? 'green' : 'red'}`}>
                            {v.stockQuantity}
                          </span>
                        </td>
                        <td>
                          <div className="admin-actions">
                            <button className="action-btn edit" onClick={() => handleEditVariantClick(v)} title="Sửa biến thể">
                              <Edit size={16} />
                            </button>
                            <button className="action-btn delete" onClick={() => handleDeleteVariant(v.id)} title="Xóa biến thể">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 className="admin-variant-title" style={{ margin: 0, fontSize: '1.25rem' }}>Thông số kỹ thuật của sản phẩm</h3>
              <button type="button" onClick={addVariantSpec} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                <Plus size={16} /> Thêm thông số
              </button>
            </div>
            {(!selectedProduct.specifications || selectedProduct.specifications.length === 0) ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, marginBottom: '1rem' }}>Chưa có thông số kỹ thuật nào.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                {selectedProduct.specifications.map((spec, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input type="text" placeholder="Tên (VD: Màn hình)" value={spec.key} onChange={e => handleVariantSpecChange(index, 'key', e.target.value)} className="admin-form-input" style={{ flex: 1 }} required />
                    <input type="text" placeholder="Giá trị (VD: 6.1 inch)" value={spec.value} onChange={e => handleVariantSpecChange(index, 'value', e.target.value)} className="admin-form-input" style={{ flex: 2 }} required />
                    <button type="button" onClick={() => removeVariantSpec(index)} className="action-btn delete" style={{ padding: '0.4rem' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ textAlign: 'right', marginTop: '1.5rem' }}>
              <button type="button" onClick={handleSaveVariantSpecs} className="btn-primary" style={{ padding: '0.6rem 2rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={18} /> Lưu thông số
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
