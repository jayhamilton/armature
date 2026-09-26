import { gsap } from 'gsap';

/**
 * Central home for GSAP motion so timings and easing stay consistent, and so
 * the reduced-motion check lives in exactly one place.
 *
 * Ported from armature-ui's AnimationService, trimmed to the enter/leave
 * fades gadgets actually use in React. The Angular original also drove a
 * GSAP Flip choreography (beginLayoutFlip/completeLayoutFlip) to animate
 * gadgets between old/new DOM positions across a layout change, plus a
 * window-'resize'-event + double appRef.tick() workaround specifically for
 * ngx-charts (no ResizeObserver of its own). Neither carries over: Recharts'
 * ResponsiveContainer already uses a ResizeObserver, so there is no resize
 * quirk to work around, and React's own reconciliation (components keyed by
 * gadget.instanceId) already smoothly relocates/unmounts across a layout
 * change without needing a manual before/after position capture.
 */
class AnimationServiceImpl {
  private readonly ENTER_DURATION = 0.32;
  private readonly LEAVE_DURATION = 0.22;
  private readonly STAGGER = 0.05;

  /**
   * Gadgets are created independently by their own host components, so
   * there is no single place that knows "this is the 3rd of 5". Any enters
   * landing within this window are treated as one batch and stepped, which
   * turns a board load into a stagger while a single add still animates
   * immediately.
   */
  private readonly STAGGER_WINDOW_MS = 60;

  private staggerIndex = 0;
  private lastEnterAt = 0;

  get prefersReducedMotion(): boolean {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }

  /** Fades and lifts a gadget into place. No-op under reduced motion. */
  gadgetEnter(element: HTMLElement | null): void {
    if (this.prefersReducedMotion || !element) return;

    const now = Date.now();
    this.staggerIndex = now - this.lastEnterAt < this.STAGGER_WINDOW_MS ? this.staggerIndex + 1 : 0;
    this.lastEnterAt = now;

    gsap.from(element, {
      opacity: 0,
      y: 12,
      duration: this.ENTER_DURATION,
      delay: this.staggerIndex * this.STAGGER,
      ease: 'power2.out',
      clearProps: 'opacity,transform',
    });
  }

  /**
   * Fades a gadget out. Resolves when the element is safe to remove, or
   * immediately under reduced motion so removal is never delayed.
   */
  gadgetLeave(element: HTMLElement | null): Promise<void> {
    if (this.prefersReducedMotion || !element) return Promise.resolve();

    return new Promise<void>((resolve) => {
      gsap.to(element, {
        opacity: 0,
        y: -8,
        scale: 0.98,
        duration: this.LEAVE_DURATION,
        ease: 'power2.in',
        onComplete: () => resolve(),
      });
    });
  }
}

export const animationService = new AnimationServiceImpl();
