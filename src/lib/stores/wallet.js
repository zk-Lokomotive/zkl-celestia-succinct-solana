import { writable } from 'svelte/store';
import { userDatabase } from './database.js';

const storedWallet = JSON.parse(localStorage.getItem('wallet')) || {
  connected: false,
  publicKey: null,
  username: null,
  avatar: null
};

export const walletStore = writable(storedWallet);

walletStore.subscribe(value => {
  localStorage.setItem('wallet', JSON.stringify(value));
});

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
    walletStore.set({
      connected: true,
      publicKey,
      username,
      avatar
    });

    // Add or update user in database
    userDatabase.addUser(publicKey, {
      username,
      avatar,
      publicKey
    });
    
    return true;
  } catch (error) {
    console.error('Error connecting wallet:', error);
    walletStore.set({
      connected: false,
      publicKey: null,
      username: null,
      avatar: null
    });
    throw error;
  }
};

export const disconnectWallet = async () => {
  try {
    if (window.solflare?.isConnected) {
      await window.solflare.disconnect();
    }
    
    // Update wallet store
    walletStore.set({
      connected: false,
      publicKey: null,
      username: null,
      avatar: null
    });

    // Logout from database
    userDatabase.logout();
    
    return true;
  } catch (error) {
    console.error('Error disconnecting wallet:', error);
    return false;
  }
};