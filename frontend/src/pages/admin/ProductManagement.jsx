import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X, Layers, Save } from 'lucide-react';
import api from '../../services/api';

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Product Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    variants: [
      { sku: '', price: 0, stockQuantity: 0, color: '', capacity: '', condition: 'Mới 100%', images: [] }
    ],
    specifications: []
  });

  // Variant Modal states
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [variantForm, setVariantForm] = useState({
    id: null, sku: '', price: 0, stockQuantity: 0, color: '', capacity: '', condition: 'Mới 100%', images: []
  });
  const [isEditingVariant, setIsEditingVariant] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/Product?page=1&pageSize=50');
      if (res.data && res.data.items) {
        setProducts(res.data.items);
      } else if (Array.isArray(res.data)) {
        setProducts(res.data);
      }
    } catch (err) {
      console.error('Lỗi khi tải sản phẩm:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/Category?page=1&pageSize=100');
      if (res.data && res.data.items) {
        setCategories(res.data.items);
      } else if (Array.isArray(res.data)) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh mục:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleOpenModal = async (productInfo = null) => {
    if (productInfo) {
      try {
        const res = await api.get(`/Product/${productInfo.id}`);
        const detail = res.data;
        setEditingId(detail.id);
        setFormData({
          name: detail.name,
          description: detail.description || '',
          categoryId: detail.categoryId || (categories[0]?.id || ''),
          variants: detail.variants && detail.variants.length > 0 ? detail.variants : [{ sku: `SKU-${Date.now()}`, price: 0, stockQuantity: 0, condition: 'Mới 100%' }], 
          specifications: detail.specifications || []
        });
      } catch (err) {
        console.error('Lỗi lấy chi tiết sản phẩm:', err);
        alert('Không thể tải thông tin sản phẩm.');
        return;
      }
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        description: '',
        categoryId: categories[0]?.id || '',
        variants: [
          { sku: '', price: 0, stockQuantity: 0, color: '', capacity: '', condition: 'Mới 100%', images: [] }
        ],
        specifications: []
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        specifications: formData.specifications.map(s => ({
          specName: s.key,
          specValue: s.value
        }))
      };

      if (editingId) {
        await api.put(`/Product/${editingId}`, payload);
        alert('Cập nhật sản phẩm thành công!');
      } else {
        await api.post('/Product', payload);
        alert('Thêm sản phẩm thành công!');
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      console.error('Lỗi khi lưu sản phẩm:', err);
      alert(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    try {
      await api.delete(`/Product/${id}`);
      fetchProducts();
      alert('Xóa sản phẩm thành công!');
    } catch (err) {
      console.error('Lỗi khi xóa:', err);
      alert('Không thể xóa sản phẩm này.');
    }
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...formData.variants];
    newVariants[index][field] = value;
    setFormData({ ...formData, variants: newVariants });
  };

  const handleFirstVariantImageUpload = async (e) => {
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

      const newVariants = [...formData.variants];
      const currentImages = newVariants[0].images || [];
      const updatedImages = [...currentImages, ...newImages];
      if (updatedImages.length > 0) updatedImages[0].isMain = true;
      
      newVariants[0].images = updatedImages;
      setFormData({ ...formData, variants: newVariants });
    } catch (err) {
      console.error('Lỗi upload ảnh:', err);
      alert('Không thể upload ảnh, vui lòng thử lại.');
    }
  };

  const removeFirstVariantImage = (indexToRemove) => {
    const newVariants = [...formData.variants];
    const updatedImages = newVariants[0].images.filter((_, i) => i !== indexToRemove);
    if (updatedImages.length > 0) updatedImages[0].isMain = true;
    newVariants[0].images = updatedImages;
    setFormData({ ...formData, variants: newVariants });
  };

  const handleSpecChange = (index, field, value) => {
    const newSpecs = [...formData.specifications];
    newSpecs[index][field] = value;
    setFormData({ ...formData, specifications: newSpecs });
  };

  const addSpec = () => {
    setFormData({
      ...formData,
      specifications: [...formData.specifications, { key: '', value: '' }]
    });
  };

  const removeSpec = (index) => {
    const newSpecs = [...formData.specifications];
    newSpecs.splice(index, 1);
    setFormData({ ...formData, specifications: newSpecs });
  };

  // --- Variant CRUD Methods ---

  const openVariantModal = async (productId) => {
    try {
      const res = await api.get(`/Product/${productId}`);
      setSelectedProduct(res.data);
      setShowVariantModal(true);
      resetVariantForm();
    } catch (err) {
      console.error('Lỗi lấy chi tiết sản phẩm:', err);
      alert('Không thể tải chi tiết sản phẩm để quản lý biến thể.');
    }
  };

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
      fetchProducts();
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
        const { id, ...createForm } = variantForm;
        await api.post(`/Product/${selectedProduct.id}/variants`, createForm);
        alert('Thêm biến thể thành công!');
      }
      // Refresh variant list
      openVariantModal(selectedProduct.id);
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
      openVariantModal(selectedProduct.id);
    } catch (err) {
      console.error('Lỗi khi xóa biến thể:', err);
      alert('Không thể xóa biến thể này.');
    }
  };

  return (
    <div>
      <div className="admin-header">
        <h1 className="admin-title">Quản lý Sản phẩm</h1>
        <button className="btn-primary" onClick={() => handleOpenModal()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={20} />
          Thêm sản phẩm
        </button>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-search-box">
            <Search className="admin-search-icon" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              className="admin-search-input"
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div className="loader inline-block" style={{
              border: '3px solid var(--background)',
              borderTop: '3px solid var(--primary)',
              borderRadius: '50%', width: '30px', height: '30px', animation: 'spin 1s linear infinite'
            }}></div>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Hình ảnh</th>
                  <th>Tên sản phẩm</th>
                  <th>Danh mục</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Không có sản phẩm nào.</td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <img
                          src={product.thumbnailUrl || 'https://via.placeholder.com/40'}
                          alt={product.name}
                          className="admin-thumbnail"
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/40' }}
                        />
                      </td>
                      <td><strong>{product.name}</strong></td>
                      <td style={{ color: 'var(--text-muted)' }}>{product.categoryName || 'N/A'}</td>
                      <td>
                        <div className="admin-actions">
                          <button className="action-btn view" onClick={() => openVariantModal(product.id)} title="Quản lý biến thể">
                            <Layers size={18} />
                          </button>
                          <button className="action-btn edit" onClick={() => handleOpenModal(product)} title="Sửa sản phẩm">
                            <Edit size={18} />
                          </button>
                          <button className="action-btn delete" onClick={() => handleDelete(product.id)} title="Xóa sản phẩm">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Modal (Base Info) */}
      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content large">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">{editingId ? 'Cập nhật Thông tin Sản phẩm' : 'Thêm Sản phẩm mới'}</h2>
              <button onClick={() => setShowModal(false)} className="admin-modal-close">
                <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>&times;</span>
              </button>
            </div>

            <div className="admin-modal-body">
              <form id="productForm" onSubmit={handleSubmit}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Tên sản phẩm *</label>
                  <input
                    type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="admin-form-input"
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Mô tả</label>
                  <textarea
                    value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="admin-form-textarea"
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Danh mục *</label>
                  <select
                    required value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: parseInt(e.target.value) })}
                    className="admin-form-select"
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {!editingId && (
                  <div className="admin-variant-box">
                    <h3 className="admin-variant-title">Biến thể đầu tiên (Bắt buộc)</h3>
                    <div className="admin-form-row">
                      <div className="admin-form-group">
                        <label className="admin-form-label">SKU *</label>
                        <input type="text" required value={formData.variants[0].sku} onChange={e => handleVariantChange(0, 'sku', e.target.value)} className="admin-form-input" />
                      </div>
                      <div className="admin-form-group">
                        <label className="admin-form-label">Giá (VNĐ) *</label>
                        <input type="number" required min="0" value={formData.variants[0].price} onChange={e => handleVariantChange(0, 'price', parseFloat(e.target.value))} className="admin-form-input" />
                      </div>
                      <div className="admin-form-group">
                        <label className="admin-form-label">Kho *</label>
                        <input type="number" required min="0" value={formData.variants[0].stockQuantity} onChange={e => handleVariantChange(0, 'stockQuantity', parseInt(e.target.value))} className="admin-form-input" />
                      </div>
                      <div className="admin-form-group">
                        <label className="admin-form-label">Màu sắc</label>
                        <input type="text" value={formData.variants[0].color} onChange={e => handleVariantChange(0, 'color', e.target.value)} className="admin-form-input" />
                      </div>
                      <div className="admin-form-group">
                        <label className="admin-form-label">Dung lượng</label>
                        <input type="text" value={formData.variants[0].capacity} onChange={e => handleVariantChange(0, 'capacity', e.target.value)} className="admin-form-input" />
                      </div>
                      <div className="admin-form-group">
                        <label className="admin-form-label">Tình trạng *</label>
                        <input type="text" required value={formData.variants[0].condition} onChange={e => handleVariantChange(0, 'condition', e.target.value)} className="admin-form-input" />
                      </div>
                      <div className="admin-form-group full" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
                        <div style={{ flex: 1 }}>
                          <label className="admin-form-label">Hình ảnh biến thể</label>
                          <input type="file" multiple accept="image/*" onChange={handleFirstVariantImageUpload} className="admin-form-input" style={{ padding: '0.4rem' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {formData.variants[0].images && formData.variants[0].images.map((img, idx) => (
                            <div key={idx} style={{ position: 'relative' }}>
                              <img src={img.imageUrl} alt="preview" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border)' }} />
                              <button type="button" onClick={() => removeFirstVariantImage(idx)} style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', fontSize: '10px' }}>&times;</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="admin-variant-box" style={{ marginTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 className="admin-variant-title" style={{ margin: 0 }}>Thông số kỹ thuật</h3>
                    <button type="button" onClick={addSpec} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                      <Plus size={14} /> Thêm thông số
                    </button>
                  </div>
                  {formData.specifications.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Chưa có thông số kỹ thuật nào.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {formData.specifications.map((spec, index) => (
                        <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <input type="text" placeholder="Tên (VD: Màn hình)" value={spec.key} onChange={e => handleSpecChange(index, 'key', e.target.value)} className="admin-form-input" style={{ flex: 1 }} required />
                          <input type="text" placeholder="Giá trị (VD: 6.1 inch)" value={spec.value} onChange={e => handleSpecChange(index, 'value', e.target.value)} className="admin-form-input" style={{ flex: 2 }} required />
                          <button type="button" onClick={() => removeSpec(index)} className="action-btn delete" style={{ padding: '0.4rem' }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </form>
            </div>

            <div className="admin-modal-footer">
              <button type="button" onClick={() => setShowModal(false)} className="btn-outline">Hủy</button>
              <button type="submit" form="productForm" className="btn-primary">{editingId ? 'Cập nhật Thông tin' : 'Thêm Sản phẩm'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Variant Management Modal */}
      {showVariantModal && selectedProduct && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content xl">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                Quản lý Biến thể: <span style={{ color: 'var(--primary)' }}>{selectedProduct.name}</span>
              </h2>
              <button onClick={() => setShowVariantModal(false)} className="admin-modal-close">
                <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>&times;</span>
              </button>
            </div>

            <div className="admin-modal-body">

              {/* Variant Form */}
              <div className="admin-variant-box" style={{ marginBottom: '2rem' }}>
                <h3 className="admin-variant-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {isEditingVariant ? <Edit size={16} /> : <Plus size={16} />}
                  {isEditingVariant ? 'Cập nhật biến thể' : 'Thêm biến thể mới'}
                </h3>
                <form onSubmit={handleSaveVariant} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                  <div>
                    <label className="admin-form-label" style={{ fontSize: '0.75rem' }}>SKU *</label>
                    <input type="text" required value={variantForm.sku} onChange={e => setVariantForm({ ...variantForm, sku: e.target.value })} className="admin-form-input" style={{ padding: '0.5rem' }} />
                  </div>
                  <div>
                    <label className="admin-form-label" style={{ fontSize: '0.75rem' }}>Giá (VNĐ) *</label>
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
                  <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.5rem' }}>
                    <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.25rem' }}>
                      <Save size={16} /> {isEditingVariant ? 'Lưu' : 'Thêm'}
                    </button>
                    {isEditingVariant && (
                      <button type="button" onClick={resetVariantForm} className="btn-outline" style={{ padding: '0.5rem 1rem' }}>
                        Hủy
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Variant List */}
              <div>
                <h3 className="admin-variant-title">Danh sách Biến thể hiện tại</h3>
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
                          <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có biến thể nào.</td>
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
                            <td style={{ color: 'var(--primary)', fontWeight: '600' }}>{new Intl.NumberFormat('vi-VN').format(v.price)} VNĐ</td>
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

              {/* Product Specifications inside Variant Modal */}
              <div style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 className="admin-variant-title" style={{ margin: 0 }}>Thông số kỹ thuật của sản phẩm</h3>
                  <button type="button" onClick={addVariantSpec} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                    <Plus size={14} /> Thêm thông số
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
                <div style={{ textAlign: 'right' }}>
                  <button type="button" onClick={handleSaveVariantSpecs} className="btn-primary" style={{ padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Save size={16} /> Lưu thông số
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
