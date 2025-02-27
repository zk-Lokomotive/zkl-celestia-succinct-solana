<script>
  import { walletStore } from './stores/wallet.js';
  import { inboxStore } from './stores/inboxStore.js';
  import { themeStore } from './stores/themeStore.js';
  import { fade, slide } from 'svelte/transition';
  import { onMount, onDestroy } from 'svelte';
  import { ipfsDownload } from './services/ipfs.js';
  import { fileStore } from './stores/fileStore.js';

  // Otomatik güncelleme için interval ID
  let autoUpdateInterval = null;
  
  // Kullanıcı mesajlarını al
  $: userMessages = inboxStore.getMessagesForUser($walletStore.publicKey);
  $: isDark = $themeStore.isDark;
  $: isFetching = false; // Veri çekiliyor mu?
  $: lastFetched = null; // Son veri çekme zamanı
  
  // Component monte edildiğinde otomatik kontrolü başlat
  onMount(() => {
    // Kullanıcının adresini al ve Inbox'ı doldur
    if ($walletStore.publicKey) {
      console.log('Inbox otomatik güncellemesi başlıyor:', $walletStore.publicKey);
      // İlk veri çekme işlemi
      inboxStore.fetchFromCelestia($walletStore.publicKey);
      
      // Otomatik güncelleme için interval ayarla (her 2 dakikada bir)
      autoUpdateInterval = inboxStore.startAutoFetch($walletStore.publicKey, 120000);
    }
  });
  
  // Component kaldırıldığında interval'ı temizle
  onDestroy(() => {
    if (autoUpdateInterval) {
      console.log('Inbox otomatik güncellemesi durduruluyor');
      clearInterval(autoUpdateInterval);
    }
  });

  // Panoya kopyala
  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    alert('Panoya kopyalandı!');
  }

  // Zamanı formatla
  function formatDate(dateString) {
    return new Date(dateString).toLocaleString();
  }

  // Dosya boyutunu formatla
  function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // Mesajı sil
  function deleteMessage(messageId) {
    if (confirm('Bu mesajı silmek istediğinizden emin misiniz?')) {
      inboxStore.deleteMessage($walletStore.publicKey, messageId);
    }
  }

  // Yeni sekme aç
  function openInNewTab(url) {
    window.open(url, '_blank');
  }
  
  // Dosyayı indir
  async function downloadFile(cid, fileName) {
    try {
      await fileStore.downloadFile(cid, fileName);
    } catch (error) {
      console.error('Dosya indirme hatası:', error);
      alert('Dosya indirilemedi: ' + error.message);
    }
  }
  
  // Verileri yenile
  function refreshInbox() {
    if ($walletStore.publicKey) {
      inboxStore.fetchFromCelestia($walletStore.publicKey);
    }
  }
</script>

