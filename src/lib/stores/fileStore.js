import { writable, get } from 'svelte/store';
import { inboxStore } from './inboxStore.js';
import { walletStore } from './wallet.js';
import { uploadToIPFS } from '../services/ipfs.js';
import { sendMemoTransaction } from '../services/solana.js';

const initialState = {
  selectedFile: null,
  ipfsHash: null,
  transferStatus: null,
  recipientAddress: '',
  message: '',
  error: null,
  isUploading: false
};

function createFileStore() {
  const { subscribe, set, update } = writable(initialState);

  return {
    subscribe,
    reset: () => set(initialState),
    setError: (error) => update(store => ({ ...store, error })),
    uploadFile: async (file) => {
      update(store => ({ ...store, isUploading: true, error: null }));
      
      try {
        const ipfsHash = await uploadToIPFS(file);
        
        update(store => ({
          ...store,
          selectedFile: file,
          ipfsHash,
          isUploading: false
        }));

        return ipfsHash;
      } catch (error) {
        const errorMessage = error.message || 'Failed to upload file';
        update(store => ({
          ...store,
          error: errorMessage,
          isUploading: false
        }));
        throw new Error(errorMessage);
      }
    },
    transferFile: async (recipientAddress, message) => {
      update(store => ({ ...store, transferStatus: 'pending', error: null }));

      try {
        const { ipfsHash, selectedFile } = get({ subscribe });
        const wallet = get(walletStore);

        // Send transaction to Solana
        const signature = await sendMemoTransaction(
          wallet,
          recipientAddress,
          ipfsHash
        );

        // Add message to recipient's inbox
        inboxStore.addMessage(recipientAddress, {
          ipfsHash,
          message,
          senderAddress: wallet.publicKey,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          transactionSignature: signature
        });

        update(store => ({
          ...store,
          transferStatus: 'completed',
          recipientAddress,
          message
        }));

        return true;
      } catch (error) {
        const errorMessage = error.message || 'Failed to transfer file';
        update(store => ({
          ...store,
          transferStatus: 'failed',
          error: errorMessage
        }));
        throw new Error(errorMessage);
      }
    },
    setRecipient: (address) => update(store => ({ 
      ...store, 
      recipientAddress: address 
    })),
    setMessage: (text) => update(store => ({ 
      ...store, 
      message: text 
    }))
  };
}

export const fileStore = createFileStore();