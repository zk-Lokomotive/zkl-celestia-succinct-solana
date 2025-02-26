<script>
  import { createEventDispatcher } from 'svelte';
  import { fileStore } from './stores/fileStore.js';
  import { walletStore } from './stores/wallet.js';
  import { themeStore } from './stores/themeStore.js';
  import FileUpload from './FileUpload.svelte';
  import RecipientSearch from './RecipientSearch.svelte';
  import PayloadPreview from './PayloadPreview.svelte';
  import CelestiaStatus from './CelestiaStatus.svelte';
  import CelestiaTransactions from './CelestiaTransactions.svelte';
  import ZkStatus from './ZkStatus.svelte';
  import HelpPage from './HelpPage.svelte';
  
  const dispatch = createEventDispatcher();
  const MAX_MESSAGE_LENGTH = 128;
  
  let recipientAddress = "";
  let message = "";
  let isTransferring = false;
  let selectedRecipient = null;
  let showHelp = false;
  
  $: selectedFile = $fileStore.selectedFile;
  $: transferStatus = $fileStore.transferStatus;
  $: ipfsHash = $fileStore.ipfsHash;
  $: isDark = $themeStore.isDark;
  // New reactive variables for Celestia and ZK
  $: celestiaHeight = $fileStore.celestiaHeight;
  $: celestiaTxHash = $fileStore.celestiaTxHash;
  $: celestiaUrl = $fileStore.celestiaUrl;
  $: zkProofData = $fileStore.zkProofData;
  $: isUsingCelestia = $fileStore.isUsingCelestia;
  $: isUsingZKP = $fileStore.isUsingZKP;

  async function handleTransfer() {
    if (!selectedFile || !recipientAddress) return;
    
    isTransferring = true;
    try {
      await fileStore.transferFile(recipientAddress, message);
      // Reset form after successful transfer
      recipientAddress = "";
      message = "";
      selectedRecipient = null;
      dispatch('close');
    } catch (error) {
      console.error('Transfer failed:', error);
    } finally {
      isTransferring = false;
    }
  }

  function handleRecipientSelect(event) {
    const user = event.detail;
    recipientAddress = user.publicKey;
    selectedRecipient = user;
  }

  function handleChangeFile() {
    fileStore.reset();
    selectedRecipient = null;
    recipientAddress = "";
    message = "";
  }
  
  // Toggle Celestia and ZK usage
  function toggleCelestiaUsage() {
    fileStore.toggleCelestia(!isUsingCelestia);
  }
  
  function toggleZKPUsage() {
    fileStore.toggleZKP(!isUsingZKP);
  }

  function toggleHelp() {
    showHelp = !showHelp;
  }
</script>

