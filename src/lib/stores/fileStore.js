import { writable, get } from 'svelte/store';
import { inboxStore } from './inboxStore.js';
import { walletStore } from './wallet.js';
import { uploadToIPFS } from '../services/ipfs.js';
import { sendMemoTransaction } from '../services/solana.js';

// Initial store state
const initialState = {
  selectedFile: null,
  ipfsHash: null,
  transferStatus: null,
  recipientAddress: '',
  message: '',
  error: null,
  isUploading: false,
  uploadProgress: 0
};

function createFileStore() {
  const { subscribe, set, update } = writable(initialState);

  return {
    subscribe,
    
    // Reset store to initial state
    reset: () => set(initialState),
    
    // Set error message
    setError: (error) => update(store => ({ ...store, error })),
    
    // Upload file to IPFS
    uploadFile: async (file) => {
      update(store => ({ 
        ...store, 
        isUploading: true, 
        error: null,
        uploadProgress: 0 
      }));
      
      try {
        // Upload to IPFS
        const ipfsHash = await uploadToIPFS(file);
        
        // Update store with successful upload
        update(store => ({
          ...store,
          selectedFile: file,
          ipfsHash,
          isUploading: false,
          uploadProgress: 100
        }));

        return ipfsHash;
      } catch (error) {
        console.error('Upload error:', error);
        const errorMessage = error.message || 'Failed to upload file';
        update(store => ({
          ...store,
          error: errorMessage,
          isUploading: false,
          uploadProgress: 0
        }));
        throw new Error(errorMessage);
      }
    },
    
    // Transfer file to recipient
    transferFile: async (recipientAddress, message) => {
      update(store => ({ 
        ...store, 
        transferStatus: 'pending', 
        error: null 
      }));

      try {
        const { ipfsHash, selectedFile } = get({ subscribe });
        const wallet = get(walletStore);

        if (!wallet.connected) {
          throw new Error('Wallet not connected');
        }

        if (!ipfsHash) {
          throw new Error('No file uploaded');
        }

        // Send Solana transaction with IPFS hash
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
          transactionSignature: signature,
          timestamp: new Date().toISOString()
        });

        // Update store with successful transfer
        update(store => ({
          ...store,
          transferStatus: 'completed',
          recipientAddress,
          message
        }));

        return true;
      } catch (error) {
        console.error('Transfer error:', error);
        const errorMessage = error.message || 'Failed to transfer file';
        update(store => ({
          ...store,
          transferStatus: 'failed',
          error: errorMessage
        }));
        throw new Error(errorMessage);
      }
    },
    
    // Update recipient address
    setRecipient: (address) => update(store => ({ 
      ...store, 
      recipientAddress: address 
    })),
    
    // Update message
    setMessage: (text) => update(store => ({ 
      ...store, 
      message: text 
    })),
    
    // Update upload progress
    setUploadProgress: (progress) => update(store => ({
      ...store,
      uploadProgress: progress
    }))
  };
}

export const fileStore = createFileStore();