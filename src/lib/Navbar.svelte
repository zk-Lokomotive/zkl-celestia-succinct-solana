<script>
  import { walletStore, disconnectWallet } from './stores/wallet.js';
  import { onMount, onDestroy } from 'svelte';
  import { fade, slide } from 'svelte/transition';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();
  const ADMIN_WALLET = "B99ZeAHD4ZxGfSwbQRqbpQPpAigzwDCyx4ShHTcYCAtS";

  const navItems = [
    { text: 'X/Twitter', href: '#' },
    { text: 'GitHub', href: '#' },
    { text: 'Discord', href: '#' },
    { text: 'Documentation', href: '#' },
    { text: 'Team', href: '#' }
  ];

  let showMenu = false;
  let accountButton;

  $: isAdmin = $walletStore.connected && $walletStore.publicKey === ADMIN_WALLET;

  function handleClickOutside(event) {
    if (accountButton && !accountButton.contains(event.target)) {
      showMenu = false;
    }
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside);
  });

  onDestroy(() => {
    document.removeEventListener('click', handleClickOutside);
  });

  async function handleLogout() {
    await disconnectWallet();
    showMenu = false;
  }

  function handleManageUsers() {
    if (isAdmin) {
      dispatch('showUsers');
      showMenu = false;
    }
  }
</script>

<nav>
  <div class="container nav-content">
    <div class="logo">zkλ</div>
    <div class="nav-right">
      <ul>
        {#each navItems as item}
          <li><a href={item.href}>{item.text}</a></li>
        {/each}
      </ul>
      
      {#if $walletStore.connected}
        <div class="wallet-info">
          <button 
            bind:this={accountButton}
            class="account-button" 
            class:active={showMenu}
            on:click|stopPropagation={() => showMenu = !showMenu}
          >
            <span class="username">{$walletStore.username}</span>
            <img 
              src={$walletStore.avatar} 
              alt="avatar" 
              class="avatar" 
            />
          </button>
          
          {#if showMenu}
            <div 
              class="menu-container" 
              transition:slide={{ duration: 200, y: -10 }}
              on:click|stopPropagation
            >
              <div class="menu-header">
                <img 
                  src={$walletStore.avatar}
                  alt="avatar" 
                  class="menu-avatar" 
                />
                <div class="menu-user-info">
                  <span class="menu-username">{$walletStore.username}</span>
                  <span class="menu-wallet-type">Solflare Wallet</span>
                </div>
              </div>
              
              <div class="menu-divider"></div>
              
              <div class="menu-items">
                {#if isAdmin}
                  <button class="menu-item" on:click={handleManageUsers}>
                    Manage Users
                  </button>
                {/if}
                <button class="menu-item">
                  My Files
                </button>
                <button class="menu-item">
                  Settings
                </button>
                <button class="menu-item">
                  Help Center
                </button>
              </div>
              
              <div class="menu-divider"></div>
              
              <button class="logout-button" on:click={handleLogout}>
                Logout
              </button>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</nav>

<style>
  nav {
    padding: 1rem 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    background: var(--main-bg-color);
    position: relative;
    z-index: 100;
  }

  .nav-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .nav-right {
    display: flex;
    align-items: center;
    gap: 2rem;
  }

  .logo {
    font-size: 2rem;
    font-weight: bold;
  }

  ul {
    display: flex;
    gap: 2rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  a {
    text-decoration: none;
    color: inherit;
    font-weight: 500;
    transition: opacity 0.3s;
  }

  a:hover {
    opacity: 0.7;
  }

  .wallet-info {
    position: relative;
  }

  .account-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(0, 0, 0, 0.05);
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .account-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .account-button.active {
    background: rgba(0, 0, 0, 0.1);
    transform: translateY(1px);
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .username {
    font-weight: 500;
  }

  .avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
  }

  .menu-container {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    width: 280px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .menu-header {
    padding: 1rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    background: rgba(0, 0, 0, 0.02);
  }

  .menu-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
  }

  .menu-user-info {
    display: flex;
    flex-direction: column;
  }

  .menu-username {
    font-weight: 600;
    font-size: 1.1rem;
  }

  .menu-wallet-type {
    font-size: 0.9rem;
    color: rgba(0, 0, 0, 0.6);
  }

  .menu-divider {
    height: 1px;
    background: rgba(0, 0, 0, 0.1);
    margin: 0.5rem 0;
  }

  .menu-items {
    padding: 0.5rem;
  }

  .menu-item {
    width: 100%;
    padding: 0.75rem 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: none;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'League Spartan', sans-serif;
    font-size: 1rem;
  }

  .menu-item:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  .logout-button {
    width: calc(100% - 1rem);
    margin: 0.5rem;
    padding: 0.75rem 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ff4444;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'League Spartan', sans-serif;
    font-size: 1rem;
  }

  .logout-button:hover {
    background: #ff3333;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .logout-button:active {
    transform: translateY(1px);
    box-shadow: none;
  }
</style>