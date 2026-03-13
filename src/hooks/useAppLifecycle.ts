import { useEffect, useEffectEvent, useRef } from 'react';
import { useAppLifecycle as useAppLifecycleSnapshot } from '../lib/appLifecycle';

export { useAppLifecycle } from '../lib/appLifecycle';

export function useAppResumeEffect(callback: () => void) {
  const onResume = useEffectEvent(callback);
  const { appState, lastUpdatedAt } = useAppLifecycleSnapshot();
  const previousAppStateRef = useRef(appState);

  useEffect(() => {
    if (previousAppStateRef.current !== 'active' && appState === 'active') {
      onResume();
    }

    previousAppStateRef.current = appState;
  }, [appState, lastUpdatedAt, onResume]);
}
