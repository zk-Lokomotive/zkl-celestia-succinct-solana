import { writable, get } from 'svelte/store';

// User database store
const createUserDatabase = () => {
  const { subscribe, set, update } = writable({
    users: {},
    currentUser: null
  });

  return {
    subscribe,
    addUser: (walletAddress, userData) => update(db => {
      db.users[walletAddress] = {
        ...userData,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      db.currentUser = walletAddress;
      return db;
    }),
    login: (walletAddress) => update(db => {
      if (db.users[walletAddress]) {
        db.users[walletAddress].lastLogin = new Date().toISOString();
        db.currentUser = walletAddress;
      }
      return db;
    }),
    logout: () => update(db => {
      db.currentUser = null;
      return db;
    }),
    getCurrentUser: () => {
      const db = get(userDatabase);
      return db.currentUser ? db.users[db.currentUser] : null;
    }
  };
};

export const userDatabase = createUserDatabase();