import { writable, derived, get } from 'svelte/store';
import { walletStore } from './wallet.js';
import { getDataFromCelestia, getAllCelestiaTransactions } from '../services/celestia.js';

// New properties to be added to inbox state
const initialState = {
  messages: {},
  lastFetch: null,
  isFetching: false,
  error: null
};

const createInboxStore = () => {
  const { subscribe, set, update } = writable(initialState);

  return {
    subscribe,
    
    // Add file message
    addMessage: (recipientAddress, message) => update(store => {
      // Initialize messages array for recipient if it doesn't exist
      if (!store.messages[recipientAddress]) {
        store.messages[recipientAddress] = [];
      }

      // Add message to recipient's inbox
      store.messages[recipientAddress].push({
        ...message,
        id: crypto.randomUUID()
      });

      // Save messages to localStorage (for persistence)
      try {
        localStorage.setItem('inbox_messages', JSON.stringify(store.messages));
      } catch (e) {
        console.error('Error while saving inbox information:', e);
      }

      return store;
    }),
    
    // Get messages for user
    getMessagesForUser: (address) => derived(
      { subscribe },
      $store => {
        // Return messages for the specified address, sorted by timestamp
        const messages = $store.messages[address] || [];
        return [...messages].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      }
    ),
    
    // Delete message
    deleteMessage: (address, messageId) => update(store => {
      if (store.messages[address]) {
        store.messages[address] = store.messages[address].filter(
          msg => msg.id !== messageId
        );
        
        // Update localStorage as well
        try {
          localStorage.setItem('inbox_messages', JSON.stringify(store.messages));
        } catch (e) {
          console.error('Error updating inbox messages:', e);
        }
      }
      return store;
    }),
    
    // Load messages from localStorage
    loadFromLocalStorage: () => update(store => {
      try {
        const savedMessages = localStorage.getItem('inbox_messages');
        if (savedMessages) {
          const parsed = JSON.parse(savedMessages);
          return { ...store, messages: parsed };
        }
      } catch (e) {
        console.error('Error loading inbox messages:', e);
      }
      return store;
    }),
    
    // Fetch messages from Celestia
    fetchFromCelestia: async (address) => {
      if (!address) return;
      
      // Update status: fetching
      update(store => ({ ...store, isFetching: true, error: null }));
      
      try {
        console.log(`Fetching messages for ${address} from Celestia...`);
        
        // 1. Get all Celestia transactions
        const transactions = await getAllCelestiaTransactions();
        console.log('Celestia transactions received:', transactions);
        
        // 2. Filter transactions sent to this address
        const userTransactions = transactions.filter(tx => 
          tx.recipient === address
        );
        
        if (userTransactions.length === 0) {
          console.log(`No messages found in Celestia for ${address}`);
          update(store => ({ ...store, isFetching: false, lastFetch: new Date() }));
          return;
        }
        
        console.log(`Found ${userTransactions.length} transactions for ${address}`);
        
        // 3. For each transaction, fetch data from Celestia and add to inbox
        for (const tx of userTransactions) {
          try {
            // Get IPFS CID directly from sender transaction
            const ipfsCid = tx.ipfsHash;
            const celestiaHeight = tx.height;
            
            // Check if a message with this CID already exists in user's inbox
            const existingMessages = get({ subscribe }).messages[address] || [];
            const alreadyExists = existingMessages.some(msg => 
              msg.ipfsCid === ipfsCid && msg.celestiaHeight === celestiaHeight
            );
            
            if (alreadyExists) {
              console.log(`Message already exists in inbox: ${ipfsCid}`);
              continue;
            }
            
            // Fetch data in detail from Celestia
            const celestiaData = tx.namespace 
              ? await getDataFromCelestia(celestiaHeight, tx.namespace)
              : null;
            
            console.log('Celestia data details:', celestiaData);
            
            // Add to inbox
            const message = {
              id: crypto.randomUUID(),
              ipfsCid: ipfsCid,
              ipfsUrl: `https://ipfs.io/ipfs/${ipfsCid}`,
              celestiaHeight: celestiaHeight,
              celestiaUrl: `https://celenium.io/${celestiaHeight}/${tx.namespace}`,
              senderAddress: tx.sender || 'Unknown',
              fileName: tx.file?.name || 'File',
              fileSize: tx.file?.size || 0,
              fileType: tx.file?.type || 'application/octet-stream',
              message: tx.message || '',
              timestamp: tx.timestamp || new Date().toISOString()
            };
            
            console.log('Message added to inbox:', message);
            
            // Update store
            update(store => {
              // Create field for recipient
              if (!store.messages[address]) {
                store.messages[address] = [];
              }
              
              // Add message
              store.messages[address].push(message);
              
              // Save to localStorage
              try {
                localStorage.setItem('inbox_messages', JSON.stringify(store.messages));
              } catch (e) {
                console.error('Inbox update error:', e);
              }
              
              return store;
            });
          } catch (txError) {
            console.error(`Error adding transaction to inbox:`, txError);
          }
        }
        
        // 4. Update last check
        update(store => ({
          ...store, 
          isFetching: false,
          lastFetch: new Date()
        }));
        
      } catch (error) {
        console.error('Error fetching data from Celestia:', error);
        update(store => ({ 
          ...store, 
          isFetching: false, 
          error: error.message 
        }));
      }
    },
    
    // Auto-update inbox
    startAutoFetch: (address, intervalMs = 60000) => {
      if (!address) return null;
      
      // Make first call
      inboxStore.fetchFromCelestia(address);
      
      // Set interval for periodic check
      const intervalId = setInterval(() => {
        inboxStore.fetchFromCelestia(address);
      }, intervalMs);
      
      return intervalId; // Return interval ID to be able to stop it
    }
  };
};

export const inboxStore = createInboxStore();

// Load messages from localStorage at application start
inboxStore.loadFromLocalStorage();