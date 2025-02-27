import { writable, derived, get } from 'svelte/store';
import { nanoid } from 'nanoid';
import { inboxStore } from './inboxStore.js';
import { walletStore } from './wallet.js';
import { ipfsUpload, ipfsDownload } from '../services/ipfs.js';
import { sendMemoTransaction } from '../services/solana.js';
import { submitToCelestia, verifyCelestiaData } from '../services/celestia.js';
import { createFileVerification, verifyProof } from '../services/zk.js';

const initialState = {
  selectedFile: null,
  transferStatus: 'idle',
  ipfsHash: null,
  celestiaHeight: null,
  celestiaTxHash: null,
  celestiaUrl: null,
  zkProofData: null,
  isUsingCelestia: false,
  isUsingZKP: false,
  transferHistory: [],
  error: null
};

function createFileStore() {
  const { subscribe, set, update } = writable(initialState);

  return {
    subscribe,
    
    selectFile: (file) => update(state => ({
      ...state,
      selectedFile: file,
      transferStatus: 'idle',
      ipfsHash: null,
      celestiaHeight: null,
      celestiaTxHash: null,
      celestiaUrl: null,
      zkProofData: null
    })),
    
    reset: () => update(state => ({
      ...state,
      selectedFile: null,
      transferStatus: 'idle',
      ipfsHash: null,
      celestiaHeight: null,
      celestiaTxHash: null,
      celestiaUrl: null,
      zkProofData: null
    })),
    
    toggleCelestia: (useIt) => update(state => ({
      ...state,
      isUsingCelestia: useIt
    })),
    
    toggleZKP: (useIt) => update(state => ({
      ...state,
      isUsingZKP: useIt
    })),
    
    transferFile: async (recipient, message = '') => {
      const state = get({ subscribe });
      const { selectedFile } = state;
      
      if (!selectedFile) {
        return update(s => ({ ...s, error: 'No file selected' }));
      }
      
      update(s => ({ ...s, transferStatus: 'uploading', error: null }));
      
      try {
        console.log('Uploading file to IPFS...');
        const ipfsResult = await ipfsUpload(selectedFile);
        const cid = ipfsResult.cid;
        console.log('IPFS CID:', cid);
        
        let celestiaData = null;
        let zkProofData = null;
        
        if (state.isUsingCelestia) {
          console.log('Sending file to Celestia...');
          try {
            celestiaData = await submitToCelestia(cid.toString());
            console.log('Celestia data submission successful:', celestiaData);
          } catch (celestiaError) {
            console.error('Celestia error:', celestiaError);
            throw new Error(`Celestia submission failed: ${celestiaError.message}`);
          }
        }
        
        if (state.isUsingZKP) {
          console.log('Creating ZK Proof...');
          try {
            const secret = `${selectedFile.name}-${selectedFile.size}-${nanoid()}`;
            
            const verificationResult = await createFileVerification(cid.toString(), secret);
            
            if (verificationResult.isValid) {
              zkProofData = verificationResult.verificationData;
              console.log('ZK Proof created successfully:', zkProofData);
            } else {
              throw new Error(`ZK Proof creation failed: ${verificationResult.error}`);
            }
          } catch (zkError) {
            console.error('ZK Proof creation error:', zkError);
            throw new Error(`ZK Proof creation failed: ${zkError.message}`);
          }
        }
        
        const transferId = nanoid();
        const currentTime = new Date().toISOString();
        const sender = get(walletStore).publicKey || 'unknown';
        
        const transferRecord = {
          id: transferId,
          file: {
            name: selectedFile.name,
            size: selectedFile.size,
            type: selectedFile.type
          },
          ipfs: { cid },
          ipfsHash: cid.toString(),
          celestia: celestiaData,
          zkProof: zkProofData ? {
            timestamp: zkProofData.timestamp,
            verified: zkProofData.isValid !== false
          } : null,
          recipient,
          sender,
          message,
          timestamp: currentTime
        };
        
        update(s => ({
          ...s,
          transferStatus: 'uploaded',
          ipfsHash: cid,
          celestiaHeight: celestiaData?.height || null,
          celestiaTxHash: celestiaData?.txhash || null,
          celestiaUrl: celestiaData?.celestiaUrl || null,
          zkProofData,
          transferHistory: [transferRecord, ...s.transferHistory]
        }));
        
        try {
          console.log(`Alıcı ${recipient} için inbox'a mesaj ekleniyor...`);
          
          const inboxMessage = {
            ipfsCid: cid.toString(),
            ipfsUrl: `https://ipfs.io/ipfs/${cid}`,
            celestiaHeight: celestiaData?.height,
            celestiaTxHash: celestiaData?.txhash,
            celestiaUrl: celestiaData?.celestiaUrl,
            celestiaNamespace: celestiaData?.namespace,
            fileName: selectedFile.name,
            fileSize: selectedFile.size,
            fileType: selectedFile.type,
            senderAddress: sender,
            message: message,
            transactionUrl: celestiaData?.celestiaUrl || `https://ipfs.io/ipfs/${cid}`,
            zkProofAvailable: zkProofData ? true : false,
            zkProofTimestamp: zkProofData?.timestamp,
            timestamp: currentTime
          };
          
          inboxStore.addMessage(recipient, inboxMessage);
          console.log('Inbox mesajı eklendi:', inboxMessage);
          
          const currentWallet = get(walletStore).publicKey;
          if (currentWallet && currentWallet === recipient) {
            console.log('Alıcı aktif kullanıcı, inbox güncelleniyor...');
            inboxStore.fetchFromCelestia(recipient);
          }
        } catch (inboxError) {
          console.error('Inbox mesajı eklenirken hata:', inboxError);
        }
        
        return transferRecord;
      } catch (error) {
        console.error('Transfer error:', error);
        update(s => ({ 
          ...s, 
          transferStatus: 'error', 
          error: error.message || 'Unknown error occurred' 
        }));
        throw error;
      }
    },
    
    downloadFile: async (cid, filename) => {
      try {
        await ipfsDownload(cid, filename);
        return true;
      } catch (error) {
        console.error('Download error:', error);
        update(s => ({ ...s, error: error.message }));
        throw error;
      }
    },
    
    verifyCelestiaData: async (height, cid) => {
      try {
        const result = await verifyCelestiaData(height, cid);
        return result;
      } catch (error) {
        console.error('Celestia verification error:', error);
        throw new Error(`Celestia verification failed: ${error.message}`);
      }
    },
    
    verifyZkProof: async (proof, publicSignals, expectedCid) => {
      try {
        const isValid = await verifyProof(proof, publicSignals, expectedCid);
        return { isValid };
      } catch (error) {
        console.error('ZK verification error:', error);
        throw new Error(`ZK verification failed: ${error.message}`);
      }
    }
  };
}

export const fileStore = createFileStore();