import React from 'react';
import { ToastItem, SnackBarItem, DialogItem } from '../../context/NotificationContext';

// --- Top Toast Component ---
interface TopToastProps {
    toast: ToastItem;
    onClose: () => void;
    index: number;
}

export const TopToast: React.FC<TopToastProps> = ({ toast, onClose, index }) => {
    const getIcon = () => {
        switch (toast.type) {
            case 'success':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gns-success-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="m9 12 2 2 4-4" />
                    </svg>
                );
            case 'info':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gns-info-bluegray)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4" />
                        <path d="M12 8h.01" />
                    </svg>
                );
            case 'warning':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--gns-warning-amber)" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                        <path d="M12 9v4" />
                        <path d="M12 17h.01" />
                    </svg>
                );
            case 'error':
                return (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gns-error-coral)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="m15 9-6 6" />
                        <path d="m9 9 6 6" />
                    </svg>
                );
        }
    };

    return (
        <div className="gns-toast" onClick={(e) => e.stopPropagation()}>
            <div className="gns-toast-icon">
                {getIcon()}
            </div>
            <div className="gns-toast-content">
                <div className="gns-toast-title">{toast.title}</div>
                {toast.description && <div className="gns-toast-desc">{toast.description}</div>}
            </div>
            <div className="gns-toast-close" onClick={onClose}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                </svg>
            </div>
        </div>
    );
};

// --- SnackBar Component ---
interface SnackBarProps {
    item: SnackBarItem;
    onClose: () => void;
}

export const SnackBar: React.FC<SnackBarProps> = ({ item, onClose }) => {
    return (
        <div className="gns-snackbar" onClick={(e) => e.stopPropagation()}>
            <span className="gns-snackbar-text">{item.text}</span>
            {item.action && (
                <button
                    className="gns-snackbar-action"
                    onClick={() => {
                        item.action?.onClick();
                        onClose();
                    }}
                >
                    {item.action.text}
                </button>
            )}
        </div>
    );
};

// --- Blocking Dialog Component ---
interface BlockingDialogProps {
    item: DialogItem;
    onClose: () => void;
}

export const BlockingDialog: React.FC<BlockingDialogProps> = ({ item, onClose }) => {
    return (
        <div className="gns-dialog-overlay" onClick={onClose}>
            {/* Prevent close on click inside */}
            <div className="gns-dialog" onClick={(e) => e.stopPropagation()}>
                <h3 className="gns-dialog-title">{item.title}</h3>
                <p className="gns-dialog-desc">{item.description}</p>
                <div className="gns-dialog-actions">
                    <button
                        className="gns-dialog-btn secondary"
                        onClick={() => {
                            item.onCancel?.();
                            onClose();
                        }}
                    >
                        {item.cancelText || '取消'}
                    </button>
                    <button
                        className="gns-dialog-btn primary"
                        onClick={() => {
                            item.onConfirm();
                            onClose();
                        }}
                    >
                        {item.confirmText || '确认'}
                    </button>
                </div>
            </div>
        </div>
    );
};

