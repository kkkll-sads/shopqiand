/**
 * UserSurvey - 用户问卷页面
 * 已迁移: 使用 React Router 导航
 *
 * @author 树交所前端团队
 * @version 2.1.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@/layouts/PageContainer';
import { ResultModal } from '@/components/common';
import { useModal } from '@/hooks';
import { useNotification } from '@/context/NotificationContext';
import {
  getMyQuestionnaireList,
  QuestionnaireItem,
  submitQuestionnaire,
} from '@/services/questionnaire';
import { extractData, extractError, isSuccess } from '@/utils/apiHelpers';
import { uploadImage } from '@/services/common';
import { getStoredToken } from '@/services/client';
import { useStateMachine } from '@/hooks/useStateMachine';
import { FormEvent, FormState, LoadingEvent, LoadingState } from '@/types/states';
import { errorLog } from '@/utils/logger';
import UserSurveyHistoryPanel from './user-survey/components/UserSurveyHistoryPanel';
import UserSurveySubmitPanel from './user-survey/components/UserSurveySubmitPanel';
import UserSurveyTabs from './user-survey/components/UserSurveyTabs';
import { ImageUploadState } from './user-survey/types';

const UserSurvey: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');

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

  const [uploadStates, setUploadStates] = useState<ImageUploadState[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadStatesRef = useRef<ImageUploadState[]>([]);
  const hasUploadingImages = uploadStates.some((item) => item.uploading);
  const hasUploadErrors = uploadStates.some((item) => Boolean(item.error));
  const hasInvalidUploadedImages = uploadStates.some(
    (item) => !item.uploading && !item.error && !(item.uploaded && item.url)
  );

  const resultModal = useModal();

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

  const revokePreviewUrls = useCallback((states: ImageUploadState[]) => {
    states.forEach((state) => {
      if (state.preview) {
        URL.revokeObjectURL(state.preview);
      }
    });
  }, []);

  useEffect(() => {
    uploadStatesRef.current = uploadStates;
  }, [uploadStates]);

  useEffect(() => {
    return () => {
      revokePreviewUrls(uploadStatesRef.current);
    };
  }, [revokePreviewUrls]);

  const loadHistory = async (pageNum = 1) => {
    try {
      loadMachine.send(LoadingEvent.LOAD);
      const response = await getMyQuestionnaireList({ page: pageNum, limit: 10 });
      if (isSuccess(response) && response.data) {
        const list = response.data.list || response.data.data || [];
        if (pageNum === 1) {
          setHistoryList(list);
        } else {
          setHistoryList((prev) => [...prev, ...list]);
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
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      void loadHistory(1);
    }
  }, [activeTab]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
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

    await Promise.all(
      newStates.map(async (state) => {
        try {
          const response = await uploadImage(state.file, token);
          const data = extractData(response);
          if (data?.url) {
            setUploadStates((prev) =>
              prev.map((item) =>
                item.file === state.file
                  ? { ...item, uploading: false, uploaded: true, url: data.url }
                  : item
              )
            );
          } else {
            throw new Error(extractError(response, '上传失败'));
          }
        } catch (error: any) {
          errorLog('UserSurvey', '图片上传失败', error);
          setUploadStates((prev) =>
            prev.map((item) =>
              item.file === state.file
                ? { ...item, uploading: false, error: error?.message || '上传失败' }
                : item
            )
          );
          showToast('error', '上传失败', (state.file as File).name || '图片上传失败');
        }
      })
    );

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadStates((prev) => {
      const target = prev[index];
      if (target.preview) URL.revokeObjectURL(target.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async () => {
    if (submitting) return;

    if (hasUploadingImages) {
      showToast('warning', '图片上传中', '请等待图片上传完成后再提交');
      return;
    }

    if (hasUploadErrors) {
      showToast('warning', '存在上传失败图片', '请删除失败图片或重新上传后再提交');
      return;
    }

    if (hasInvalidUploadedImages) {
      showToast('warning', '图片状态异常', '请重新上传图片后再提交');
      return;
    }

    if (!title.trim() || !content.trim()) {
      showToast('warning', '请填写完整', '标题和内容不能为空');
      return;
    }

    try {
      submitMachine.send(FormEvent.SUBMIT);
      const validImages = uploadStates
        .map((item) => (item.uploaded && item.url ? item.url : null))
        .filter((url): url is string => Boolean(url));

      // Prevent silently dropping selected images when upload state is unexpected.
      if (uploadStates.length !== validImages.length) {
        showToast('warning', '图片未就绪', '请等待上传完成或移除异常图片后再提交');
        submitMachine.send(FormEvent.SUBMIT_ERROR);
        return;
      }

      const response = await submitQuestionnaire({
        title,
        content,
        images: validImages.join(','),
      });

      if (isSuccess(response)) {
        showToast('success', '提交成功', '您的反馈已收到，我们会尽快审核。');
        setTitle('');
        setContent('');
        setUploadStates((prev) => {
          revokePreviewUrls(prev);
          return [];
        });
        setActiveTab('history');
        submitMachine.send(FormEvent.SUBMIT_SUCCESS);
      } else {
        showToast('error', '提交失败', response.msg || '请稍后重试');
        submitMachine.send(FormEvent.SUBMIT_ERROR);
      }
    } catch (error) {
      errorLog('UserSurvey', 'Submit error', error);
      showToast('error', '提交失败', '网络请求失败');
      submitMachine.send(FormEvent.SUBMIT_ERROR);
    }
  };

  return (
    <PageContainer title="用户问卷" onBack={() => navigate(-1)}>
      <UserSurveyTabs activeTab={activeTab} onChange={setActiveTab} />

      <div className="px-4 pb-safe">
        {activeTab === 'submit' ? (
          <UserSurveySubmitPanel
            title={title}
            content={content}
            uploadStates={uploadStates}
            fileInputRef={fileInputRef}
            submitting={submitting}
            disableSubmit={hasUploadingImages || hasUploadErrors || hasInvalidUploadedImages}
            disableReason={
              hasUploadingImages
                ? '图片上传中，请稍后提交'
                : hasUploadErrors
                ? '存在上传失败图片，请处理后提交'
                : hasInvalidUploadedImages
                ? '图片状态异常，请重新上传后提交'
                : undefined
            }
            onTitleChange={setTitle}
            onContentChange={setContent}
            onFileChange={handleFileChange}
            onRemoveImage={handleRemoveImage}
            onSubmit={handleSubmit}
          />
        ) : (
          <UserSurveyHistoryPanel
            historyList={historyList}
            loading={loading}
            hasMore={hasMore}
            onLoadMore={() => loadHistory(page + 1)}
            onOpenImage={(url) => window.open(url, '_blank')}
          />
        )}
      </div>

      <ResultModal
        visible={resultModal.open}
        type={(resultModal.data?.status as any) || 'success'}
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
