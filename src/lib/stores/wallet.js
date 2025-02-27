import { writable } from 'svelte/store';
import { userDatabase } from './database.js';

// Wallet durumu için başlangıç değerleri
const initialState = {
  connected: false,
  publicKey: null,
  username: null,
  avatar: null,
  balance: null,
  autoconnect: false
};

// Wallet store'unu oluştur
function createWalletStore() {
  // Browser'da localStorage var mı kontrol et
  const savedState = typeof localStorage !== 'undefined' 
    ? JSON.parse(localStorage.getItem('wallet_state') || 'null')
    : null;
  
  // Başlangıç durumunu localStorage'dan al ya da default değerleri kullan
  const startState = savedState || initialState;
  
  const { subscribe, set, update } = writable(startState);

  return {
    subscribe,
    
    // Cüzdanı bağla
    connect: (publicKey, username, avatar) => update(state => {
      const newState = { 
        ...state, 
        connected: true, 
        publicKey, 
        username,
        avatar,
        autoconnect: true 
      };
      
      // LocalStorage'a kaydet
      try {
        localStorage.setItem('wallet_state', JSON.stringify(newState));
      } catch (e) {
        console.error('Wallet durumu kaydedilemedi:', e);
      }
      
      return newState;
    }),
    
    // Cüzdanı bağlantısını kes
    disconnect: () => update(state => {
      const newState = { 
        ...state, 
        connected: false, 
        publicKey: null,
        username: null,
        avatar: null,
        balance: null,
        autoconnect: false 
      };
      
      // LocalStorage'ı temizle
      try {
        localStorage.removeItem('wallet_state');
      } catch (e) {
        console.error('Wallet durumu temizlenemedi:', e);
      }
      
      return newState;
    }),
    
    // Bakiyeyi güncelle
    updateBalance: (balance) => update(state => {
      const newState = { ...state, balance };
      
      // LocalStorage'a kaydet
      try {
        localStorage.setItem('wallet_state', JSON.stringify(newState));
      } catch (e) {
        console.error('Wallet durumu güncellenemedi:', e);
      }
      
      return newState;
    }),
    
    set
  };
}

export const walletStore = createWalletStore();

function generateRandomAvatar() {
  const styles = ['pixel-art', 'avataaars', 'bottts', 'micah'];
  const randomStyle = styles[Math.floor(Math.random() * styles.length)];
  const randomSeed = Math.random().toString(36).substring(7);
  return `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${randomSeed}`;
}

export const connectWallet = async () => {
  try {
    // Check if Solflare is installed
    if (typeof window === 'undefined' || !window.solflare) {
      throw new Error('Solflare wallet not found! Please install Solflare extension first.');
    }

    // Initialize Solflare
    if (!window.solflare.isConnected) {
      await window.solflare.connect();
    }

    // Get public key
    const publicKey = window.solflare.publicKey.toString();
    const username = `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`;
    const avatar = generateRandomAvatar();
    
    // Update wallet store
    walletStore.connect(publicKey, username, avatar);
    
    // Add or update user in database
    userDatabase.addUser(publicKey, {
      username,
      avatar,
      publicKey
    });
    
    return true;
  } catch (error) {
    console.error('Error connecting wallet:', error);
    walletStore.disconnect();
    throw error;
  }
};

export const disconnectWallet = async () => {
  try {
    if (window.solflare?.isConnected) {
      await window.solflare.disconnect();
    }
    
    // Update wallet store
    walletStore.disconnect();

    // Logout from database
    userDatabase.logout();
    
    return true;
  } catch (error) {
    console.error('Error disconnecting wallet:', error);
    return false;
  }
};