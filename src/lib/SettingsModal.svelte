<script>
    import { createEventDispatcher } from 'svelte';
    import { fade, fly } from 'svelte/transition';
    import { walletStore } from './stores/wallet.js';
    
    const dispatch = createEventDispatcher();
    
    let darkMode = false;
    let notifications = true;
    let language = 'en';
    
    function handleClose() {
      dispatch('close');
    }
  </script>
  
  <div class="modal-overlay" transition:fade>
    <div class="settings-modal" transition:fly={{ y: 20 }}>
      <div class="modal-header">
        <h2>zkλ/settings</h2>
        <button class="close-button" on:click={handleClose}>
          <div class="close-button-inner">
            <span class="close-icon">×</span>
          </div>
        </button>
      </div>
  
      <div class="modal-content">
        <div class="settings-section">
          <h3>Account</h3>
          <div class="account-info">
            <img src={$walletStore.avatar} alt="Profile" class="profile-avatar"/>
            <div class="account-details">
              <span class="username">{$walletStore.username}</span>
              <code class="wallet-address">{$walletStore.publicKey}</code>
            </div>
          </div>
        </div>
  
        <div class="settings-section">
          <h3>Preferences</h3>
          <div class="setting-item">
            <label class="switch">
              <input type="checkbox" bind:checked={darkMode}>
              <span class="slider"></span>
            </label>
            <span>Dark Mode</span>
          </div>
          
          <div class="setting-item">
            <label class="switch">
              <input type="checkbox" bind:checked={notifications}>
              <span class="slider"></span>
            </label>
            <span>Enable Notifications</span>
          </div>
  
          <div class="setting-item">
            <label for="language">Language</label>
            <select id="language" bind:value={language} class="select-input">
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
            </select>
          </div>
        </div>
  
        <div class="settings-section">
          <h3>Security</h3>
          <button class="security-button">
            <span class="icon">🔒</span>
            Change Password
          </button>
          <button class="security-button">
            <span class="icon">🔑</span>
            Two-Factor Authentication
          </button>
        </div>
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
  
    .settings-modal {
      background: #feffaf;
      width: 90%;
      max-width: 600px;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
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
  
    h2 {
      font-family: 'League Spartan', sans-serif;
      font-size: 2rem;
      margin: 0;
    }
  
    .close-button {
      width: 40px;
      height: 40px;
      padding: 0;
      border: none;
      background: transparent;
      cursor: pointer;
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
      transition: all 0.2s;
    }
  
    .close-button:hover .close-button-inner {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    }
  
    .close-icon {
      color: #000;
      font-size: 28px;
      line-height: 1;
    }
  
    .settings-section {
      margin-bottom: 2rem;
    }
  
    h3 {
      font-family: 'League Spartan', sans-serif;
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }
  
    .account-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: rgba(0, 0, 0, 0.05);
      border-radius: 8px;
    }
  
    .profile-avatar {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      border: 2px solid rgba(0, 0, 0, 0.1);
    }
  
    .account-details {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
  
    .username {
      font-size: 1.2rem;
      font-weight: 500;
    }
  
    .wallet-address {
      font-family: monospace;
      background: rgba(0, 0, 0, 0.1);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.9rem;
    }
  
    .setting-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }
  
    .switch {
      position: relative;
      display: inline-block;
      width: 60px;
      height: 34px;
    }
  
    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
  
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.1);
      transition: .4s;
      border-radius: 34px;
      border: 2px solid rgba(0, 0, 0, 0.2);
    }
  
    .slider:before {
      position: absolute;
      content: "";
      height: 26px;
      width: 26px;
      left: 2px;
      bottom: 2px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }
  
    input:checked + .slider {
      background-color: #000;
    }
  
    input:checked + .slider:before {
      transform: translateX(26px);
    }
  
    .select-input {
      padding: 0.5rem;
      border: 2px solid rgba(0, 0, 0, 0.1);
      border-radius: 4px;
      font-family: 'League Spartan', sans-serif;
      background: white;
    }
  
    .security-button {
      width: 100%;
      padding: 1rem;
      margin-bottom: 0.5rem;
      background: none;
      border: 2px solid rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      font-family: 'League Spartan', sans-serif;
      display: flex;
      align-items: center;
      gap: 0.8rem;
      cursor: pointer;
      transition: all 0.2s;
    }
  
    .security-button:hover {
      background: rgba(0, 0, 0, 0.05);
      transform: translateY(-1px);
    }
  
    .icon {
      font-size: 1.2rem;
    }
  </style>