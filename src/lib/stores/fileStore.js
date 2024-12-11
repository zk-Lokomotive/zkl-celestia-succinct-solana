import { writable, get } from 'svelte/store';
import { inboxStore } from './inboxStore.js';
import { walletStore } from './wallet.js';
import { uploadToIPFS, checkIPFSConnection } from '../services/ipfs.js';
import { sendMemoTransaction } from '../services/solana.js';

// Initial store state
const initialState = {
  selectedFile: null,
  ipfsHash: null,
  ipfsUrl: null,
  transferStatus: null,
  recipientAddress: '',
  message: '',
  error: null,
  isUploading: false,
  uploadProgress: 0,
  ipfsConnected: false
};

function createFileStore() {
  const { subscribe, set, update } = writable(initialState);

  // Check IPFS connection on store creation
  checkIPFSConnection().then(connected => {
    update(store => ({ ...store, ipfsConnected: connected }));
  });

  return {
    subscribe,
    reset: () => set(initialState),
    setError: (error) => update(store => ({ ...store, error })),
    
    uploadFile: async (file) => {
      update(store => ({ 
        ...store, 
        isUploading: true, 
        error: null,
        uploadProgress: 0 
      }));
      
      try {
        // Verify IPFS connection first
        const connected = await checkIPFSConnection();
        if (!connected) {
          throw new Error('IPFS node not available. Please ensure your local IPFS daemon is running.');
        }

        // Upload to local IPFS node
        const { cid, url } = await uploadToIPFS(file);
        
        update(store => ({
          ...store,
          selectedFile: file,
          ipfsHash: cid,
          ipfsUrl: url,
          isUploading: false,
          uploadProgress: 100
        }));

        return { cid, url };
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
    
    transferFile: async (recipientAddress, message) => {
      update(store => ({ 
        ...store, 
        transferStatus: 'pending', 
        error: null 
      }));

      try {
        const { ipfsHash, ipfsUrl, selectedFile } = get({ subscribe });
        const wallet = get(walletStore);

        if (!wallet.connected) {
          throw new Error('Wallet not connected');
        }

        if (!ipfsHash) {
          throw new Error('No file uploaded');
        }

        // Send Solana transaction with local IPFS URL
        const signature = await sendMemoTransaction(
          wallet,
          recipientAddress,
          ipfsUrl // Using local IPFS gateway URL
        );

        // Add message to recipient's inbox
        inboxStore.addMessage(recipientAddress, {
          ipfsHash,
          ipfsUrl,
          message,
          senderAddress: wallet.publicKey,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          transactionSignature: signature,
          timestamp: new Date().toISOString()
        });

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
    }
  };
}

export const fileStore = createFileStore();