<script>
  import { createEventDispatcher } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { walletStore, connectWallet } from './stores/wallet.js';
  import { userDatabase } from './stores/database.js';
  
  const dispatch = createEventDispatcher();
  let isLoginHovered = false;
  let isCloseHovered = false;
  let isConnecting = false;

  $: isAuthenticated = $walletStore.connected;
  $: currentUser = $userDatabase.currentUser;

  async function handleLogin() {
    isConnecting = true;
    try {
      const success = await connectWallet();
      if (success) {
        dispatch('close');
      }
    } finally {
      isConnecting = false;
    }
  }
</script>

<div class="modal-overlay" transition:fade>
  <div class="modal-content" transition:scale>
    <div class="modal-header">
      <h2>zkλ/upload</h2>
      <button 
        class="close-button" 
        on:click={() => dispatch('close')}
      >
        <div class="close-button-inner">
          <span class="close-icon">×</span>
        </div>
      </button>
    </div>

    <div class="modal-body">
      <h1>Connect your wallet</h1>
      <p class="description">Please connect your wallet to continue logging in or registering.</p>
      <p class="sub-description">You can relink your zk-Lokomotive identity with a different wallet after connecting it.</p>
      
      <button 
        class="login-button" 
        on:click={handleLogin}
        disabled={isConnecting}
      >
        <span>{isConnecting ? 'Connecting...' : 'Connect Solflare'}</span>
      </button>
    </div>

    <div class="modal-footer">
      <p>2024 © zk-Lokomotive by zkλ. All rights reserved.</p>
    </div>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: #feffaf;
    width: 90%;
    max-width: 600px;
    border-radius: 12px;
    padding: 2rem;
    position: relative;
    border: 2px dashed rgba(0, 0, 0, 0.3);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 2px dashed rgba(0, 0, 0, 0.3);
  }

  .modal-header h2 {
    font-family: 'League Spartan', sans-serif;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .close-button {
    width: 40px;
    height: 40px;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    outline: none;
  }

  .close-button-inner {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: #ff4444;
    border: 2px solid #000;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .close-button:hover .close-button-inner {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }

  .close-icon {
    color: #000;
    font-size: 28px;
    line-height: 1;
    font-weight: 400;
  }

  .modal-body {
    text-align: center;
    padding: 2rem 0;
  }

  h1 {
    font-size: 2rem;
    margin-bottom: 1rem;
    font-family: 'League Spartan', sans-serif;
  }

  .description {
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
  }

  .sub-description {
    font-size: 0.9rem;
    color: rgba(0, 0, 0, 0.6);
    margin-bottom: 2rem;
  }

  .login-button {
    background: #000000;
    color: #feffaf;
    border: none;
    padding: 0.75rem 2rem;
    border-radius: 8px;
    font-size: 1.1rem;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'League Spartan', sans-serif;
  }

  .login-button:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  .login-button:not(:disabled):active {
    transform: translateY(1px);
    box-shadow: none;
  }

  .login-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .modal-footer {
    text-align: center;
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 2px dashed rgba(0, 0, 0, 0.3);
    font-size: 0.9rem;
    color: rgba(0, 0, 0, 0.6);
  }
</style>