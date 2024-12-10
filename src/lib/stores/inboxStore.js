import { writable, derived } from 'svelte/store';
import { walletStore } from './wallet.js';

const createInboxStore = () => {
  const { subscribe, set, update } = writable({
    messages: {}
  });

  return {
    subscribe,
    addMessage: (recipientAddress, message) => update(store => {
      if (!store.messages[recipientAddress]) {
        store.messages[recipientAddress] = [];
      }
      store.messages[recipientAddress].push({
        ...message,
        timestamp: new Date().toISOString(),
        id: crypto.randomUUID()
      });
      return store;
    }),
    getMessagesForUser: (address) => derived(
      { subscribe },
      $store => $store.messages[address] || []
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