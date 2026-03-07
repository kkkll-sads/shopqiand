import React, { Suspense, useEffect } from 'react';
import { LoadingSpinner } from '@/components/common';
import { clearChunkLoadRecoveryState } from '@/utils/chunkLoadRecovery';

type LazyComponentProps = {
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  props?: Record<string, unknown>;
};

const LazyComponentContent: React.FC<LazyComponentProps> = ({ component: Component, props = {} }) => {
  useEffect(() => {
    clearChunkLoadRecoveryState();
  }, []);

  return <Component {...props} />;
};

const LazyComponent: React.FC<LazyComponentProps> = ({ component: Component, props = {} }) => (
  <Suspense
    fallback={
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    }
  >
    <LazyComponentContent component={Component} props={props} />
  </Suspense>
);

export default LazyComponent;
