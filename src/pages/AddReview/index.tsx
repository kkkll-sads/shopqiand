import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Star, Camera, X, AlertCircle, RefreshCcw, WifiOff, CheckCircle2, Loader2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAppNavigate } from '../../lib/navigation';
import { PageHeader } from '../../components/layout/PageHeader';

// Mock Data
const MOCK_PRODUCT = {
  id: 'p1',
  title: 'Apple iPhone 15 Pro (A3104) 256GB 原色钛金属 支持移动联通电信5G 双卡双待手机',
  image: 'https://picsum.photos/seed/iphone15/100/100',
  sku: '原色钛金属, 256GB',
};

const QUICK_TAGS = [
  '质量好', '物流快', '服务好', '包装严实', '正品行货', '性价比高', '外观漂亮'
];

type PageState = 'loading' | 'error' | 'normal';
type ImageStatus = 'uploading' | 'success' | 'error';

interface UploadImage {
  id: string;
  url: string;
  status: ImageStatus;
}

export default function AddReviewPage() {
  const { goTo, goBack } = useAppNavigate();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [images, setImages] = useState<UploadImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Simulate initial loading
    const timer = setTimeout(() => {
      setPageState('normal');
    }, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(timer);
    };
  }, []);

  const handleBack = () => {
    goBack();
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages = Array.from(files).slice(0, 9 - images.length).map((file: File) => {
      const id = Math.random().toString(36).substring(7);
      const url = URL.createObjectURL(file);
      return { id, url, status: 'uploading' as ImageStatus };
    });

    setImages(prev => [...prev, ...newImages]);

    // Simulate upload process for each image
    newImages.forEach(img => {
      setTimeout(() => {
        setImages(prev => prev.map(p => {
          if (p.id === img.id) {
            // Randomly fail some uploads for demonstration
            const isError = Math.random() > 0.8;
            return { ...p, status: isError ? 'error' : 'success' };
          }
          return p;
        }));
      }, 1500 + Math.random() * 1000);
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const retryUpload = (id: string) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, status: 'uploading' } : img
    ));
    setTimeout(() => {
      setImages(prev => prev.map(img => 
        img.id === id ? { ...img, status: 'success' } : img
      ));
    }, 1500);
  };

  const handleSubmit = () => {
    if (rating === 0) {
      alert('请先选择星级评分');
      return;
    }
    
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      alert('评价发表成功！');
      handleBack();
    }, 2000);
  };

  if (pageState === 'error') {
    return (
      <div className="min-h-screen bg-bg-main flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 text-text-sub mb-4" />
        <p className="text-text-main mb-4">加载失败，请重试</p>
        <button 
          onClick={() => setPageState('loading')}
          className="flex items-center px-4 py-2 border border-border-main rounded-full text-text-main active:bg-bg-sub"
        >
          <RefreshCcw size={16} className="mr-2" />
          重新加载
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-sub flex flex-col pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-border-light">
        <div className="flex items-center justify-between px-4 h-11">
          <button onClick={handleBack} className="p-1 -ml-1 active:opacity-70">
            <ChevronLeft size={24} className="text-text-main" />
          </button>
          <h1 className="text-2xl font-medium text-text-main">发表评价</h1>
          <div className="w-8"></div> {/* Placeholder for balance */}
        </div>
        {isOffline && (
          <div className="bg-red-50 text-primary-start text-sm py-2 px-4 flex items-center justify-center">
            <WifiOff size={14} className="mr-1" />
            网络连接已断开，请检查网络设置
          </div>
        )}
      </div>

      {pageState === 'loading' ? (
        <div className="p-4 space-y-4">
          <Card className="p-4 flex space-x-3">
            <Skeleton className="w-16 h-16 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="w-full h-4" />
              <Skeleton className="w-2/3 h-4" />
            </div>
          </Card>
          <Card className="p-4 space-y-4">
            <Skeleton className="w-32 h-6 mx-auto" />
            <div className="flex justify-center space-x-4">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="w-8 h-8 rounded-full" />)}
            </div>
          </Card>
          <Card className="p-4 space-y-4">
            <Skeleton className="w-full h-32 rounded-lg" />
            <div className="flex space-x-2">
              <Skeleton className="w-20 h-20 rounded-lg" />
              <Skeleton className="w-20 h-20 rounded-lg" />
            </div>
          </Card>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          {/* Product Summary */}
          <Card className="p-3 flex items-center space-x-3">
            <img 
              src={MOCK_PRODUCT.image} 
              alt="Product" 
              className="w-12 h-12 rounded bg-bg-sub object-cover shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-md text-text-main truncate">{MOCK_PRODUCT.title}</h3>
              <p className="text-sm text-text-sub mt-1">{MOCK_PRODUCT.sku}</p>
            </div>
          </Card>

          {/* Rating Card */}
          <Card className="p-5 flex flex-col items-center">
            <div className="flex items-center space-x-4 mb-4">
              <span className="text-lg font-medium text-text-main">商品评分</span>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 active:scale-110 transition-transform"
                  >
                    <Star 
                      size={28} 
                      className={star <= rating ? "text-primary-start fill-primary-start" : "text-border-main"} 
                    />
                  </button>
                ))}
              </div>
              <span className="text-base text-text-sub w-8">
                {rating === 1 && '极差'}
                {rating === 2 && '较差'}
                {rating === 3 && '一般'}
                {rating === 4 && '良好'}
                {rating === 5 && '极好'}
              </span>
            </div>

            {/* Quick Tags */}
            {rating > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {QUICK_TAGS.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-primary-start/10 text-primary-start border border-primary-start/30'
                        : 'bg-bg-sub text-text-main border border-transparent'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Review Content & Images */}
          <Card className="p-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 500))}
              placeholder="宝贝满足你的期待吗？说说你的使用心得，分享给想买的他们吧"
              className="w-full h-32 text-md text-text-main placeholder:text-text-aux resize-none outline-none bg-transparent"
            />
            <div className="text-right text-sm text-text-aux mb-4">
              {content.length}/500
            </div>

            {/* Image Upload Grid */}
            <div className="grid grid-cols-3 gap-2">
              {images.map((img) => (
                <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden bg-bg-sub border border-border-light">
                  <img src={img.url} alt="Upload" className="w-full h-full object-cover" />
                  
                  {/* Remove Button */}
                  <button 
                    onClick={() => removeImage(img.id)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-white"
                  >
                    <X size={12} />
                  </button>

                  {/* Status Overlay */}
                  {img.status === 'uploading' && (
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white">
                      <Loader2 size={20} className="animate-spin mb-1" />
                      <span className="text-xs">上传中</span>
                    </div>
                  )}
                  {img.status === 'error' && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                      <AlertCircle size={20} className="text-red-400 mb-1" />
                      <span className="text-xs mb-1">上传失败</span>
                      <button 
                        onClick={() => retryUpload(img.id)}
                        className="text-xs bg-white dark:bg-gray-900/20 px-2 py-0.5 rounded"
                      >
                        重试
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Add Image Button */}
              {images.length < 9 && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-lg border border-dashed border-border-main flex flex-col items-center justify-center text-text-sub active:bg-bg-sub transition-colors"
                >
                  <Camera size={24} className="mb-1" />
                  <span className="text-xs">添加图片</span>
                  <span className="text-xs text-text-aux">{images.length}/9</span>
                </button>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              multiple 
              className="hidden" 
            />

            {/* Anonymous Switch */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border-light">
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setIsAnonymous(!isAnonymous)}
                  className="w-4 h-4 rounded-full border border-border-main flex items-center justify-center"
                >
                  {isAnonymous && <div className="w-2.5 h-2.5 bg-text-main rounded-full" />}
                </button>
                <span className="text-md text-text-main">匿名评价</span>
              </div>
              <span className="text-sm text-text-aux">你的评价将以匿名形式展现</span>
            </div>
          </Card>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-border-light p-2 pb-safe">
        <button
          onClick={handleSubmit}
          disabled={rating === 0 || isSubmitting || pageState !== 'normal'}
          className={`w-full h-10 rounded-full flex items-center justify-center text-lg font-medium transition-all ${
            rating === 0 || pageState !== 'normal'
              ? 'bg-bg-sub text-text-sub'
              : 'bg-gradient-to-r from-primary-start to-primary-end text-white active:opacity-90'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin mr-2" />
              提交中...
            </>
          ) : (
            '提交评价'
          )}
        </button>
      </div>

      {/* Dev Tools (Hidden in production) */}
      <div className="fixed bottom-20 right-4 flex flex-col gap-2 opacity-50 hover:opacity-100 transition-opacity z-50">
        <button onClick={() => setPageState('normal')} className="px-2 py-1 bg-black text-white text-xs rounded">Normal</button>
        <button onClick={() => setPageState('loading')} className="px-2 py-1 bg-black text-white text-xs rounded">Loading</button>
        <button onClick={() => setPageState('error')} className="px-2 py-1 bg-black text-white text-xs rounded">Error</button>
      </div>
    </div>
  );
}