<div class="modal-overlay">
  <div class="upload-interface" class:dark={isDark}>
    <div class="header">
      <h1>zkλ/upload</h1>
      <div class="header-buttons">
        <button 
          class="help-button" 
          on:click={toggleHelp}
          aria-label="Yardım"
        >
          <span class="help-icon">?</span>
        </button>
        <button 
          class="close-button" 
          on:click={() => dispatch('close')}
        >
          <div class="close-button-inner">
            <span class="close-icon">×</span>
          </div>
        </button>
      </div>
    </div>

    <div class="content">
      <div class="left-column">
        <!-- Celestia bağlantı durumu -->
        <CelestiaStatus />
        
        <!-- ZK devre durumu -->
        <ZkStatus />
        
        {#if !selectedFile}
          <FileUpload />
          <!-- Celestia işlem geçmişi -->
          <CelestiaTransactions />
        {:else}
          <div class="file-details">
            <div class="file-header">
              <div>
                <h2>{selectedFile.name}</h2>
                <p class="file-size">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MiB</p>
              </div>
              <button 
                class="change-file-button" 
                on:click={handleChangeFile}
              >
                Change File
              </button>
            </div>
            
            <!-- Advanced Features Section -->
            <div class="advanced-options">
              <h3>Advanced Features</h3>
              <div class="option-row">
                <label class="switch">
                  <input 
                    type="checkbox" 
                    bind:checked={isUsingCelestia}
                    on:change={toggleCelestiaUsage}
                  >
                  <span class="slider"></span>
                </label>
                <span>Celestia Data Availability</span>
              </div>
              <div class="option-row">
                <label class="switch">
                  <input 
                    type="checkbox" 
                    bind:checked={isUsingZKP}
                    on:change={toggleZKPUsage}
                  >
                  <span class="slider"></span>
                </label>
                <span>Zero Knowledge Verification</span>
              </div>
            </div>

            <div class="recipient-field">
              <label for="recipient">Recipient</label>
              <RecipientSearch on:select={handleRecipientSelect} />
              
              {#if selectedRecipient}
                <div class="selected-recipient">
                  <img 
                    src={selectedRecipient.avatar} 
                    alt="" 
                    class="recipient-avatar"
                  />
                  <div class="recipient-info">
                    <span class="recipient-name">{selectedRecipient.username}</span>
                    <code class="recipient-address">{selectedRecipient.publicKey}</code>
                  </div>
                </div>
              {/if}
            </div>

            <div class="message-field">
              <label for="message">Message</label>
              <textarea 
                id="message"
                bind:value={message}
                maxlength={MAX_MESSAGE_LENGTH}
                placeholder="Add a note (optional)"
                class="input-field"
              ></textarea>
              <span class="character-count">{message.length}/{MAX_MESSAGE_LENGTH}</span>
            </div>

            <button 
              class="send-button" 
              on:click={handleTransfer}
              disabled={isTransferring || !recipientAddress}
            >
              <span class="envelope-icon">📩</span>
              <span>{isTransferring ? 'Sending...' : 'Send'}</span>
            </button>
          </div>
        {/if}
      </div>

      <div class="divider"></div>

      <div class="right-column">
        <PayloadPreview 
          {selectedFile} 
          {ipfsHash} 
          {celestiaHeight}
          {celestiaTxHash}
          {celestiaUrl}
          {zkProofData}
        />
      </div>
    </div>
  </div>

  {#if showHelp}
    <HelpPage on:close={toggleHelp} />
  {/if}
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

  .upload-interface {
    width: 90%;
    max-width: 1200px;
    max-height: 90vh;
    background: var(--main-bg-color);
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    color: #000;
    display: flex;
    flex-direction: column;
  }

  .upload-interface.dark {
    background: #1a1a1a;
    color: #fff;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 2px dashed rgba(0, 0, 0, 0.3);
  }

  .dark .header {
    border-bottom: 2px dashed rgba(255, 255, 255, 0.3);
  }

  h1 {
    font-family: 'League Spartan', sans-serif;
    font-size: 2.5rem;
    font-weight: 600;
  }

  .header-buttons {
    display: flex;
    gap: 0.75rem;
  }

  .help-button {
    width: 40px;
    height: 40px;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    outline: none;
  }
  
  .help-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: #4285F4;
    color: white;
    font-weight: bold;
    font-size: 20px;
    border: 2px solid currentColor;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  .help-button:hover .help-icon {
    background: #5294FF;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
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
    border: 2px solid currentColor;
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
    color: currentColor;
    font-size: 28px;
    line-height: 1;
    font-weight: 400;
  }

  .content {
    display: grid;
    grid-template-columns: 1fr 2px 1fr;
    gap: 2rem;
    height: calc(100% - 100px);
    overflow: hidden;
  }

  .divider {
    height: 100%;
    width: 2px;
    background: rgba(0, 0, 0, 0.1);
  }

  .dark .divider {
    background: rgba(255, 255, 255, 0.1);
  }

  .left-column, .right-column {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    min-height: 0;
  }

  .file-details {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    height: 100%;
    min-height: 0;
  }

  .file-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-shrink: 0;
  }

  .file-header > div {
    flex: 1;
    margin-right: 1rem;
  }

  h2 {
    margin: 0;
    word-break: break-word;
  }

  .change-file-button {
    white-space: nowrap;
    padding: 0.5rem 1rem;
    background: rgba(0, 0, 0, 0.1);
    border: 2px solid rgba(0, 0, 0, 0.2);
    border-radius: 6px;
    font-family: 'League Spartan', sans-serif;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
    color: currentColor;
    flex-shrink: 0;
  }

  .dark .change-file-button {
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.2);
  }

  .change-file-button:hover {
    background: rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }

  .dark .change-file-button:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  .change-file-button:active {
    transform: translateY(1px);
  }

  .file-size {
    color: rgba(0, 0, 0, 0.6);
  }

  .dark .file-size {
    color: rgba(255, 255, 255, 0.6);
  }

  .recipient-field, .message-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  label {
    font-weight: 500;
    font-family: 'League Spartan', sans-serif;
  }

  .input-field {
    padding: 0.8rem;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    font-family: 'League Spartan', sans-serif;
    background: white;
    transition: all 0.2s ease;
    color: #000;
  }

  .dark .input-field {
    background: #2a2a2a;
    border: 2px solid rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .input-field:focus {
    border-color: rgba(0, 0, 0, 0.3);
    outline: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .dark .input-field:focus {
    border-color: rgba(255, 255, 255, 0.3);
    box-shadow: 0 2px 4px rgba(255, 255, 255, 0.1);
  }

  textarea.input-field {
    height: 100px;
    resize: none;
  }

  .character-count {
    align-self: flex-end;
    font-size: 0.8rem;
    color: rgba(0, 0, 0, 0.6);
  }

  .dark .character-count {
    color: rgba(255, 255, 255, 0.6);
  }

  .send-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.8rem;
    background: #000;
    color: #feffaf;
    border: none;
    padding: 1rem 2rem;
    font-family: 'League Spartan', sans-serif;
    font-size: 1.2rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: auto;
  }

  .dark .send-button {
    background: #feffaf;
    color: #000;
  }

  .send-button:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  .send-button:not(:disabled):active {
    transform: translateY(1px);
    box-shadow: none;
  }

  .send-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .selected-recipient {
    margin-top: 1rem;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .dark .selected-recipient {
    background: rgba(255, 255, 255, 0.05);
  }

  .recipient-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid rgba(0, 0, 0, 0.1);
  }

  .dark .recipient-avatar {
    border: 2px solid rgba(255, 255, 255, 0.1);
  }

  .recipient-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .recipient-name {
    font-weight: 500;
    font-size: 1.1rem;
  }

  .recipient-address {
    font-family: monospace;
    font-size: 0.9rem;
    background: rgba(0, 0, 0, 0.1);
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
  }

  .dark .recipient-address {
    background: rgba(255, 255, 255, 0.1);
  }

  /* New toggle styles */
  .advanced-options {
    background-color: rgba(0, 0, 0, 0.03);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .dark .advanced-options {
    background-color: rgba(255, 255, 255, 0.05);
  }
  
  .advanced-options h3 {
    font-size: 1rem;
    margin-top: 0;
    margin-bottom: 0.5rem;
  }
  
  .option-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0.5rem 0;
  }
  
  /* Toggle Switch Styles */
  .switch {
    position: relative;
    display: inline-block;
    width: 48px;
    height: 24px;
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
    background-color: #ccc;
    transition: .4s;
    border-radius: 24px;
  }
  
  .slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  }
  
  input:checked + .slider {
    background-color: #2196F3;
  }
  
  input:focus + .slider {
    box-shadow: 0 0 1px #2196F3;
  }
  
  input:checked + .slider:before {
    transform: translateX(24px);
  }
</style>