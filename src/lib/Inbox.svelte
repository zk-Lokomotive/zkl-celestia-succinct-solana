<script>
  import { walletStore } from './stores/wallet.js';
  import { inboxStore } from './stores/inboxStore.js';
  import { fade, slide } from 'svelte/transition';

  $: userMessages = inboxStore.getMessagesForUser($walletStore.publicKey);

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleString();
  }

  function deleteMessage(messageId) {
    inboxStore.deleteMessage($walletStore.publicKey, messageId);
  }
</script>

<div class="inbox-container dashed-border">
  <div class="inbox-header">
    <h2>Your Inbox</h2>
    <div class="inbox-stats">
      {$userMessages.length} file{$userMessages.length !== 1 ? 's' : ''} received
    </div>
  </div>
  
  {#if $userMessages.length === 0}
    <div class="empty-state" in:fade>
      <p>No files have been shared with you yet.</p>
      <p class="empty-hint">Files shared with your wallet address will appear here</p>
    </div>
  {:else}
    <div class="messages-list">
      {#each $userMessages as message (message.id)}
        <div class="message-card" in:slide>
          <div class="message-header">
            <span class="timestamp">{formatDate(message.timestamp)}</span>
            <button 
              class="delete-button" 
              on:click={() => deleteMessage(message.id)}
            >
              ×
            </button>
          </div>
          
          <div class="ipfs-hash">
            <span class="label">IPFS Hash:</span>
            <code>{message.ipfsHash}</code>
            <button 
              class="copy-button"
              on:click={() => copyToClipboard(message.ipfsHash)}
            >
              Copy
            </button>
          </div>
          
          {#if message.message}
            <p class="message-text">{message.message}</p>
          {/if}
          
          <div class="sender-info">
            <span class="label">From:</span>
            <code>{message.senderAddress}</code>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .inbox-container {
    padding: 2rem;
    margin: 2rem 0;
    background: rgba(255, 255, 255, 0.3);
  }

  .inbox-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  h2 {
    font-family: 'League Spartan', sans-serif;
    font-size: 2rem;
    margin: 0;
  }

  .inbox-stats {
    font-size: 0.9rem;
    color: rgba(0, 0, 0, 0.6);
    background: rgba(0, 0, 0, 0.05);
    padding: 0.5rem 1rem;
    border-radius: 20px;
  }

  .empty-state {
    text-align: center;
    padding: 3rem 2rem;
    color: rgba(0, 0, 0, 0.6);
    border: 2px dashed rgba(0, 0, 0, 0.2);
    border-radius: 8px;
  }

  .empty-hint {
    font-size: 0.9rem;
    margin-top: 0.5rem;
    color: rgba(0, 0, 0, 0.4);
  }

  .messages-list {
    display: grid;
    gap: 1.5rem;
  }

  .message-card {
    background: rgba(255, 255, 255, 0.5);
    border: 2px dashed rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    padding: 1.5rem;
    transition: all 0.2s;
  }

  .message-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .timestamp {
    font-size: 0.9rem;
    color: rgba(0, 0, 0, 0.6);
  }

  .delete-button {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: none;
    background: #ff4444;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    transition: all 0.2s;
  }

  .delete-button:hover {
    transform: scale(1.1);
  }

  .ipfs-hash {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    background: rgba(0, 0, 0, 0.05);
    padding: 0.5rem;
    border-radius: 4px;
    overflow-x: auto;
  }

  .label {
    font-weight: 500;
    color: rgba(0, 0, 0, 0.7);
    white-space: nowrap;
  }

  code {
    font-family: monospace;
    background: rgba(0, 0, 0, 0.05);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    overflow-x: auto;
  }

  .copy-button {
    padding: 0.25rem 0.5rem;
    background: rgba(0, 0, 0, 0.1);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.9rem;
    white-space: nowrap;
  }

  .copy-button:hover {
    background: rgba(0, 0, 0, 0.2);
  }

  .message-text {
    margin: 1rem 0;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
    font-style: italic;
  }

  .sender-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    overflow-x: auto;
  }
</style>