import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// --- Types ---
export type ToastType = 'success' | 'info' | 'warning' | 'error';
export type ActionButton = { text: string; onClick: () => void; isPrimary?: boolean };

export interface ToastItem {
    id: string;
    type: ToastType;
    title: string;
    description?: string;
    duration?: number;
    action?: { text: string; onClick: () => void };
}

export interface SnackBarItem {
    text: string;
    action?: { text: string; onClick: () => void };
    duration?: number;
}

export interface DialogItem {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
}

interface NotificationContextValue {
    showToast: (type: ToastType, title: string, description?: string, duration?: number, action?: ToastItem['action']) => void;
    showSnackBar: (text: string, action?: SnackBarItem['action'], duration?: number) => void;
    showDialog: (item: DialogItem) => void;
    hideDialog: () => void;

    // State for rendering (consumed by the GlobalNotificationSystem component)
    toasts: ToastItem[];
    snackBar: SnackBarItem | null;
    dialog: DialogItem | null;
    removeToast: (id: string) => void;
    closeSnackBar: () => void;
}

// --- Context ---
const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

// --- Provider ---
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const [snackBar, setSnackBar] = useState<SnackBarItem | null>(null);
    const [dialog, setDialog] = useState<DialogItem | null>(null);

    // --- Actions ---
    const showToast = useCallback((type: ToastType, title: string, description?: string, duration = 3000, action?: ToastItem['action']) => {
        const id = Date.now().toString() + Math.random().toString().slice(2);
        const newToast: ToastItem = { id, type, title, description, duration, action };

        setToasts((prev) => {
            // Limit stack to 3 items, add new to start (top)
            const updated = [newToast, ...prev].slice(0, 3);
            return updated;
        });

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showSnackBar = useCallback((text: string, action?: SnackBarItem['action'], duration = 4000) => {
        setSnackBar({ text, action, duration });
        if (duration > 0) {
            setTimeout(() => {
                setSnackBar(null);
            }, duration);
        }
    }, []);

    const closeSnackBar = useCallback(() => {
        setSnackBar(null);
    }, []);

    const showDialog = useCallback((item: DialogItem) => {
        setDialog(item);
    }, []);

    const hideDialog = useCallback(() => {
        setDialog(null);
    }, []);

    const value = {
        showToast,
        showSnackBar,
        showDialog,
        hideDialog,
        toasts,
        snackBar,
        dialog,
        removeToast,
        closeSnackBar,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
