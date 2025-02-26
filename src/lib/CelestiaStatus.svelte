<script>
  import { onMount, onDestroy } from 'svelte';
  import { themeStore } from './stores/themeStore.js';
  import { checkCelestiaConnection, getCelestiaConnectionInfo } from './services/celestia.js';
  
  let status = 'checking'; // 'checking', 'connected', 'disconnected'
  let lastCheck = null;
  let checkInterval;
  let networkInfo = null;
  let blockHeight = null;
  
  $: isDark = $themeStore.isDark;
  
  async function checkConnection() {
    status = 'checking';
    try {
      const connectionInfo = await checkCelestiaConnection();
      status = connectionInfo.isConnected ? 'connected' : 'disconnected';
      lastCheck = new Date();
      networkInfo = connectionInfo.network;
      blockHeight = connectionInfo.height;
      console.log(`Celestia connection status: ${status}`, connectionInfo);
    } catch (error) {
      console.error('Error checking Celestia connection:', error);
      status = 'disconnected';
      lastCheck = new Date();
      networkInfo = null;
      blockHeight = null;
    }
  }
  
  function getStoredConnectionInfo() {
    const info = getCelestiaConnectionInfo();
    if (info && info.isConnected) {
      status = 'connected';
      networkInfo = info.network;
      blockHeight = info.height;
      lastCheck = new Date(info.timestamp);
    } else if (info) {
      status = 'disconnected';
      lastCheck = info.lastChecked ? new Date(info.lastChecked) : null;
    }
  }
  
  onMount(() => {
    // Try to get stored connection info first
    getStoredConnectionInfo();
    
    // Check immediately on mount
    checkConnection();
    
    // Then check every 60 seconds
    checkInterval = setInterval(checkConnection, 60000);
  });
  
  onDestroy(() => {
    if (checkInterval) clearInterval(checkInterval);
  });
</script>

<div class="celestia-status" class:dark={isDark}>
  <div class="status-indicator">
    <div class="indicator-dot" 
         class:connected={status === 'connected'} 
         class:checking={status === 'checking'} 
         class:disconnected={status === 'disconnected'}>
    </div>
    <div class="status-text">
      <span class="status-label">Celestia DA</span>
      <span class="status-value">
        {#if status === 'checking'}
          Checking...
        {:else if status === 'connected'}
          Connected
          {#if networkInfo}
            <span class="network-info">({networkInfo})</span>
          {/if}
        {:else}
          Disconnected
        {/if}
      </span>
      
      {#if status === 'connected' && blockHeight}
        <span class="block-height">Block: {blockHeight}</span>
      {/if}
    </div>
  </div>
  
  {#if lastCheck}
    <div class="status-time">Last check: {lastCheck.toLocaleTimeString()}</div>
  {/if}
  
  <button class="refresh-button" on:click={checkConnection}>
    <span class="refresh-icon">⟳</span>
  </button>
</div>

<style>
  .celestia-status {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.8rem 1rem;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.05);
    margin-bottom: 1rem;
  }
  
  .dark.celestia-status {
    background: rgba(255, 255, 255, 0.05);
  }
  
  .status-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .indicator-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    transition: background-color 0.3s ease;
  }
  
  .indicator-dot.connected {
    background-color: #4CAF50;
    box-shadow: 0 0 5px #4CAF50;
  }
  
  .indicator-dot.checking {
    background-color: #FFC107;
    animation: pulse 1.5s infinite;
  }
  
  .indicator-dot.disconnected {
    background-color: #F44336;
  }
  
  .status-text {
    display: flex;
    flex-direction: column;
  }
  
  .status-label {
    font-size: 0.8rem;
    opacity: 0.8;
  }
  
  .status-value {
    font-weight: 500;
  }
  
  .network-info {
    font-size: 0.8rem;
    opacity: 0.8;
    margin-left: 0.3rem;
  }
  
  .block-height {
    font-size: 0.75rem;
    opacity: 0.7;
    margin-top: 0.1rem;
  }
  
  .status-time {
    font-size: 0.75rem;
    opacity: 0.6;
  }
  
  .refresh-button {
    background: none;
    border: none;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .refresh-button:hover {
    background: rgba(0, 0, 0, 0.1);
  }
  
  .dark .refresh-button:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .refresh-icon {
    font-size: 1.2rem;
  }
  
  @keyframes pulse {
    0% {
      opacity: 0.6;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0.6;
    }
  }
</style> 