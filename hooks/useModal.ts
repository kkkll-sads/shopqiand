/**
 * useModal - 弹窗控制 Hook
 * 
 * 功能说明：
 * - 封装弹窗的显示/隐藏状态管理
 * - 支持传递弹窗关联数据
 * - 简化弹窗组件的使用
 * 
 * @author 树交所前端团队
 * @version 1.0.0
 */

import { useState, useCallback } from 'react';

/**
 * useModal Hook 返回值接口
 */
interface UseModalResult<T = any> {
    /** 弹窗是否打开 */
    open: boolean;
    /** 弹窗关联的数据 */
    data: T | null;
    /** 显示弹窗 */
    show: (modalData?: T) => void;
    /** 隐藏弹窗 */
    hide: () => void;
    /** 切换弹窗状态 */
    toggle: () => void;
    /** 设置弹窗数据（不影响显示状态） */
    setData: (data: T | null) => void;
}

/**
 * useModal 弹窗控制 Hook
 * 
 * @param defaultOpen - 默认是否打开，默认 false
 * @returns 弹窗状态和控制方法
 * 
 * @example
 * // 基础用法
 * const confirmModal = useModal();
 * 
 * // 显示弹窗
 * <button onClick={() => confirmModal.show()}>删除</button>
 * 
 * // 弹窗组件
 * <ConfirmModal
 *   open={confirmModal.open}
 *   onConfirm={handleDelete}
 *   onCancel={confirmModal.hide}
 * />
 * 
 * @example
 * // 带数据的弹窗
 * const orderModal = useModal<Order>();
 * 
 * // 显示弹窗并传递订单数据
 * <button onClick={() => orderModal.show(order)}>查看详情</button>
 * 
 * // 弹窗中使用数据
 * <OrderDetailModal
 *   open={orderModal.open}
 *   order={orderModal.data}
 *   onClose={orderModal.hide}
 * />
 * 
 * @example
 * // 多个弹窗
 * const deleteModal = useModal();
 * const editModal = useModal<Product>();
 * const confirmModal = useModal();
 */
function useModal<T = any>(defaultOpen: boolean = false): UseModalResult<T> {
    // 弹窗打开状态
    const [open, setOpen] = useState<boolean>(defaultOpen);

    // 弹窗关联数据
    const [data, setData] = useState<T | null>(null);

    /**
     * 显示弹窗
     * @param modalData - 可选的弹窗关联数据
     */
    const show = useCallback((modalData?: T) => {
        if (modalData !== undefined) {
            setData(modalData);
        }
        setOpen(true);
    }, []);

    /**
     * 隐藏弹窗
     * 同时清空关联数据
     */
    const hide = useCallback(() => {
        setOpen(false);
        // 延迟清空数据，避免弹窗关闭动画时数据消失
        setTimeout(() => {
            setData(null);
        }, 300);
    }, []);

    /**
     * 切换弹窗状态
     */
    const toggle = useCallback(() => {
        setOpen(prev => !prev);
    }, []);

    return {
        open,
        data,
        show,
        hide,
        toggle,
        setData,
    };
}

export default useModal;
