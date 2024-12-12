/// <reference types="svelte" />
/// <reference types="vite/client" />

declare module '*.svelte' {
  import type { ComponentType } from 'svelte';
  const component: ComponentType;
  export default component;
}

interface Window {
  solflare?: {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected: boolean;
    publicKey: { toString(): string };
    signTransaction(transaction: any): Promise<any>;
  }
}
