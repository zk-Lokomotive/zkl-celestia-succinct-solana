<!-- 
  ZK Status Component
  This component shows the status of ZK circuit files
-->
<script>
  import { onMount, onDestroy } from 'svelte';
  import { themeStore } from './stores/themeStore.js';
  import { checkZkCircuitAvailability, getZkStatus } from './services/zk.js';
  
  let status = 'checking'; // 'checking', 'available', 'unavailable'
  let lastCheck = null;
  let checkInterval;
  let circuitDetails = null;
  
  $: isDark = $themeStore.isDark;
  
  async function checkCircuits() {
    try {
      status = 'checking';
      const statusResult = await getZkStatus();
      status = statusResult.circuitsAvailable ? 'available' : 'unavailable';
      circuitDetails = statusResult;
      lastCheck = new Date(statusResult.timestamp || Date.now());
      console.log(`ZK circuit status: ${status}`, statusResult);
    } catch (error) {
      console.error('ZK circuit check error:', error);
      status = 'unavailable';
      lastCheck = new Date();
      circuitDetails = null;
    }
  }
  
  onMount(() => {
    // Check immediately when component mounts
    checkCircuits();
    
    // Then check every 2 minutes
    checkInterval = setInterval(checkCircuits, 120000);
  });
  
  onDestroy(() => {
    if (checkInterval) clearInterval(checkInterval);
  });
</script>

<div class="zk-status" class:dark={isDark}>
  <div class="status-indicator">
    <div class="indicator-dot" 
      class:available={status === 'available'} 
      class:checking={status === 'checking'} 
      class:unavailable={status === 'unavailable'}>
    </div>
    <div class="status-text">
      <span class="status-label">ZK Circuits</span>
      <span class="status-value">
        {#if status === 'checking'}
          Checking...
        {:else if status === 'available'}
          Available
        {:else}
          Unavailable
        {/if}
      </span>
    </div>
  </div>
  
  {#if lastCheck}
    <div class="status-time">Last check: {lastCheck.toLocaleTimeString()}</div>
  {/if}
  
  <button class="refresh-button" on:click={checkCircuits}>
    <span class="refresh-icon">⟳</span>
  </button>
</div>

<style>
  .zk-status {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.8rem 1rem;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.05);
    margin-bottom: 1rem;
  }
  
  .dark.zk-status {
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
  
  .indicator-dot.available {
    background-color: #4CAF50;
    box-shadow: 0 0 5px #4CAF50;
  }
  
  .indicator-dot.checking {
    background-color: #FFC107;
    animation: pulse 1.5s infinite;
  }
  
  .indicator-dot.unavailable {
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