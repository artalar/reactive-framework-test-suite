export interface ReactiveFramework {
  name: string;
  signal<T>(initialValue: T): Signal<T>;
  computed<T>(fn: () => T): Computed<T>;
  effect(fn: () => void | (() => void)): () => void;
  run<T>(fn: () => T): T;
  batch?(fn: () => void): void;
  untracked?<T>(fn: () => T): T;
  effectScope?(fn: () => void): () => void;
  signalWithEquals?<T>(
    initialValue: T,
    equals: (a: T, b: T) => boolean
  ): Signal<T>;
  computedWithEquals?<T>(
    fn: () => T,
    equals: (a: T, b: T) => boolean
  ): Computed<T>;
}

export interface Signal<T> {
  read(): T;
  write(v: T): void;
}

export interface Computed<T> {
  read(): T;
}

export class SkipTest {
  constructor(public reason: string) {}
}
