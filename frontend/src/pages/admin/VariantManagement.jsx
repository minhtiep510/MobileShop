import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Save, ArrowLeft, Layers } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/Toast';
import { useConfirm } from '../../components/ConfirmDialog';
import '../../styles/VariantManagement.css';

export default function VariantManagement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const [variantForm, setVariantForm] = useState({
    id: null, sku: '', price: 0, stockQuantity: 0, color: '', size: '', condition: 'Mới 100%', images: []
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
      toast.error('Không thể tải thông tin sản phẩm.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const resetVariantForm = () => {
    setVariantForm({ id: null, sku: `SKU-${Date.now()}`, price: 0, stockQuantity: 0, color: '', size: '', condition: 'Mới 100%', images: [] });
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
      toast.error('Không thể upload ảnh, vui lòng thử lại.');
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
      toast.success('Cập nhật thông số kỹ thuật thành công!');
      fetchProduct();
    } catch (err) {
      console.error('Lỗi khi lưu thông số:', err);
      toast.error('Không thể lưu thông số kỹ thuật.');
    }
  };

  const handleEditVariantClick = (variant) => {
    setVariantForm({ ...variant });
    setIsEditingVariant(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveVariant = async (e) => {
    e.preventDefault();
    try {
      if (isEditingVariant) {
        await api.put(`/Product/variant/${variantForm.id}`, variantForm);
        toast.success('Cập nhật giá và biến thể thành công!');
      } else {
        const { id: _id, ...createForm } = variantForm;
        await api.post(`/Product/${selectedProduct.id}/variants`, createForm);
        toast.success('Thêm biến thể thành công!');
      }
      fetchProduct();
    } catch (err) {
      console.error('Lỗi khi lưu biến thể:', err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu biến thể.');
    }
  };

  const handleDeleteVariant = async (variantId) => {
    const ok = await confirm({
      title: 'Xóa biến thể',
      message: 'Bạn có chắc muốn xóa biến thể này?',
      confirmLabel: 'Xóa',
      confirmType: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/Product/variant/${variantId}`);
      toast.success('Xóa biến thể thành công!');
      fetchProduct();
    } catch (err) {
      console.error('Lỗi khi xóa biến thể:', err);
      toast.error('Không thể xóa biến thể này.');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <div className="loader inline-block" style={{
          border: '3px solid var(--background)',
          borderTop: '3px solid var(--primary)',
          borderRadius: '50%', width: '36px', height: '36px', animation: 'spin 1s linear infinite', margin: '0 auto'
        }}></div>
      </div>
    );
  }

  if (!selectedProduct) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Không tìm thấy thông tin sản phẩm.
      </div>
    );
  }

  return (
    <div className="variant-mgmt-container">
      {/* Header */}
      <div className="variant-mgmt-header">
        <button
          onClick={() => navigate('/admin/products')}
          className="variant-back-btn"
          title="Quay lại danh sách sản phẩm"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="variant-header-title">Quản lý Biến thể & Giá bán</h1>
          <p className="variant-header-subtitle">
            Sản phẩm: <strong>{selectedProduct.name}</strong>
          </p>
        </div>
      </div>

      <div className="variant-card">
        {/* Variant Form */}
        <div className={`variant-form-box ${isEditingVariant ? 'editing' : ''}`}>
          <h3 className="variant-box-title">
            {isEditingVariant ? <Edit size={18} color="#0071e3" /> : <Plus size={18} color="#0071e3" />}
            {isEditingVariant ? `Đang chỉnh sửa biến thể (${variantForm.sku})` : 'Thêm biến thể mới'}
          </h3>
          
          <form onSubmit={handleSaveVariant} className="variant-form-grid">
            <div className="variant-form-group">
              <label className="variant-label">Mã SKU *</label>
              <input 
                type="text" 
                required 
                value={variantForm.sku} 
                onChange={e => setVariantForm({ ...variantForm, sku: e.target.value })} 
                className="variant-input" 
              />
            </div>
            
            <div className="variant-form-group">
              <label className="variant-label">Giá bán (VNĐ) *</label>
              <input 
                type="number" 
                required 
                min="0" 
                step="1000"
                value={variantForm.price} 
                onChange={e => setVariantForm({ ...variantForm, price: parseFloat(e.target.value) || 0 })} 
                className="variant-input" 
                placeholder="Nhập giá bán..."
              />
            </div>

            <div className="variant-form-group">
              <label className="variant-label">Số lượng tồn kho *</label>
              <input 
                type="number" 
                required 
                min="0" 
                value={variantForm.stockQuantity} 
                onChange={e => setVariantForm({ ...variantForm, stockQuantity: parseInt(e.target.value) || 0 })} 
                className="variant-input" 
              />
            </div>

            <div className="variant-form-group">
              <label className="variant-label">Màu sắc</label>
              <input 
                type="text" 
                placeholder="VD: Titan Tự Nhiên, Đen, Xanh..."
                value={variantForm.color} 
                onChange={e => setVariantForm({ ...variantForm, color: e.target.value })} 
                className="variant-input" 
              />
            </div>

            <div className="variant-form-group">
              <label className="variant-label">Dung lượng / Kích thước</label>
              <input 
                type="text" 
                placeholder="VD: 128GB, 256GB, 512GB..."
                value={variantForm.size} 
                onChange={e => setVariantForm({ ...variantForm, size: e.target.value })} 
                className="variant-input" 
              />
            </div>

            <div className="variant-form-group">
              <label className="variant-label">Tình trạng máy *</label>
              <input 
                type="text" 
                required 
                placeholder="VD: Mới 100%, 99%..."
                value={variantForm.condition} 
                onChange={e => setVariantForm({ ...variantForm, condition: e.target.value })} 
                className="variant-input" 
              />
            </div>

            <div className="variant-form-group full-width">
              <label className="variant-label">Hình ảnh biến thể</label>
              <div className="variant-image-upload-wrapper">
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={handleVariantImageUpload} 
                  style={{ fontSize: '0.85rem' }} 
                />
                <div className="variant-image-preview-list">
                  {variantForm.images && variantForm.images.map((img, idx) => (
                    <div key={idx} className="variant-img-item">
                      <img src={img.imageUrl} alt="preview" />
                      <button 
                        type="button" 
                        onClick={() => removeVariantImage(idx)} 
                        className="variant-img-remove-btn"
                        title="Xóa ảnh"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="variant-form-actions">
              {isEditingVariant && (
                <button type="button" onClick={resetVariantForm} className="btn-cancel-edit">
                  Hủy chỉnh sửa
                </button>
              )}
              <button type="submit" className="btn-save-variant">
                <Save size={18} /> {isEditingVariant ? 'Lưu Cập Nhật Giá' : 'Thêm Biến Thể Mới'}
              </button>
            </div>
          </form>
        </div>

        {/* Danh sách biến thể */}
        <div style={{ marginTop: '2.5rem' }}>
          <h3 className="variant-section-title">Danh sách Biến thể & Bảng Giá ({selectedProduct.variants?.length || 0})</h3>
          
          <div className="variant-table-box">
            <table className="variant-table">
              <thead>
                <tr>
                  <th>Ảnh</th>
                  <th>SKU</th>
                  <th>Màu sắc</th>
                  <th>Phiên bản / Bộ nhớ</th>
                  <th>Tình trạng</th>
                  <th>Giá bán</th>
                  <th style={{ textAlign: 'center' }}>Tồn kho</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {(!selectedProduct.variants || selectedProduct.variants.length === 0) ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#86868b' }}>Chưa có biến thể nào.</td>
                  </tr>
                ) : (
                  selectedProduct.variants.map((v) => (
                    <tr key={v.id} className={isEditingVariant && variantForm.id === v.id ? 'editing-row' : ''}>
                      <td>
                        <img 
                          src={v.images && v.images.length > 0 ? v.images[0].imageUrl : 'https://via.placeholder.com/44'} 
                          alt="variant" 
                          className="variant-thumb"
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/44' }} 
                        />
                      </td>
                      <td><strong>{v.sku}</strong></td>
                      <td>{v.color || '-'}</td>
                      <td><strong>{v.size || '-'}</strong></td>
                      <td>{v.condition || 'Mới 100%'}</td>
                      <td>
                        <span className="variant-price-tag">
                          {new Intl.NumberFormat('vi-VN').format(v.price)} đ
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`stock-pill ${v.stockQuantity > 0 ? 'in-stock' : 'out-stock'}`}>
                          {v.stockQuantity > 0 ? `Còn ${v.stockQuantity}` : 'Hết hàng'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            className="action-btn edit" 
                            onClick={() => handleEditVariantClick(v)} 
                            title="Sửa giá & thông tin"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            className="action-btn delete" 
                            onClick={() => handleDeleteVariant(v.id)} 
                            title="Xóa biến thể"
                          >
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

        {/* Thông số kỹ thuật */}
        <div className="variant-specs-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 className="variant-section-title" style={{ margin: 0 }}>Thông số kỹ thuật sản phẩm</h3>
            <button 
              type="button" 
              onClick={addVariantSpec} 
              className="btn-outline" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              <Plus size={16} /> Thêm thông số
            </button>
          </div>

          {(!selectedProduct.specifications || selectedProduct.specifications.length === 0) ? (
            <p style={{ fontSize: '0.9rem', color: '#86868b', margin: '0 0 1rem 0' }}>Chưa có thông số kỹ thuật nào.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.25rem' }}>
              {selectedProduct.specifications.map((spec, index) => (
                <div key={index} className="spec-row">
                  <input 
                    type="text" 
                    placeholder="Tên (VD: Màn hình, Chip, RAM...)" 
                    value={spec.key} 
                    onChange={e => handleVariantSpecChange(index, 'key', e.target.value)} 
                    className="variant-input" 
                    style={{ flex: 1 }} 
                    required 
                  />
                  <input 
                    type="text" 
                    placeholder="Giá trị (VD: OLED 6.7 inch, Apple A17 Pro...)" 
                    value={spec.value} 
                    onChange={e => handleVariantSpecChange(index, 'value', e.target.value)} 
                    className="variant-input" 
                    style={{ flex: 2 }} 
                    required 
                  />
                  <button 
                    type="button" 
                    onClick={() => removeVariantSpec(index)} 
                    className="action-btn delete" 
                    style={{ padding: '0.55rem' }}
                    title="Xóa thông số"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ textAlign: 'right', marginTop: '1.5rem' }}>
            <button 
              type="button" 
              onClick={handleSaveVariantSpecs} 
              className="btn-primary" 
              style={{ padding: '0.65rem 2rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Save size={18} /> Lưu Thông Số Kỹ Thuật
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
