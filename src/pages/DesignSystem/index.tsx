/**
 * @file DesignSystem/index.tsx - UI 设计系统展示页面
 * @description 展示项目中使用的 UI 设计系统，包括颜色、排版、组件、标签、弹窗、底部导航、状态等。
 */

import React from 'react'; // React 核心
import { FileX, RefreshCcw, WifiOff } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { Tag } from '../../components/ui/Tag';
import { BottomTab } from '../../components/layout/BottomTab';

/**
 * DesignSystemPage - UI 设计系统展示页
 * 展示项目中所有基础 UI 组件和设计规范
 */
export const DesignSystemPage = () => {
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar bg-bg-base pb-20 z-10">
      <div className="p-4 space-y-8 pt-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-text-main">UI Design System</h1>
          <p className="text-sm text-text-sub mt-1">iOS Style / JD E-commerce Theme</p>
        </div>

        {/* Colors */}
        <section>
          <h2 className="text-3xl font-bold text-text-main mb-3">Colors</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-16 rounded-2xl bg-gradient-to-r from-primary-start to-primary-end flex items-end p-2 shadow-soft">
              <span className="text-white text-sm font-medium">Primary Gradient</span>
            </div>
            <div className="h-16 rounded-2xl bg-bg-base border border-border-light flex items-end p-2 shadow-soft">
              <span className="text-text-main text-sm font-medium">Bg Base</span>
            </div>
            <div className="h-16 rounded-2xl bg-bg-card border border-border-light flex items-end p-2 shadow-soft">
              <span className="text-text-main text-sm font-medium">Bg Card</span>
            </div>
            <div className="h-16 rounded-2xl bg-bg-card flex flex-col justify-end p-2 shadow-soft border border-border-light">
              <div className="flex space-x-1 mb-1">
                <div className="w-3 h-3 rounded-full bg-text-main"></div>
                <div className="w-3 h-3 rounded-full bg-text-sub"></div>
                <div className="w-3 h-3 rounded-full bg-text-aux"></div>
              </div>
              <span className="text-text-main text-sm font-medium">Text Colors</span>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section>
          <h2 className="text-3xl font-bold text-text-main mb-3">Typography</h2>
          <Card className="space-y-3">
            <div className="flex items-end justify-between">
              <span className="text-4xl font-bold text-text-main leading-none">Heading 1</span>
              <span className="text-sm text-text-aux">22pt</span>
            </div>
            <div className="h-[1px] bg-border-light"></div>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-medium text-text-main leading-none">Heading 2</span>
              <span className="text-sm text-text-aux">18pt</span>
            </div>
            <div className="h-[1px] bg-border-light"></div>
            <div className="flex items-end justify-between">
              <span className="text-lg text-text-main leading-none">Body Text</span>
              <span className="text-sm text-text-aux">15pt</span>
            </div>
            <div className="h-[1px] bg-border-light"></div>
            <div className="flex items-end justify-between">
              <span className="text-sm text-text-sub leading-none">Auxiliary Text</span>
              <span className="text-sm text-text-aux">12pt</span>
            </div>
          </Card>
        </section>

        {/* Components */}
        <section>
          <h2 className="text-3xl font-bold text-text-main mb-3">Components</h2>
          <div className="space-y-4">
            <Button>Primary Button (48px)</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Input placeholder="Input Field (Radius 20px)" />
            <Card>
              <h3 className="text-lg font-medium text-text-main mb-2">Card Component</h3>
              <p className="text-sm text-text-sub">Radius 16px, padding 16px, soft shadow.</p>
            </Card>
          </div>
        </section>

        {/* Tags */}
        <section>
          <h2 className="text-3xl font-bold text-text-main mb-3">Tags</h2>
          <div className="flex space-x-2">
            <Tag>Default Tag</Tag>
            <Tag variant="primary">Primary Tag</Tag>
          </div>
        </section>

        {/* Modal */}
        <section>
          <h2 className="text-3xl font-bold text-text-main mb-3">Modal</h2>
          <div className="relative bg-black/40 rounded-2xl h-[200px] flex items-center justify-center p-4">
            <div className="bg-bg-card w-full max-w-[280px] rounded-2xl p-5 shadow-2xl">
              <h3 className="text-3xl font-bold text-text-main text-center mb-2">提示</h3>
              <p className="text-lg text-text-sub text-center mb-5">确定要执行此操作吗？</p>
              <div className="flex space-x-3">
                <Button variant="secondary" className="h-[40px] text-lg">取消</Button>
                <Button className="h-[40px] text-lg">确定</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Tab */}
        <section>
          <h2 className="text-3xl font-bold text-text-main mb-3">Bottom Tab</h2>
          <div className="relative h-[83px] rounded-2xl overflow-hidden border border-border-light">
            <BottomTab />
          </div>
        </section>

        {/* States */}
        <section>
          <h2 className="text-3xl font-bold text-text-main mb-3">States</h2>
          <div className="space-y-4">
            {/* Skeleton */}
            <Card>
              <div className="flex space-x-3">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="flex-1 space-y-2 py-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </Card>

            {/* Empty */}
            <Card className="flex flex-col items-center justify-center py-8">
              <FileX size={48} className="text-text-aux mb-3 opacity-50" strokeWidth={1.5} />
              <p className="text-lg text-text-sub">暂无数据</p>
            </Card>

            {/* Error */}
            <Card className="flex flex-col items-center justify-center py-8">
              <RefreshCcw size={48} className="text-primary-start mb-3 opacity-80" strokeWidth={1.5} />
              <p className="text-lg text-text-main font-medium mb-1">加载失败</p>
              <p className="text-sm text-text-sub mb-4">请稍后重试</p>
              <Button variant="outline" className="h-[36px] w-24 text-sm rounded-full">重新加载</Button>
            </Card>

            {/* No Network */}
            <Card className="flex flex-col items-center justify-center py-8">
              <WifiOff size={48} className="text-text-aux mb-3 opacity-50" strokeWidth={1.5} />
              <p className="text-lg text-text-main font-medium mb-1">网络连接断开</p>
              <p className="text-sm text-text-sub mb-4">请检查网络设置</p>
              <Button variant="secondary" className="h-[36px] w-24 text-sm rounded-full">刷新</Button>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
};
