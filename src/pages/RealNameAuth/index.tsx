import React, { useState, useEffect } from 'react';
import { ChevronLeft, WifiOff, AlertCircle, CheckCircle2, XCircle, Camera, User, AlertTriangle, ChevronRight, Sun, Wifi, Clock } from 'lucide-react';
import { useAppNavigate } from '../../lib/navigation';
import { PageHeader } from '../../components/layout/PageHeader';
import { ErrorState } from '../../components/ui/ErrorState';

export const RealNameAuthPage = () => {
  const { goTo, goBack } = useAppNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [offline, setOffline] = useState(false);
  
  const [name, setName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [idFront, setIdFront] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<string | null>(null);
  const [faceVerified, setFaceVerified] = useState(false);
  
  const [auditStatus, setAuditStatus] = useState<'none' | 'auditing' | 'passed' | 'rejected'>('none');
  
  const [showFaceFailModal, setShowFaceFailModal] = useState(false);
  const [showCameraFailModal, setShowCameraFailModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    setError(false);
    setTimeout(() => {
      setLoading(false);
    }, 800);
  };

  const handleBack = () => {
    goBack();
  };

  const isInfoFilled = name.trim().length > 0 && idNumber.trim().length > 0;
  const isUploadFilled = idFront !== null && idBack !== null;
  const canSubmit = isInfoFilled && isUploadFilled && faceVerified;

  let currentStepIdx = 0;
  if (auditStatus !== 'none') {
    currentStepIdx = 3;
  } else if (isUploadFilled) {
    currentStepIdx = 2;
  } else if (isInfoFilled) {
    currentStepIdx = 1;
  }

  const steps = ['填写信息', '上传证件', '人脸核验', '审核结果'];

  const handleUploadFront = () => {
    // Simulate camera permission failure randomly for demo
    if (Math.random() > 0.8) {
      setShowCameraFailModal(true);
      return;
    }
    setIdFront('https://picsum.photos/seed/idfront/400/250');
  };

  const handleUploadBack = () => {
    setIdBack('https://picsum.photos/seed/idback/400/250');
  };

  const handleFaceAuth = () => {
    // Simulate face auth failure randomly for demo
    if (Math.random() > 0.5) {
      setShowFaceFailModal(true);
      return;
    }
    setFaceVerified(true);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setAuditStatus('auditing');
    }, 1000);
  };

  const renderHeader = () => (
    <div className="bg-white dark:bg-gray-900 z-40 relative shrink-0 border-b border-gray-100 dark:border-gray-800">
      {offline && (
        <div className="bg-red-50 dark:bg-red-900/30 text-brand-start dark:text-red-400 px-4 py-2 flex items-center justify-between text-sm">
          <div className="flex items-center">
            <WifiOff size={14} className="mr-2" />
            <span>网络不稳定，请检查网络设置</span>
          </div>
          <button onClick={() => setOffline(false)} className="font-medium px-2 py-1 bg-white dark:bg-gray-800 rounded shadow-sm">刷新</button>
        </div>
      )}
      <div className="h-12 flex items-center justify-between px-3 pt-safe">
        <div className="flex items-center w-1/3">
          <button onClick={handleBack} className="p-1 -ml-1 text-gray-900 dark:text-gray-100 active:opacity-70">
            <ChevronLeft size={24} />
          </button>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center w-1/3">实名认证</h1>
        <div className="w-1/3"></div>
      </div>
    </div>
  );

  const renderStepBar = () => (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm dark:shadow-none border border-transparent dark:border-gray-800 mb-4 flex justify-between items-center relative mx-4 mt-4">
      <div className="absolute top-1/2 left-[12%] right-[12%] h-[1px] bg-gray-100 dark:bg-gray-800 -translate-y-1/2 z-0"></div>
      {steps.map((step, idx) => {
        const isActive = currentStepIdx >= idx;
        const isCurrent = currentStepIdx === idx;
        return (
          <div key={idx} className="relative z-10 flex flex-col items-center bg-white dark:bg-gray-900 px-1">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-s font-bold mb-1.5 transition-colors ${isActive ? 'bg-brand-start text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'}`}>
              {isActive && idx < currentStepIdx ? <CheckCircle2 size={12} /> : idx + 1}
            </div>
            <span className={`text-xs ${isCurrent ? 'text-brand-start font-medium' : isActive ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>{step}</span>
          </div>
        );
      })}
    </div>
  );

  const renderSkeleton = () => (
    <div className="p-4 space-y-4">
      <div className="w-full h-20 bg-white dark:bg-gray-900 rounded-2xl animate-pulse"></div>
      <div className="w-full h-40 bg-white dark:bg-gray-900 rounded-2xl animate-pulse"></div>
      <div className="w-full h-48 bg-white dark:bg-gray-900 rounded-2xl animate-pulse"></div>
    </div>
  );

  const renderError = () => (
    <ErrorState onRetry={fetchData} />
  );

  const renderResult = () => {
    if (auditStatus === 'auditing') {
      return (
        <div className="flex flex-col items-center pt-16 px-6">
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-5 text-blue-500">
            <Clock size={40} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">审核中</h2>
          <p className="text-base text-gray-500 dark:text-gray-400 text-center mb-10 leading-relaxed">您的实名认证信息已提交，预计将在1-3个工作日内完成审核，请耐心等待。</p>
          <button className="w-full h-[48px] rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-medium active:bg-gray-50 dark:active:bg-gray-800 transition-colors" onClick={handleBack}>返回</button>
        </div>
      );
    }
    if (auditStatus === 'passed') {
      return (
        <div className="flex flex-col items-center pt-16 px-6">
          <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-5 text-success">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">认证通过</h2>
          <p className="text-base text-gray-500 dark:text-gray-400 text-center mb-10 leading-relaxed">恭喜您，实名认证已通过！现在您可以体验全部平台功能了。</p>
          <button className="w-full h-[48px] rounded-2xl bg-gradient-to-r from-brand-start to-brand-end text-white font-medium shadow-sm active:opacity-80 transition-opacity" onClick={handleBack}>完成</button>
        </div>
      );
    }
    if (auditStatus === 'rejected') {
      return (
        <div className="flex flex-col items-center pt-16 px-6">
          <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-5 text-brand-start">
            <XCircle size={40} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">认证驳回</h2>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-10 w-full border border-gray-100 dark:border-gray-700">
            <p className="text-base text-gray-900 dark:text-gray-100 mb-1.5 font-medium">驳回原因：</p>
            <p className="text-base text-brand-start leading-relaxed">身份证件照片模糊，无法清晰辨认证件号码，请重新拍摄上传。</p>
          </div>
          <button className="w-full h-[48px] rounded-2xl bg-gradient-to-r from-brand-start to-brand-end text-white font-medium shadow-sm active:opacity-80 mb-3 transition-opacity" onClick={() => setAuditStatus('none')}>重新提交</button>
          <button className="w-full h-[48px] rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-medium active:bg-gray-50 dark:active:bg-gray-800 transition-colors" onClick={handleBack}>返回</button>
        </div>
      );
    }
    return null;
  };

  const renderForm = () => (
    <div className="px-4 space-y-4 pb-24">
      {/* Info Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm dark:shadow-none border border-transparent dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">1. 身份信息</h3>
        <div className="space-y-4">
          <div>
            <input 
              type="text" 
              placeholder="请输入真实姓名" 
              className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-800 rounded-2xl text-md text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#FF4142] transition-all border border-transparent dark:border-gray-700" 
              value={name} 
              onChange={e => setName(e.target.value)} 
            />
          </div>
          <div>
            <input 
              type="text" 
              placeholder="请输入身份证号" 
              className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-800 rounded-2xl text-md text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#FF4142] transition-all border border-transparent dark:border-gray-700" 
              value={idNumber} 
              onChange={e => setIdNumber(e.target.value)} 
            />
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500 flex items-center"><AlertCircle size={12} className="mr-1" /> 请确保填写信息与证件一致</p>
        </div>
      </div>

      {/* Upload Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm dark:shadow-none border border-transparent dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">2. 证件上传</h3>
        <div className="flex space-x-3 mb-4">
          <div 
            className="flex-1 aspect-[1.6/1] bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center relative overflow-hidden cursor-pointer active:opacity-80 transition-opacity"
            onClick={handleUploadFront}
          >
            {idFront ? (
              <>
                <img src={idFront} className="w-full h-full object-cover" alt="身份证正面" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <span className="text-white text-sm">点击重传</span>
                </div>
              </>
            ) : (
              <>
                <Camera size={24} className="text-gray-400 dark:text-gray-500 mb-2" />
                <span className="text-sm text-gray-500 dark:text-gray-400">上传人像面</span>
              </>
            )}
          </div>
          <div 
            className="flex-1 aspect-[1.6/1] bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center relative overflow-hidden cursor-pointer active:opacity-80 transition-opacity"
            onClick={handleUploadBack}
          >
            {idBack ? (
              <>
                <img src={idBack} className="w-full h-full object-cover" alt="身份证反面" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <span className="text-white text-sm">点击重传</span>
                </div>
              </>
            ) : (
              <>
                <Camera size={24} className="text-gray-400 dark:text-gray-500 mb-2" />
                <span className="text-sm text-gray-500 dark:text-gray-400">上传国徽面</span>
              </>
            )}
          </div>
        </div>
        <p className="text-s text-gray-400 dark:text-gray-500 leading-relaxed">仅用于本次实名认证，平台将严格保密您的信息。请确保照片清晰、无反光、无遮挡。</p>
      </div>

      {/* Face Auth Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm dark:shadow-none border border-transparent dark:border-gray-800">
        <div className="flex items-center mb-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">3. 人脸核验</h3>
          <span className="text-s font-normal text-gray-400 dark:text-gray-500 ml-1">（网易易盾服务）</span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">用于提升账户安全等级，满足国家相关合规要求。</p>
        
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-5 flex justify-around border border-gray-100 dark:border-gray-800">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center mb-2 text-gray-600 dark:text-gray-400 shadow-sm"><Sun size={18} /></div>
            <span className="text-s text-gray-500 dark:text-gray-400">光线充足</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center mb-2 text-gray-600 dark:text-gray-400 shadow-sm"><User size={18} /></div>
            <span className="text-s text-gray-500 dark:text-gray-400">摘下帽/口罩</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center mb-2 text-gray-600 dark:text-gray-400 shadow-sm"><Wifi size={18} /></div>
            <span className="text-s text-gray-500 dark:text-gray-400">网络稳定</span>
          </div>
        </div>

        {faceVerified ? (
          <div className="h-[48px] rounded-2xl bg-green-50 dark:bg-green-900/20 text-success flex items-center justify-center text-lg font-medium border border-green-200 dark:border-green-800/50">
            <CheckCircle2 size={18} className="mr-2" /> 核验成功
          </div>
        ) : (
          <button 
            className="w-full h-[48px] rounded-2xl bg-gradient-to-r from-brand-start to-brand-end text-white text-lg font-medium flex items-center justify-center shadow-sm active:opacity-80 transition-opacity"
            onClick={handleFaceAuth}
          >
            开始人脸核验
          </button>
        )}
        
        <div className="mt-4 text-center">
          <button className="text-sm text-gray-400 dark:text-gray-500 active:text-gray-600 dark:active:text-gray-300 dark:text-gray-600 flex items-center justify-center w-full transition-colors">
            核验遇到问题？ <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col bg-[#FFF8F8] dark:bg-gray-950 relative h-full overflow-hidden">
      

      {renderHeader()}
      
      <div className="flex-1 overflow-y-auto no-scrollbar relative">
        {loading ? renderSkeleton() : error ? renderError() : (
          <>
            {renderStepBar()}
            {auditStatus === 'none' ? renderForm() : renderResult()}
          </>
        )}
      </div>

      {/* Fixed Bottom Button for Form */}
      {auditStatus === 'none' && !loading && !error && (
        <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-4 py-3 pb-safe z-40">
          <button 
            className={`w-full h-[48px] rounded-2xl text-lg font-medium transition-all ${canSubmit ? 'bg-gradient-to-r from-brand-start to-brand-end text-white shadow-sm active:opacity-80' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'}`}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            提交审核
          </button>
        </div>
      )}

      {/* Face Auth Failed Modal */}
      {showFaceFailModal && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowFaceFailModal(false)}></div>
          <div className="w-full max-w-[320px] bg-white dark:bg-gray-900 rounded-3xl relative z-10 p-6 flex flex-col items-center animate-in fade-in zoom-in duration-200 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-brand-start mb-4">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">人脸核验失败</h3>
            <p className="text-base text-gray-500 dark:text-gray-400 text-center mb-6 leading-relaxed">未检测到清晰人脸，请确保光线充足且未佩戴口罩/帽子。</p>
            <div className="flex flex-col w-full space-y-3">
              <button 
                className="w-full h-[44px] rounded-full bg-gradient-to-r from-brand-start to-brand-end text-white text-lg font-medium shadow-sm active:opacity-80 transition-opacity"
                onClick={() => {
                  setShowFaceFailModal(false);
                  setFaceVerified(true); // Auto success on retry for demo
                }}
              >
                重试核验
              </button>
              <button 
                className="w-full h-[44px] rounded-full border border-[#FF4142] text-brand-start text-lg font-medium active:bg-red-50 dark:active:bg-red-900/20 transition-colors"
                onClick={() => setShowFaceFailModal(false)}
              >
                联系客服
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Permission Failed Modal */}
      {showCameraFailModal && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCameraFailModal(false)}></div>
          <div className="w-full max-w-[320px] bg-white dark:bg-gray-900 rounded-3xl relative z-10 p-6 flex flex-col items-center animate-in fade-in zoom-in duration-200 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500 mb-4">
              <Camera size={24} />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">无法访问相机</h3>
            <p className="text-base text-gray-500 dark:text-gray-400 text-center mb-6 leading-relaxed">请在系统设置中允许应用访问您的相机权限，以便进行证件拍摄和人脸核验。</p>
            <div className="flex w-full space-x-3">
              <button 
                className="flex-1 h-[44px] rounded-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-lg font-medium active:bg-gray-200 dark:active:bg-gray-700 transition-colors"
                onClick={() => setShowCameraFailModal(false)}
              >
                取消
              </button>
              <button 
                className="flex-1 h-[44px] rounded-full bg-gradient-to-r from-brand-start to-brand-end text-white text-lg font-medium shadow-sm active:opacity-80 transition-opacity"
                onClick={() => setShowCameraFailModal(false)}
              >
                去设置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
