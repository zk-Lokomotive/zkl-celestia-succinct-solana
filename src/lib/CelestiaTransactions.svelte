<script>
  import { onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import { themeStore } from './stores/themeStore.js';
  import { getAllCelestiaTransactions } from './services/celestia.js';
  
  let transactions = [];
  let isOpen = false;
  
  $: isDark = $themeStore.isDark;
  
  onMount(() => {
    loadTransactions();
  });
  
  function loadTransactions() {
    transactions = getAllCelestiaTransactions();
    console.log('Loaded Celestia transactions:', transactions);
  }
  
  function formatDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return 'Invalid date';
    }
  }
  
  function truncateHash(hash, start = 6, end = 4) {
    if (!hash) return '';
    if (hash.length <= start + end) return hash;
    return `${hash.substring(0, start)}...${hash.substring(hash.length - end)}`;
  }
  
  function toggleOpen() {
    isOpen = !isOpen;
    if (isOpen) {
      loadTransactions();
    }
  }
</script>

<div class="celestia-transactions" class:dark={isDark}>
  <button class="toggle-button" on:click={toggleOpen}>
    <span class="label">Celestia Transactions</span>
    <span class="count">{transactions.length}</span>
    <span class="icon">{isOpen ? '▼' : '▶'}</span>
  </button>
  
  {#if isOpen}
    <div class="transactions-content" transition:slide={{ duration: 300 }}>
      {#if transactions.length === 0}
        <div class="empty-state">
          <p>No Celestia transactions found.</p>
          <p>Upload a file with Celestia DA enabled to see transactions here.</p>
        </div>
      {:else}
        <div class="transaction-list">
          {#each transactions as tx, i}
            <div class="transaction-item" class:odd={i % 2 === 0}>
              <div class="transaction-header">
                <span class="tx-date">{formatDate(tx.timestamp)}</span>
                <a 
                  href={`https://celenium.io/tx/${tx.txhash}`} 
                  target="_blank"
                  rel="noopener noreferrer"
                  class="explorer-link"
                >
                  View in Explorer
                </a>
              </div>
              
              <div class="transaction-details">
                <div class="detail-row">
                  <span class="detail-label">TX Hash:</span>
                  <code class="detail-value hash">{truncateHash(tx.txhash, 8, 8)}</code>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Height:</span>
                  <span class="detail-value">{tx.height}</span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Namespace:</span>
                  <code class="detail-value">{tx.namespace}</code>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">IPFS Hash:</span>
                  <code class="detail-value ipfs-hash">{truncateHash(tx.ipfsHash, 6, 6)}</code>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Timestamp:</span>
                  <span class="detail-value">{formatDate(tx.timestamp)}</span>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
      
      <button class="refresh-button" on:click={loadTransactions}>
        Refresh Transactions
      </button>
    </div>
  {/if}
</div>

<style>
  .celestia-transactions {
    margin-top: 1rem;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid rgba(0, 0, 0, 0.1);
  }
  
  .dark.celestia-transactions {
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .toggle-button {
    width: 100%;
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    background: rgba(0, 0, 0, 0.05);
    border: none;
    cursor: pointer;
    text-align: left;
    font-weight: 500;
  }
  
  .dark .toggle-button {
    background: rgba(255, 255, 255, 0.05);
  }
  
  .toggle-button:hover {
    background: rgba(0, 0, 0, 0.08);
  }
  
  .dark .toggle-button:hover {
    background: rgba(255, 255, 255, 0.08);
  }
  
  .label {
    flex: 1;
  }
  
  .count {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    padding: 0.1rem 0.5rem;
    font-size: 0.8rem;
    margin-right: 0.5rem;
  }
  
  .dark .count {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .icon {
    font-size: 0.7rem;
  }
  
  .transactions-content {
    padding: 1rem;
  }
  
  .empty-state {
    text-align: center;
    padding: 2rem 1rem;
    color: rgba(0, 0, 0, 0.6);
  }
  
  .dark .empty-state {
    color: rgba(255, 255, 255, 0.6);
  }
  
  .transaction-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  
  .transaction-item {
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid rgba(0, 0, 0, 0.1);
  }
  
  .dark .transaction-item {
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .transaction-item.odd {
    background: rgba(0, 0, 0, 0.02);
  }
  
  .dark .transaction-item.odd {
    background: rgba(255, 255, 255, 0.02);
  }
  
  .transaction-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0.75rem;
    background: rgba(0, 0, 0, 0.05);
    font-size: 0.8rem;
  }
  
  .dark .transaction-header {
    background: rgba(255, 255, 255, 0.05);
  }
  
  .tx-date {
    font-weight: 500;
  }
  
  .explorer-link {
    color: #2196F3;
    text-decoration: none;
  }
  
  .dark .explorer-link {
    color: #64B5F6;
  }
  
  .explorer-link:hover {
    text-decoration: underline;
  }
  
  .transaction-details {
    padding: 0.75rem;
  }
  
  .detail-row {
    display: flex;
    margin-bottom: 0.4rem;
    font-size: 0.9rem;
  }
  
  .detail-label {
    width: 100px;
    font-weight: 500;
  }
  
  .detail-value {
    flex: 1;
  }
  
  code.detail-value {
    font-family: monospace;
    background: rgba(0, 0, 0, 0.03);
    padding: 0.1rem 0.3rem;
    border-radius: 3px;
  }
  
  .dark code.detail-value {
    background: rgba(255, 255, 255, 0.05);
  }
  
  .refresh-button {
    width: 100%;
    padding: 0.6rem;
    background: #2196F3;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
  }
  
  .refresh-button:hover {
    background: #1976D2;
  }
</style> 