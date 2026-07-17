import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/BannerSlider.css';

export default function BannerSlider({ mode = 'slider' }) {
  const [banners, setBanners] = useState([]);
  const [current, setCurrent] = useState(0);
  // 3 index độc lập cho 3 ô trong grid mode
  const [idx0, setIdx0] = useState(0);
  const [idx1, setIdx1] = useState(1);
  const [idx2, setIdx2] = useState(2);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/Banner?isActive=true')
      .then(res => {
        const data = res.data;
        setBanners(data);
        // Khởi tạo index ban đầu
        setIdx0(0);
        setIdx1(data.length > 1 ? 1 : 0);
        setIdx2(data.length > 2 ? 2 : 0);
      })
      .catch(() => setBanners([]));
  }, []);

  const next = useCallback(() => {
    setCurrent(prev => (prev + 1) % banners.length);
  }, [banners.length]);

  const prev = () => {
    setCurrent(prev => (prev - 1 + banners.length) % banners.length);
  };

  // Auto-slide every 4 seconds (slider mode)
  useEffect(() => {
    if (mode !== 'slider' || banners.length <= 1) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [banners.length, next, mode]);

  // Mỗi ô grid tự xoay vòng qua tất cả banner sau 30s, độc lập nhau
  useEffect(() => {
    if (mode !== 'grid' || banners.length <= 1) return;
    const len = banners.length;
    const t0 = setInterval(() => setIdx0(p => (p + 1) % len), 30000);
    const t1 = setInterval(() => setIdx1(p => (p + 1) % len), 30000);
    const t2 = setInterval(() => setIdx2(p => (p + 1) % len), 30000);
    return () => { clearInterval(t0); clearInterval(t1); clearInterval(t2); };
  }, [banners.length, mode]);

  if (banners.length === 0) return null;

  const handleClick = (banner) => {
    if (banner.linkUrl) {
      if (banner.linkUrl.startsWith('http')) {
        window.open(banner.linkUrl, '_blank');
      } else {
        navigate(banner.linkUrl);
      }
    }
  };

  // ── GRID MODE: 1 lớn trên + 2 nhỏ dưới ──
  if (mode === 'grid') {
    const main = banners[idx0];
    const sub1 = banners.length > 1 ? banners[idx1] : null;
    const sub2 = banners.length > 2 ? banners[idx2] : null;

    return (
      <div className="banner-grid-layout">
        {/* Banner lớn */}
        <div
          className={`banner-grid-main ${main.linkUrl ? 'clickable' : ''}`}
          onClick={() => handleClick(main)}
        >
          <img src={main.imageUrl} alt={main.title} />
          {main.title && (
            <div className="banner-overlay">
              <h2 className="banner-slide-title">{main.title}</h2>
            </div>
          )}
        </div>

        {/* 2 banner nhỏ */}
        {(sub1 || sub2) && (
          <div className="banner-grid-subs">
            {sub1 && (
              <div
                className={`banner-grid-sub ${sub1.linkUrl ? 'clickable' : ''}`}
                onClick={() => handleClick(sub1)}
              >
                <img src={sub1.imageUrl} alt={sub1.title} />
                {sub1.title && (
                  <div className="banner-overlay">
                    <h2 className="banner-slide-title">{sub1.title}</h2>
                  </div>
                )}
              </div>
            )}
            {sub2 && (
              <div
                className={`banner-grid-sub ${sub2.linkUrl ? 'clickable' : ''}`}
                onClick={() => handleClick(sub2)}
              >
                <img src={sub2.imageUrl} alt={sub2.title} />
                {sub2.title && (
                  <div className="banner-overlay">
                    <h2 className="banner-slide-title">{sub2.title}</h2>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── SLIDER MODE (mặc định) ──
  return (
    <div className="banner-slider">
      <div
        className="banner-track"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {banners.map((banner, idx) => (
          <div
            key={banner.id}
            className={`banner-slide ${banner.linkUrl ? 'clickable' : ''}`}
            onClick={() => handleClick(banner)}
          >
            <img src={banner.imageUrl} alt={banner.title} />
            {banner.title && (
              <div className="banner-overlay">
                <h2 className="banner-slide-title">{banner.title}</h2>
              </div>
            )}
          </div>
        ))}
      </div>

      {banners.length > 1 && (
        <>
          <button className="banner-nav banner-prev" onClick={prev}>&#8249;</button>
          <button className="banner-nav banner-next" onClick={next}>&#8250;</button>
          <div className="banner-dots">
            {banners.map((_, idx) => (
              <button
                key={idx}
                className={`banner-dot ${idx === current ? 'active' : ''}`}
                onClick={() => setCurrent(idx)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
