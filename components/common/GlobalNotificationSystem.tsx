import React from 'react';
import { useNotification } from '../../context/NotificationContext';
import { TopToast, SnackBar, BlockingDialog } from './NotificationComponents';

export const GlobalNotificationSystem: React.FC = () => {
    const { toasts, snackBar, dialog, removeToast, closeSnackBar, hideDialog } = useNotification();

    return (
        <div className="gns-container">
            {/* Top Toasts Stack */}
            <div className="gns-toast-stack">
                {toasts.map((toast, index) => (
                    <TopToast
                        key={toast.id}
                        toast={toast}
                        index={index}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>

            {/* SnackBar */}
            {snackBar && (
                <div className="gns-snackbar-container">
                    <SnackBar item={snackBar} onClose={closeSnackBar} />
                </div>
            )}

            {/* Blocking Dialog */}
            {dialog && (
                <BlockingDialog item={dialog} onClose={hideDialog} />
            )}
        </div>
    );
};
