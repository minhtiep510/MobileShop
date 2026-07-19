import React, { useCallback, useState, createContext, useContext, useRef } from 'react';
import '../styles/ConfirmDialog.css';

// ─── Context ─────────────────────────────────────────────────────────────────
const ConfirmContext = createContext(null);

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return ctx;
};

// ─── Dialog Component ─────────────────────────────────────────────────────────
function ConfirmDialog({ visible, title, message, confirmLabel, confirmType, onConfirm, onCancel }) {
  return (
    <div className={`confirm-overlay ${visible ? 'confirm-visible' : ''}`} onClick={onCancel}>
      <div
        className={`confirm-box ${visible ? 'confirm-box-visible' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="confirm-icon-wrap">
          {confirmType === 'danger' ? (
            <div className="confirm-icon danger">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
          ) : (
            <div className="confirm-icon warning">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
          )}
        </div>

        <h3 className="confirm-title">{title}</h3>
        <p className="confirm-message">{message}</p>

        <div className="confirm-actions">
          <button className="confirm-btn-cancel" onClick={onCancel}>
            Hủy bỏ
          </button>
          <button
            className={`confirm-btn-ok ${confirmType === 'danger' ? 'danger' : 'warning'}`}
            onClick={onConfirm}
          >
            {confirmLabel || 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ConfirmProvider({ children }) {
  const [state, setState] = useState({
    visible: false,
    title: '',
    message: '',
    confirmLabel: 'Xác nhận',
    confirmType: 'danger',
  });

  const resolveRef = useRef(null);

  // Returns a Promise<boolean>
  const confirm = useCallback(({ title, message, confirmLabel = 'Xác nhận', confirmType = 'danger' } = {}) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({ visible: true, title, message, confirmLabel, confirmType });
    });
  }, []);

  const handleConfirm = () => {
    setState(s => ({ ...s, visible: false }));
    setTimeout(() => resolveRef.current?.(true), 200);
  };

  const handleCancel = () => {
    setState(s => ({ ...s, visible: false }));
    setTimeout(() => resolveRef.current?.(false), 200);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        {...state}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  );
}
