<script>
  import './app.css';
  import Navbar from './lib/Navbar.svelte';
  import MainContent from './lib/MainContent.svelte';
  import WalletConnection from './lib/WalletConnection.svelte';
  import UploadInterface from './lib/UploadInterface.svelte';
  import UserManagement from './lib/UserManagement.svelte';
  import { walletStore } from './lib/stores/wallet.js';
  import { inboxStore } from './lib/stores/inboxStore.js';
  import { onMount } from 'svelte';
  
  const ADMIN_WALLET = "B99ZeAHD4ZxGfSwbQRqbpQPpAigzwDCyx4ShHTcYCAtS";
  
  let showWalletConnection = false;
  let showUploadInterface = false;
  let showUserManagement = false;

  $: isAdmin = $walletStore.connected && $walletStore.publicKey === ADMIN_WALLET;

  // Inbox otomatik güncellemesi
  let inboxAutoUpdateInterval = null;
  
  // Cüzdan bağlandığında inbox'ı güncelle
  $: if ($walletStore.connected && $walletStore.publicKey) {
    console.log('Cüzdan bağlandı, inbox yükleniyor:', $walletStore.publicKey);
    inboxStore.fetchFromCelestia($walletStore.publicKey);
    
    // Otomatik güncellemeleri başlat (her 2 dakikada bir)
    if (!inboxAutoUpdateInterval) {
      inboxAutoUpdateInterval = inboxStore.startAutoFetch($walletStore.publicKey, 120000);
    }
  } else if (!$walletStore.connected && inboxAutoUpdateInterval) {
    console.log('Cüzdan bağlantısı kesildi, inbox güncellemesi durduruluyor');
    clearInterval(inboxAutoUpdateInterval);
    inboxAutoUpdateInterval = null;
  }
  
  // Sayfa yüklendiğinde, localStorage'dan bilgileri yükle
  onMount(() => {
    // Inbox mesajlarını localStorage'dan yükle
    inboxStore.loadFromLocalStorage();
    
    // Eğer wallet zaten bağlıysa, inbox'ı yükle
    if ($walletStore.connected && $walletStore.publicKey) {
      inboxStore.fetchFromCelestia($walletStore.publicKey);
    }
    
    // Sayfa kapanırken interval'ı temizle
    return () => {
      if (inboxAutoUpdateInterval) {
        clearInterval(inboxAutoUpdateInterval);
      }
    };
  });

  function toggleWalletModal(show) {
    showWalletConnection = show;
  }

  function handleShowUpload() {
    if ($walletStore.connected) {
      showUploadInterface = true;
    } else {
      showWalletConnection = true;
    }
  }

  function handleCloseUpload() {
    showUploadInterface = false;
  }

  function handleWalletClose() {
    showWalletConnection = false;
    if ($walletStore.connected) {
      showUploadInterface = true;
    }
  }

  function handleShowUsers() {
    if (isAdmin) {
      showUserManagement = true;
    }
  }

  function handleCloseUsers() {
    showUserManagement = false;
  }
</script>

<div class="app">
  <Navbar 
    on:showUsers={handleShowUsers}
  />
  <MainContent 
    on:showWallet={() => toggleWalletModal(true)} 
    on:showUpload={handleShowUpload}
  />
  {#if showWalletConnection}
    <WalletConnection on:close={handleWalletClose} />
  {/if}
  {#if showUploadInterface}
    <UploadInterface on:close={handleCloseUpload} />
  {/if}
  {#if showUserManagement && isAdmin}
    <UserManagement on:close={handleCloseUsers} />
  {/if}
</div>

<style>
  .app {
    min-height: 100vh;
    position: relative;
  }
</style>