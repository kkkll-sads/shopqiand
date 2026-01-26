/**
 * UserSurvey - 用户问卷页面
 * 已迁移: 使用 React Router 导航
 * 
 * @author 树交所前端团队
 * @version 2.1.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Send, Clock, CheckCircle, XCircle, AlertCircle, Image as ImageIcon, Plus, X, Check } from 'lucide-react';
import PageContainer from '@/layouts/PageContainer';
import { LoadingSpinner, ResultModal } from '@/components/common';
import { useModal } from '@/hooks';
import { useNotification } from '@/context/NotificationContext';
import { submitQuestionnaire, getMyQuestionnaireList, QuestionnaireItem } from '@/services/questionnaire';
import { isSuccess, extractData, extractError } from '@/utils/apiHelpers';
import { uploadImage } from '@/services/common';
import { getStoredToken } from '@/services/client';
import { useStateMachine } from '@/hooks/useStateMachine';
import { FormEvent, FormState, LoadingEvent, LoadingState } from '@/types/states';
import { errorLog } from '@/utils/logger';

interface ImageUploadState {
  file: File;
  preview: string;
  uploading: boolean;
  uploaded: boolean;
  url?: string;
  error?: string;
}

const UserSurvey: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');

  // 提交表单状态
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const submitMachine = useStateMachine<FormState, FormEvent>({
    initial: FormState.IDLE,
    transitions: {
      [FormState.IDLE]: { [FormEvent.SUBMIT]: FormState.SUBMITTING },
      [FormState.VALIDATING]: {
        [FormEvent.VALIDATION_SUCCESS]: FormState.SUBMITTING,
        [FormEvent.VALIDATION_ERROR]: FormState.ERROR,
      },
      [FormState.SUBMITTING]: {
        [FormEvent.SUBMIT_SUCCESS]: FormState.SUCCESS,
        [FormEvent.SUBMIT_ERROR]: FormState.ERROR,
      },
      [FormState.SUCCESS]: {
        [FormEvent.SUBMIT]: FormState.SUBMITTING,
        [FormEvent.RESET]: FormState.IDLE,
      },
      [FormState.ERROR]: {
        [FormEvent.SUBMIT]: FormState.SUBMITTING,
        [FormEvent.RESET]: FormState.IDLE,
      },
    },
  });
  const submitting = submitMachine.state === FormState.SUBMITTING;

  // 图片上传状态
  const [uploadStates, setUploadStates] = useState<ImageUploadState[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resultModal = useModal();

  // 历史列表状态
  const [historyList, setHistoryList] = useState<QuestionnaireItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loadMachine = useStateMachine<LoadingState, LoadingEvent>({
    initial: LoadingState.IDLE,
    transitions: {
      [LoadingState.IDLE]: { [LoadingEvent.LOAD]: LoadingState.LOADING },
      [LoadingState.LOADING]: {
        [LoadingEvent.SUCCESS]: LoadingState.SUCCESS,
        [LoadingEvent.ERROR]: LoadingState.ERROR,
      },
      [LoadingState.SUCCESS]: {
        [LoadingEvent.LOAD]: LoadingState.LOADING,
        [LoadingEvent.RETRY]: LoadingState.LOADING,
      },
      [LoadingState.ERROR]: {
        [LoadingEvent.LOAD]: LoadingState.LOADING,
        [LoadingEvent.RETRY]: LoadingState.LOADING,
      },
    },
  });
  const loading = loadMachine.state === LoadingState.LOADING;

  // 加载历史记录
  const loadHistory = async (pageNum = 1) => {
    try {
      loadMachine.send(LoadingEvent.LOAD);
      const res = await getMyQuestionnaireList({ page: pageNum, limit: 10 });
      if (isSuccess(res) && res.data) {
        const list = res.data.list || res.data.data || [];
        if (pageNum === 1) {
          setHistoryList(list);
        } else {
          setHistoryList(prev => [...prev, ...list]);
        }
        setHasMore(list.length >= 10);
        setPage(pageNum);
        loadMachine.send(LoadingEvent.SUCCESS);
      } else {
        loadMachine.send(LoadingEvent.ERROR);
      }
    } catch (error) {
      errorLog('UserSurvey', 'Failed to load questionnaire history', error);
      showToast('error', '加载失败', '无法获取问卷记录');
      loadMachine.send(LoadingEvent.ERROR);
    } finally {
      // 状态机已处理成功/失败
    }
  };

  // 切换到历史记录时加载
  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory(1);
    }
  }, [activeTab]);

  // 处理文件选择
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const token = getStoredToken();
    if (!token) {
      showToast('error', '登录过期', '请重新登录');
      return;
    }

    const maxCount = 4;
    const uploadedCount = uploadStates.length;
    const remainingSlots = maxCount - uploadedCount;

    if (remainingSlots <= 0) {
      showToast('warning', '数量限制', `最多只能上传${maxCount}张图片`);
      return;
    }

    const filesToAdd = Array.from(files as FileList).slice(0, remainingSlots) as File[];
    if (files.length > remainingSlots) {
      showToast('warning', '数量限制', `最多只能上传${maxCount}张图片`);
    }

    const newStates: ImageUploadState[] = filesToAdd.map((file: File) => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: true,
      uploaded: false,
    }));

    setUploadStates((prev) => [...prev, ...newStates]);

    // 并发上传
    await Promise.all(newStates.map(async (state) => {
      try {
        const res = await uploadImage(state.file, token);
        const data = extractData(res);
        if (data?.url) {
          setUploadStates((prev) =>
            prev.map((s) =>
              s.file === state.file ? { ...s, uploading: false, uploaded: true, url: data.url } : s
            )
          );
        } else {
          throw new Error(extractError(res, '上传失败'));
        }
      } catch (error: any) {
        errorLog('UserSurvey', '图片上传失败', error);
        setUploadStates((prev) =>
          prev.map((s) =>
            s.file === state.file ? { ...s, uploading: false, error: error?.message || '上传失败' } : s
          )
        );
        showToast('error', '上传失败', (state.file as File).name || '图片上传失败');
      }
    }));

    // 清空input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadStates(prev => {
      const target = prev[index];
      if (target.preview) URL.revokeObjectURL(target.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      showToast('warning', '请填写完整', '标题和内容不能为空');
      return;
    }

    try {
      submitMachine.send(FormEvent.SUBMIT);
      const validImages = uploadStates.filter(s => s.uploaded && s.url).map(s => s.url);
      const res = await submitQuestionnaire({
        title,
        content,
        images: validImages.join(',')
      });

      if (isSuccess(res)) {
        showToast('success', '提交成功', '您的反馈已收到，我们会尽快审核。');
        setTitle('');
        setContent('');
        setUploadStates([]);
        setActiveTab('history');
        submitMachine.send(FormEvent.SUBMIT_SUCCESS);
      } else {
        showToast('error', '提交失败', res.msg || '请稍后重试');
        submitMachine.send(FormEvent.SUBMIT_ERROR);
      }
    } catch (error) {
      errorLog('UserSurvey', 'Submit error', error);
      showToast('error', '提交失败', '网络请求失败');
      submitMachine.send(FormEvent.SUBMIT_ERROR);
    } finally {
      // 状态机已处理成功/失败
    }
  };

  const getStatusBadge = (status: number, text: string) => {
    switch (status) {
      case 0:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-600 border border-yellow-100">
            <Clock size={12} /> {text || '待审核'}
          </span>
        );
      case 1:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-600 border border-green-100">
            <CheckCircle size={12} /> {text || '已采纳'}
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-600 border border-red-100">
            <XCircle size={12} /> {text || '已拒绝'}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <PageContainer title="用户问卷" onBack={() => navigate(-1)}>
      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 px-4 flex gap-6 mb-4">
        <button
          className={`py-3 text-sm font-bold border-b-2 transition-all active:scale-95 ${activeTab === 'submit'
            ? 'border-red-500 text-red-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          onClick={() => setActiveTab('submit')}
        >
          提交反馈
        </button>
        <button
          className={`py-3 text-sm font-bold border-b-2 transition-all active:scale-95 ${activeTab === 'history'
            ? 'border-red-500 text-red-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          onClick={() => setActiveTab('history')}
        >
          我的反馈
        </button>
      </div>

      <div className="px-4 pb-safe">
        {activeTab === 'submit' ? (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
              <div className="mb-5">
                <label className="block text-sm font-bold text-gray-700 mb-2">标题</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="请输入反馈标题"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">反馈内容</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="请详细描述您的建议或遇到的问题..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm min-h-[160px] resize-none focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                />
              </div>

              {/* Image Upload Zone */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">上传图片 (可选)</label>
                <div className="grid grid-cols-4 gap-3">
                  {uploadStates.map((state, idx) => (
                    <div key={idx} className="aspect-square rounded-xl bg-gray-50 border border-gray-200 overflow-hidden relative group">
                      <img
                        src={state.url || state.preview}
                        alt="preview"
                        className={`w-full h-full object-cover ${state.uploading ? 'opacity-50' : ''}`}
                      />

                      {state.uploading && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        </div>
                      )}

                      {state.error && (
                        <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center">
                          <AlertCircle size={20} className="text-white" />
                        </div>
                      )}

                      <button
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 bg-black/40 text-white rounded-full p-1 active:bg-red-500 transition-colors"
                      >
                        <X size={12} />
                      </button>

                      {state.uploaded && !state.uploading && (
                        <div className="absolute bottom-1 right-1 bg-green-500 text-white rounded-full p-0.5">
                          <Check size={10} />
                        </div>
                      )}
                    </div>
                  ))}

                  {uploadStates.length < 4 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-xl bg-gray-50 border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-100 hover:border-gray-400 transition-all active:scale-95"
                    >
                      <Plus size={24} className="mb-1" />
                      <span className="text-[10px]">上传</span>
                    </button>
                  )}

                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`w-full py-3 rounded-xl font-bold text-white shadow-lg shadow-red-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${submitting ? 'bg-red-300' : 'bg-gradient-to-r from-red-500 to-red-600'
                }`}
            >
              {submitting ? <LoadingSpinner size="sm" color="white" /> : <Send size={18} />}
              <span>提交反馈</span>
            </button>

            <div className="text-xs text-gray-400 text-center px-4 leading-relaxed">
              您的反馈对我们非常重要，采纳后将获得算力奖励。
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {historyList.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-sm font-bold text-gray-900 line-clamp-1 flex-1 mr-2">{item.title}</h3>
                  {getStatusBadge(item.status, item.status_text)}
                </div>
                <div className="text-xs text-gray-600 mb-3 bg-gray-50 p-2.5 rounded-lg leading-relaxed">
                  {item.content}
                </div>

                {/* Images in History */}
                {item.images && item.images.length > 0 && (
                  <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-none">
                    {item.images.split(',').map((imgUrl, idx) => (
                      <div key={idx} className="w-16 h-16 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                        <img
                          src={imgUrl}
                          alt={`feedback-${idx}`}
                          className="w-full h-full object-cover"
                          onClick={() => window.open(imgUrl, '_blank')}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* 管理员回复或奖励信息 */}
                {(item.admin_remark || item.reward_power > 0) && (
                  <div className="bg-red-50 rounded-xl p-3 text-xs mb-3 border border-red-100">
                    {item.reward_power > 0 && (
                      <div className="flex items-center gap-1 text-red-600 font-bold mb-1">
                        <span className="text-lg">🎁</span> 获得奖励：{item.reward_power} 算力
                      </div>
                    )}
                    {item.admin_remark && (
                      <div className="flex gap-2">
                        <span className="font-bold text-gray-700 shrink-0">管理员回复:</span>
                        <span className="text-gray-600">{item.admin_remark}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center text-[10px] text-gray-400">
                  <span>{item.create_time_text}</span>
                  <span>ID: {item.id}</span>
                </div>
              </div>
            ))}

            {loading && <div className="py-4 flex justify-center"><LoadingSpinner /></div>}

            {!loading && historyList.length === 0 && (
              <div className="py-20 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                  <ClipboardList size={32} />
                </div>
                <p className="text-gray-400 text-xs">暂无反馈记录</p>
              </div>
            )}

            {!loading && historyList.length > 0 && hasMore && (
              <button
                onClick={() => loadHistory(page + 1)}
                className="w-full py-2 text-xs text-gray-400 text-center active:bg-gray-50"
              >
                点击加载更多
              </button>
            )}
          </div>
        )}
      </div>

      <ResultModal
        visible={resultModal.open}
        type={resultModal.data?.status as any || 'success'}
        title={resultModal.data?.title}
        description={resultModal.data?.desc}
        confirmText={resultModal.data?.confirmText}
        onConfirm={() => {
          resultModal.data?.onConfirm && resultModal.data.onConfirm();
          resultModal.hide();
        }}
        onClose={resultModal.hide}
      />
    </PageContainer>
  );
};

export default UserSurvey;
