export interface ReactiveFramework {
  name: string;
  signal<T>(initialValue: T): Signal<T>;
  computed<T>(fn: () => T): Computed<T>;
  effect(fn: () => void | (() => void)): () => void;
  run<T>(fn: () => T): T;
  batch?(fn: () => void): void;
  untracked?<T>(fn: () => T): T;


  effectCleanup?: boolean;
  /** Errors thrown inside computed propagate via .read() (lazy frameworks). Eager frameworks throw at creation time. */
  computedThrows?: boolean;
  /** Called after each test to recover from corrupted global state (e.g. throw during stabilize) */
  afterEach?(): void;
}

export interface Signal<T> {
  read(): T;
  write(v: T): void;
}

export interface Computed<T> {
  read(): T;
}

export class SkipTest extends Error {
  constructor(public reason: string) {
    super(reason);
  }
}
