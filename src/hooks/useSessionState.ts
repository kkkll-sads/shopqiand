import { useCallback, useEffect, useMemo, useState } from 'react';

interface UseSessionStateOptions<T> {
  deserialize?: (value: string) => T;
  serialize?: (value: T) => string;
}

type SetValue<T> = T | ((previousValue: T) => T);

function getDefaultDeserialize<T>(initialValue: T) {
  return (value: string) => JSON.parse(value) as T;
}

function getDefaultSerialize<T>() {
  return (value: T) => JSON.stringify(value);
}

export function useSessionState<T>(
  key: string,
  initialValue: T,
  options: UseSessionStateOptions<T> = {},
) {
  const deserialize = useMemo(
    () => options.deserialize ?? getDefaultDeserialize(initialValue),
    [initialValue, options.deserialize],
  );
  const serialize = useMemo(
    () => options.serialize ?? getDefaultSerialize<T>(),
    [options.serialize],
  );

  const readValue = useCallback(
    (targetKey: string) => {
      if (typeof window === 'undefined') {
        return initialValue;
      }

      const rawValue = window.sessionStorage.getItem(targetKey);
      if (rawValue === null) {
        return initialValue;
      }

      try {
        return deserialize(rawValue);
      } catch {
        return initialValue;
      }
    },
    [deserialize, initialValue],
  );

  const [state, setState] = useState(() => ({
    key,
    value: readValue(key),
  }));

  const value = state.key === key ? state.value : readValue(key);

  useEffect(() => {
    if (state.key !== key) {
      setState({ key, value });
    }
  }, [key, state.key, value]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.sessionStorage.setItem(key, serialize(value));
    } catch {
      // Ignore storage quota and privacy-mode failures.
    }
  }, [key, serialize, value]);

  const setValue = useCallback(
    (nextValue: SetValue<T>) => {
      setState((previousState) => {
        const previousValue =
          previousState.key === key ? previousState.value : readValue(key);
        const resolvedValue =
          typeof nextValue === 'function'
            ? (nextValue as (previousValue: T) => T)(previousValue)
            : nextValue;

        return {
          key,
          value: resolvedValue,
        };
      });
    },
    [key, readValue],
  );

  return [value, setValue] as const;
}
