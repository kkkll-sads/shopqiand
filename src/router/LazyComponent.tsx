import React, { Suspense } from 'react';
import { LoadingSpinner } from '@/components/common';

type LazyComponentProps = {
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  props?: Record<string, unknown>;
};

const LazyComponent: React.FC<LazyComponentProps> = ({ component: Component, props = {} }) => (
  <Suspense
    fallback={
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    }
  >
    <Component {...props} />
  </Suspense>
);

export default LazyComponent;
