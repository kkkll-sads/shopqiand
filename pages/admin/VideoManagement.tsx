import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Edit, Trash2, Eye, EyeOff, Search, X } from 'lucide-react';
import { LoadingSpinner, EmptyState } from '../../components/common';
import { useNotification } from '../../context/NotificationContext';
import { 
    getVideoList, 
    addVideo, 
    editVideo, 
    deleteVideo, 
    VideoItem, 
    SaveVideoParams 
} from '../../services/video';
import { uploadImage } from '../../services/common';
import { isSuccess, extractError } from '../../utils/apiHelpers';
import { AUTH_TOKEN_KEY } from '../../constants/storageKeys';

interface VideoManagementProps {
    onBack: () => void;
}

const VideoManagement: React.FC<VideoManagementProps> = ({ onBack }) => {
    const { showToast, showDialog } = useNotification();
    
    // 列表状态
    const [videos, setVideos] = useState<VideoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [keyword, setKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState<number | undefined>();

    // 编辑/添加状态
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
    const [formData, setFormData] = useState<SaveVideoParams>({
        title: '',
        cover: '',
        video_url: '',
        description: '',
        duration: 0,
        status: 1,
        sort: 0,
    });
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    // 加载视频列表
    const loadVideos = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
            const response = await getVideoList({
                page,
                limit: 20,
                status: statusFilter,
                keyword: keyword.trim() || undefined,
                token,
            });

            if (isSuccess(response) && response.data) {
                setVideos(response.data.list || []);
                setTotal(response.data.total || 0);
            } else {
                showToast('error', '加载失败', extractError(response, '获取视频列表失败'));
            }
        } catch (error: any) {
            showToast('error', '加载失败', error.message || '网络错误');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadVideos();
    }, [page, statusFilter]);

    // 搜索
    const handleSearch = () => {
        setPage(1);
        loadVideos();
    };

    // 打开添加/编辑弹窗
    const handleOpenEdit = (video?: VideoItem) => {
        if (video) {
            setEditingVideo(video);
            setFormData({
                id: video.id,
                title: video.title,
                cover: video.cover,
                video_url: video.video_url,
                description: video.description || '',
                duration: video.duration || 0,
                status: video.status,
                sort: video.sort,
            });
        } else {
            setEditingVideo(null);
            setFormData({
                title: '',
                cover: '',
                video_url: '',
                description: '',
                duration: 0,
                status: 1,
                sort: 0,
            });
        }
        setShowEditModal(true);
    };

    // 上传图片
    const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            showToast('error', '请选择图片文件');
            return;
        }

        // 验证文件大小（5MB）
        if (file.size > 5 * 1024 * 1024) {
            showToast('error', '图片大小不能超过5MB');
            return;
        }

        try {
            setUploading(true);
            const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
            const response = await uploadImage(file, token);

            if (isSuccess(response) && response.data?.url) {
                setFormData(prev => ({ ...prev, cover: response.data.url }));
                showToast('success', '上传成功');
            } else {
                showToast('error', '上传失败', extractError(response, '图片上传失败'));
            }
        } catch (error: any) {
            showToast('error', '上传失败', error.message || '网络错误');
        } finally {
            setUploading(false);
        }
    };

    // 保存视频
    const handleSave = async () => {
        // 验证
        if (!formData.title.trim()) {
            showToast('warning', '请输入视频标题');
            return;
        }
        if (!formData.cover.trim()) {
            showToast('warning', '请上传封面图');
            return;
        }
        if (!formData.video_url.trim()) {
            showToast('warning', '请输入视频URL');
            return;
        }

        try {
            setSaving(true);
            const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
            const params = { ...formData, token };

            const response = editingVideo
                ? await editVideo(params)
                : await addVideo(params);

            if (isSuccess(response)) {
                showToast('success', editingVideo ? '编辑成功' : '添加成功');
                setShowEditModal(false);
                loadVideos();
            } else {
                showToast('error', '保存失败', extractError(response, '操作失败'));
            }
        } catch (error: any) {
            showToast('error', '保存失败', error.message || '网络错误');
        } finally {
            setSaving(false);
        }
    };

    // 删除视频
    const handleDelete = (video: VideoItem) => {
        showDialog({
            title: '确认删除',
            description: `确定要删除视频"${video.title}"吗？此操作不可恢复。`,
            confirmText: '确定删除',
            cancelText: '取消',
            onConfirm: async () => {
                try {
                    const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
                    const response = await deleteVideo(video.id, token);

                    if (isSuccess(response)) {
                        showToast('success', '删除成功');
                        loadVideos();
                    } else {
                        showToast('error', '删除失败', extractError(response, '操作失败'));
                    }
                } catch (error: any) {
                    showToast('error', '删除失败', error.message || '网络错误');
                }
            },
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-full">
                    <ChevronLeft size={24} className="text-gray-700" />
                </button>
                <h1 className="text-lg font-bold text-gray-900">视频管理</h1>
                <button
                    onClick={() => handleOpenEdit()}
                    className="p-2 bg-orange-500 text-white rounded-full hover:bg-orange-600"
                >
                    <Plus size={20} />
                </button>
            </header>

            {/* 搜索和筛选 */}
            <div className="bg-white p-4 space-y-3">
                {/* 搜索框 */}
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="搜索视频标题..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
                        />
                        <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    <button
                        onClick={handleSearch}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
                    >
                        搜索
                    </button>
                </div>

                {/* 状态筛选 */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setStatusFilter(undefined)}
                        className={`px-4 py-2 rounded-lg font-medium ${
                            statusFilter === undefined
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-100 text-gray-600'
                        }`}
                    >
                        全部
                    </button>
                    <button
                        onClick={() => setStatusFilter(1)}
                        className={`px-4 py-2 rounded-lg font-medium ${
                            statusFilter === 1
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-100 text-gray-600'
                        }`}
                    >
                        已上架
                    </button>
                    <button
                        onClick={() => setStatusFilter(0)}
                        className={`px-4 py-2 rounded-lg font-medium ${
                            statusFilter === 0
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-100 text-gray-600'
                        }`}
                    >
                        已下架
                    </button>
                </div>
            </div>

            {/* 视频列表 */}
            <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : videos.length === 0 ? (
                    <EmptyState message="暂无视频" />
                ) : (
                    <div className="space-y-3">
                        {videos.map((video) => (
                            <div
                                key={video.id}
                                className="bg-white rounded-lg p-4 shadow-sm border border-gray-100"
                            >
                                <div className="flex gap-3">
                                    {/* 封面 */}
                                    <div className="w-32 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                        <img
                                            src={video.cover}
                                            alt={video.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* 信息 */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 truncate">
                                            {video.title}
                                        </h3>
                                        {video.description && (
                                            <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                                                {video.description}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                            <span>排序: {video.sort}</span>
                                            {video.duration && (
                                                <span>{Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}</span>
                                            )}
                                            {video.view_count !== undefined && (
                                                <span>观看: {video.view_count}</span>
                                            )}
                                            <span
                                                className={`px-2 py-0.5 rounded ${
                                                    video.status === 1
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-600'
                                                }`}
                                            >
                                                {video.status === 1 ? '已上架' : '已下架'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* 操作按钮 */}
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => handleOpenEdit(video)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(video)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 分页 */}
                {!loading && total > 20 && (
                    <div className="flex justify-center gap-2 mt-4">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-lg disabled:opacity-50"
                        >
                            上一页
                        </button>
                        <span className="px-4 py-2">
                            {page} / {Math.ceil(total / 20)}
                        </span>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={page >= Math.ceil(total / 20)}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-lg disabled:opacity-50"
                        >
                            下一页
                        </button>
                    </div>
                )}
            </div>

            {/* 编辑/添加弹窗 */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60">
                    <div className="bg-white w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold">
                                {editingVideo ? '编辑视频' : '添加视频'}
                            </h3>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="p-1 hover:bg-gray-100 rounded-full"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* 标题 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    视频标题 *
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="请输入视频标题"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
                                />
                            </div>

                            {/* 封面 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    封面图 *
                                </label>
                                {formData.cover ? (
                                    <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden">
                                        <img
                                            src={formData.cover}
                                            alt="封面"
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            onClick={() => setFormData(prev => ({ ...prev, cover: '' }))}
                                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="block w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-400">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleUploadImage}
                                            disabled={uploading}
                                            className="hidden"
                                        />
                                        <div className="flex flex-col items-center justify-center h-full">
                                            {uploading ? (
                                                <>
                                                    <LoadingSpinner />
                                                    <span className="text-sm text-gray-500 mt-2">上传中...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Plus size={32} className="text-gray-400" />
                                                    <span className="text-sm text-gray-500 mt-2">点击上传封面</span>
                                                </>
                                            )}
                                        </div>
                                    </label>
                                )}
                            </div>

                            {/* 视频URL */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    视频URL *
                                </label>
                                <input
                                    type="url"
                                    value={formData.video_url}
                                    onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                                    placeholder="https://example.com/video.mp4"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
                                />
                            </div>

                            {/* 描述 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    视频描述
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="请输入视频描述"
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 resize-none"
                                />
                            </div>

                            {/* 时长和排序 */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        时长（秒）
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.duration}
                                        onChange={(e) => setFormData(prev => ({ ...prev, duration: Number(e.target.value) }))}
                                        placeholder="0"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        排序
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.sort}
                                        onChange={(e) => setFormData(prev => ({ ...prev, sort: Number(e.target.value) }))}
                                        placeholder="0"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
                                    />
                                </div>
                            </div>

                            {/* 状态 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    状态
                                </label>
                                <div className="flex gap-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            checked={formData.status === 1}
                                            onChange={() => setFormData(prev => ({ ...prev, status: 1 }))}
                                            className="mr-2"
                                        />
                                        <span>上架</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            checked={formData.status === 0}
                                            onChange={() => setFormData(prev => ({ ...prev, status: 0 }))}
                                            className="mr-2"
                                        />
                                        <span>下架</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* 按钮 */}
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="flex-1 py-3 border border-gray-200 rounded-lg font-medium hover:bg-gray-50"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50"
                            >
                                {saving ? '保存中...' : '保存'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoManagement;