<div class="inbox-container dashed-border">
  <div class="inbox-header">
    <div class="header-content">
      <h2>zkλ/inbox</h2>
      <div class="inbox-actions">
        <div class="inbox-stats">
          {$userMessages.length} dosya{$userMessages.length !== 1 ? '' : ''}
        </div>
        <button class="refresh-button" on:click={refreshInbox} disabled={isFetching}>
          ↻ Yenile
        </button>
      </div>
    </div>
  </div>
  
  {#if $userMessages.length === 0}
    <div class="empty-state" in:fade>
      <div class="empty-icon">📥</div>
      <p class="empty-title">Gelen kutunuz boş</p>
      <p class="empty-hint">Cüzdan adresinize gönderilen dosyalar burada görünecek</p>
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
              title="Mesajı sil"
            >
              ✖️
            </button>
          </div>
          
          <div class="message-content">
            <!-- Dosya Bilgileri -->
            <div class="file-info">
              <div class="file-name">{message.fileName || 'Dosya'}</div>
              
              <div class="ipfs-link">
                <code class="ipfs-hash" title="IPFS URL">
                  {message.ipfsUrl || message.ipfsCid}
                </code>
                <div class="action-buttons">
                  <button 
                    class="action-button view-button"
                    on:click={() => openInNewTab(message.ipfsUrl)}
                    title="Dosyayı görüntüle"
                  >
                    Görüntüle
                  </button>
                  <button 
                    class="action-button download-button"
                    on:click={() => downloadFile(message.ipfsCid, message.fileName)}
                    title="Dosyayı indir"
                  >
                    İndir
                  </button>
                  <button 
                    class="action-button copy-button"
                    on:click={() => copyToClipboard(message.ipfsUrl || message.ipfsCid)}
                    title="IPFS linkini kopyala"
                  >
                    Kopyala
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Mesaj İçeriği (varsa) -->
            {#if message.message}
              <div class="message-text">
                <p>{message.message}</p>
              </div>
            {/if}
            
            <!-- Celestia Bilgileri (varsa) -->
            {#if message.celestiaHeight}
              <div class="celestia-info">
                <h4>Celestia DA Bilgileri</h4>
                <div class="info-row">
                  <span class="info-label">Blok Yüksekliği:</span>
                  <span class="info-value">{message.celestiaHeight}</span>
                </div>
                {#if message.celestiaNamespace}
                  <div class="info-row">
                    <span class="info-label">Namespace:</span>
                    <code class="info-value code">{message.celestiaNamespace}</code>
                  </div>
                {/if}
                {#if message.celestiaUrl}
                  <div class="celestia-link">
                    <a 
                      href={message.celestiaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="explorer-link"
                    >
                      Celestia Explorer'da Görüntüle
                    </a>
                  </div>
                {/if}
              </div>
            {/if}
            
            <!-- ZK Proof Bilgileri (varsa) -->
            {#if message.zkProofAvailable}
              <div class="zk-info">
                <h4>Zero Knowledge Proof</h4>
                <div class="info-row">
                  <span class="info-label">Durum:</span>
                  <span class="info-value success">Doğrulandı ✓</span>
                </div>
                {#if message.zkProofTimestamp}
                  <div class="info-row">
                    <span class="info-label">Oluşturulma:</span>
                    <span class="info-value">{formatDate(message.zkProofTimestamp)}</span>
                  </div>
                {/if}
              </div>
            {/if}
            
            <!-- Gönderen Bilgisi -->
            <div class="sender-info">
              <span class="label">Gönderen:</span>
              <code class="sender-address">{message.senderAddress || 'Bilinmeyen'}</code>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .inbox-container {
    margin-top: 2rem;
    background: var(--main-bg-color);
    color: var(--text-color);
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
  
  .inbox-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .refresh-button {
    background: var(--text-color);
    color: var(--main-bg-color);
    border: none;
    border-radius: 4px;
    padding: 0.4rem 0.8rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .refresh-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  .refresh-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  h2 {
    font-family: 'League Spartan', sans-serif;
    font-size: 2rem;
    font-weight: 600;
    margin: 0;
  }
  
  h4 {
    margin: 0 0 0.5rem 0;
    border-bottom: 1px dashed rgba(0, 0, 0, 0.1);
    padding-bottom: 0.25rem;
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
    background: var(--hover-bg-color);
    border: 2px dashed var(--border-color);
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
    color: var(--text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 220px;
  }

  .action-buttons {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
    flex-wrap: wrap;
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
    background: var(--text-color);
    color: var(--main-bg-color);
  }
  
  .download-button {
    background: #4caf50;
    color: white;
  }

  .copy-button {
    background: var(--hover-bg-color);
    color: var(--text-color);
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
    background: var(--hover-bg-color);
    border-radius: 6px;
  }
  
  .celestia-info, .zk-info {
    margin: 1rem 0;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.03);
    border-radius: 6px;
  }
  
  .info-row {
    display: flex;
    margin: 0.3rem 0;
    align-items: center;
  }
  
  .info-label {
    width: 130px;
    font-weight: 500;
    font-size: 0.9rem;
  }
  
  .info-value {
    flex: 1;
  }
  
  .info-value.code {
    font-family: monospace;
    background: rgba(0, 0, 0, 0.05);
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-size: 0.9rem;
  }
  
  .info-value.success {
    color: #4caf50;
    font-weight: 500;
  }
  
  .celestia-link {
    margin-top: 0.75rem;
  }
  
  .explorer-link {
    color: var(--text-color);
    text-decoration: none;
    background: var(--hover-bg-color);
    padding: 0.4rem 0.8rem;
    border-radius: 4px;
    transition: all 0.2s;
    font-family: 'League Spartan', sans-serif;
    font-size: 0.9rem;
    display: inline-block;
  }

  .explorer-link:hover {
    background: var(--hover-bg-color);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .sender-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
  }

  .label {
    color: rgba(0, 0, 0, 0.6);
  }

  .sender-address {
    font-family: monospace;
    background: var(--hover-bg-color);
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>