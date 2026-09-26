import { useEffect, useRef } from 'react';
import type { Observable } from 'rxjs';

/**
 * Subscribes `handler` to `observable$` for the lifetime of the component.
 * The React equivalent of the Angular components' common
 * `eventService.listenForX().pipe(takeUntil(this.destroy$)).subscribe(...)`
 * pattern — no destroy$ Subject needed, useEffect's cleanup does the same job.
 *
 * `handler` is read via a ref so passing an inline arrow function (the
 * common case) doesn't resubscribe on every render — only a change of
 * `observable$` itself does.
 */
export function useEventEffect<T>(observable$: Observable<T>, handler: (value: T) => void) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const subscription = observable$.subscribe((value) => handlerRef.current(value));
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [observable$]);
}
