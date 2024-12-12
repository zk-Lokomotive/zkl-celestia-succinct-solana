/// <reference types="svelte" />
/// <reference types="vite/client" />

interface Window {
  solflare?: {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected: boolean;
    publicKey: { toString(): string };
    signTransaction(transaction: any): Promise<any>;
  }
}
