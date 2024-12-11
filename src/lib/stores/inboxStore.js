import { writable, derived } from 'svelte/store';
import { walletStore } from './wallet.js';

const createInboxStore = () => {
  const { subscribe, set, update } = writable({
    messages: {}
  });

  return {
    subscribe,
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

      return store;
    }),
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
    deleteMessage: (address, messageId) => update(store => {
      if (store.messages[address]) {
        store.messages[address] = store.messages[address].filter(
          msg => msg.id !== messageId
        );
      }
      return store;
    })
  };
};

export const inboxStore = createInboxStore();