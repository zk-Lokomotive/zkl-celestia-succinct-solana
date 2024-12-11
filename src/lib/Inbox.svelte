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

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function deleteMessage(messageId) {
    inboxStore.deleteMessage($walletStore.publicKey, messageId);
  }

  function openInNewTab(url) {
    window.open(url, '_blank');
  }
</script>

<div class="inbox-container dashed-border">
  <div class="inbox-header">
    <div class="header-content">
      <h2>zkλ/inbox</h2>
      <div class="inbox-stats">
        {$userMessages.length} file{$userMessages.length !== 1 ? 's' : ''} received
      </div>
    </div>
  </div>
  
  {#if $userMessages.length === 0}
    <div class="empty-state" in:fade>
      <div class="empty-icon">📥</div>
      <p class="empty-title">Your inbox is empty</p>
      <p class="empty-hint">Files shared with your wallet address will appear here</p>
    </div>
  {:else}
    <div class="messages-list">
      {#each $userMessages as message (message.id)}
        <div class="message-card" in:slide={{ duration: 300 }}>
          <div class="message-header">
            <div class="message-meta">
              <span class="timestamp">{formatDate(message.timestamp)}</span>
              <span class="file-size">{formatFileSize(message.fileSize)}</span>
            </div>
            <button 
              class="delete-button" 
              on:click={() => deleteMessage(message.id)}
              title="Delete message"
            >
              ✖️
            </button>
          </div>
          
          <div class="message-content">
            <div class="transaction-info">
              <span class="label">Transaction:</span>
              <a 
                href={message.transactionUrl}
                target="_blank"
                rel="noopener noreferrer"
                class="transaction-link"
              >
                View on Solana Explorer
              </a>
            </div>
            <div class="file-info">
              <div class="file-name">{message.fileName}</div>
              <div class="ipfs-link">
                <code class="ipfs-hash" title="IPFS URL">
                  {message.ipfsUrl}
                </code>
                <div class="action-buttons">
                  <button 
                    class="action-button view-button"
                    on:click={() => openInNewTab(message.ipfsUrl)}
                    title="View file"
                  >
                    View
                  </button>
                  <button 
                    class="action-button copy-button"
                    on:click={() => copyToClipboard(message.ipfsUrl)}
                    title="Copy IPFS link"
                  >
                    Copy Link
                  </button>
                </div>
              </div>
            </div>
            
            {#if message.message}
              <div class="message-text">
                <p>{message.message}</p>
              </div>
            {/if}
            
            <div class="sender-info">
              <span class="label">From:</span>
              <code class="sender-address">{message.senderAddress}</code>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .transaction-info {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
  }

  .transaction-link {
    color: #000;
    text-decoration: none;
    background: rgba(0, 0, 0, 0.05);
    padding: 0.4rem 0.8rem;
    border-radius: 4px;
    transition: all 0.2s;
    font-family: 'League Spartan', sans-serif;
  }

  .transaction-link:hover {
    background: rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }

  .transaction-link:active {
    transform: translateY(1px);
  }
  .inbox-container {
    margin-top: 2rem;
    background: #feffaf;
    overflow: hidden;
  }

  .inbox-header {
    padding-bottom: 1rem;
    border-bottom: 2px dashed rgba(0, 0, 0, 0.3);
    margin-bottom: 1.5rem;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  h2 {
    font-family: 'League Spartan', sans-serif;
    font-size: 2rem;
    font-weight: 600;
    margin: 0;
  }

  .inbox-stats {
    font-size: 1.1rem;
    color: rgba(0, 0, 0, 0.6);
  }

  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .empty-title {
    font-size: 1.5rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }

  .empty-hint {
    color: rgba(0, 0, 0, 0.6);
  }

  .messages-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .message-card {
    background: rgba(255, 255, 255, 0.5);
    border: 2px dashed rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    overflow: hidden;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .message-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.03);
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }

  .message-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.9rem;
    color: rgba(0, 0, 0, 0.6);
  }

  .delete-button {
    width: 24px;
    height: 24px;
    border: none;
    background: #ff4444;
    color: white;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    transition: all 0.2s;
  }

  .delete-button:hover {
    transform: scale(1.1);
    background: #ff3333;
  }

  .message-content {
    padding: 1rem;
  }

  .file-info {
    margin-bottom: 1rem;
  }

  .file-name {
    font-size: 1.2rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }

  .ipfs-link {
    background: rgba(0, 0, 0, 0.05);
    padding: 0.8rem;
    border-radius: 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    overflow-x: auto;
  }

  .ipfs-hash {
    font-family: monospace;
    font-size: 0.9rem;
    color: rgba(0, 0, 0, 0.8);
  }

  .action-buttons {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .action-button {
    padding: 0.4rem 0.8rem;
    border: none;
    border-radius: 4px;
    font-family: 'League Spartan', sans-serif;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .view-button {
    background: #000;
    color: #feffaf;
  }

  .copy-button {
    background: rgba(0, 0, 0, 0.1);
    color: #000;
  }

  .action-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .action-button:active {
    transform: translateY(1px);
    box-shadow: none;
  }

  .message-text {
    margin: 1rem 0;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.03);
    border-radius: 6px;
  }

  .sender-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
  }

  .label {
    color: rgba(0, 0, 0, 0.6);
  }

  .sender-address {
    font-family: monospace;
    background: rgba(0, 0, 0, 0.05);
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
  }
</style>