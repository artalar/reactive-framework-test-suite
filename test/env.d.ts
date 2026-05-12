/// <reference types="vitest/importMeta" />

interface ImportMeta {
  dirname: string;
}

declare module "fs" {
  export function mkdirSync(path: string, options?: { recursive?: boolean }): void;
  export function writeFileSync(path: string, data: string): void;
}

declare module "path" {
  export function join(...paths: string[]): string;
}

declare module "pota" {
  export const createSignal: any;
  export const memo: any;
  export const effect: any;
  export const batch: any;
  export const root: any;
  export const cleanup: any;
  export const untrack: any;
}

declare module "solid-js/dist/solid.cjs" {
  export const createSignal: any;
  export const createMemo: any;
  export const createComputed: any;
  export const createRoot: any;
  export const batch: any;
  export const untrack: any;
  export const onCleanup: any;
}
