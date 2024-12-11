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

  function openInNewTab(url) {
    window.open(url, '_blank');
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
          
          <div class="ipfs-link">
            <span class="label">File:</span>
            <a 
              href={message.ipfsUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              class="file-link"
            >
              {message.fileName}
            </a>
            <button 
              class="view-button"
              on:click={() => openInNewTab(message.ipfsUrl)}
            >
              View
            </button>
            <button 
              class="copy-button"
              on:click={() => copyToClipboard(message.ipfsUrl)}
            >
              Copy Link
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
  /* Previous styles remain the same */

  .ipfs-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    background: rgba(0, 0, 0, 0.05);
    padding: 0.5rem;
    border-radius: 4px;
    overflow-x: auto;
  }

  .file-link {
    color: #000;
    text-decoration: none;
    font-weight: 500;
    transition: opacity 0.2s;
  }

  .file-link:hover {
    opacity: 0.7;
  }

  .view-button {
    padding: 0.25rem 0.5rem;
    background: #000;
    color: #feffaf;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.9rem;
    white-space: nowrap;
  }

  .view-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
</style>