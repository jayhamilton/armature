import { useEffect, useState } from 'react';
import type { Observable } from 'rxjs';

/**
 * Bridges an RxJS Observable (the service layer, ported near-verbatim from
 * the Angular app, still speaks RxJS) into React state. Mirrors what the
 * `| async` pipe did in templates: subscribes on mount, unsubscribes on
 * unmount, re-renders on every emission.
 */
export function useObservable<T>(observable$: Observable<T>, initialValue: T): T {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    const subscription = observable$.subscribe((next) => setValue(next));
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [observable$]);

  return value;
}

/**
 * Same as useObservable, but for a BehaviorSubject-backed observable where
 * you already have the current value synchronously (service.value) and want
 * to avoid a one-frame flash of a hardcoded initial value.
 */
export function useObservableValue<T>(observable$: Observable<T>, getCurrent: () => T): T {
  const [value, setValue] = useState<T>(getCurrent);

  useEffect(() => {
    const subscription = observable$.subscribe((next) => setValue(next));
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [observable$]);

  return value;
}
