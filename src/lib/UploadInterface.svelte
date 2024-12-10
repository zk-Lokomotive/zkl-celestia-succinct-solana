<script>
  import { createEventDispatcher } from 'svelte';
  import { fileStore } from './stores/fileStore.js';
  import FileUpload from './FileUpload.svelte';
  
  const dispatch = createEventDispatcher();
  const MAX_MESSAGE_LENGTH = 128;
  
  let recipientAddress = "";
  let message = "";
  let isTransferring = false;

  $: selectedFile = $fileStore.selectedFile;
  $: transferStatus = $fileStore.transferStatus;
  $: ipfsHash = $fileStore.ipfsHash;
  $: isUploading = $fileStore.isUploading;

  async function handleTransfer() {
    if (!selectedFile || !recipientAddress) return;
    
    isTransferring = true;
    try {
      await fileStore.transferFile(recipientAddress, message);
      // Reset form after successful transfer
      recipientAddress = "";
      message = "";
    } catch (error) {
      console.error('Transfer failed:', error);
    } finally {
      isTransferring = false;
    }
  }

  function handleFileSelected(event) {
    // Additional handling if needed
  }

  function handleChangeFile() {
    fileStore.reset();
  }
</script>

<div class="modal-overlay">
  <div class="upload-interface">
    <div class="header">
      <h1>zkλ/upload</h1>
      <button 
        class="close-button" 
        on:click={() => dispatch('close')}
      >
        <div class="close-button-inner">
          <span class="close-icon">×</span>
        </div>
      </button>
    </div>

    <div class="content">
      <div class="left-column">
        {#if !selectedFile}
          <FileUpload on:fileSelected={handleFileSelected} />
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
            
            <div class="recipient-field">
              <label for="recipient">Recipient</label>
              <input 
                type="text" 
                id="recipient"
                bind:value={recipientAddress}
                placeholder="Enter recipient's wallet address"
                class="input-field"
              />
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
              <span class="envelope-icon">✉</span>
              <span>{isTransferring ? 'Sending...' : 'Send'}</span>
            </button>
          </div>
        {/if}
      </div>

      <div class="divider"></div>

      <div class="right-column">
        <div class="preview-frame">
          <div class="preview-content">
            <h3>Payload Preview</h3>
            {#if ipfsHash}
              <p>File uploaded successfully!</p>
              <div class="fingerprint">
                <code>IPFS: {ipfsHash}</code>
                <button class="copy-button">Copy</button>
              </div>
              <p class="security-note">
                Share this IPFS hash with the recipient for verification.
              </p>
            {:else}
              <p>Upload a file to see its preview and IPFS hash.</p>
            {/if}
          </div>
        </div>
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

  .upload-interface {
    width: 90%;
    max-width: 1200px;
    height: 90vh;
    background: #feffaf;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 2px dashed rgba(0, 0, 0, 0.3);
  }

  h1 {
    font-family: 'League Spartan', sans-serif;
    font-size: 2.5rem;
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

  .content {
    display: grid;
    grid-template-columns: 1fr 2px 1fr;
    gap: 2rem;
    height: calc(100% - 100px);
  }

  .divider {
    height: 100%;
    width: 2px;
    background: rgba(0, 0, 0, 0.1);
  }

  .left-column {
    padding: 1rem;
    display: flex;
    flex-direction: column;
  }

  .file-details {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .file-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .change-file-button {
    padding: 0.5rem 1rem;
    background: rgba(0, 0, 0, 0.1);
    border: 2px solid rgba(0, 0, 0, 0.2);
    border-radius: 6px;
    font-family: 'League Spartan', sans-serif;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .change-file-button:hover {
    background: rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }

  .change-file-button:active {
    transform: translateY(1px);
  }

  .file-size {
    color: rgba(0, 0, 0, 0.6);
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
  }

  .input-field:focus {
    border-color: rgba(0, 0, 0, 0.3);
    outline: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

  .envelope-icon {
    font-size: 1.4rem;
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

  .right-column {
    padding: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .preview-frame {
    border: 2px dashed rgba(0, 0, 0, 0.3);
    padding: 2rem;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .preview-content {
    text-align: center;
  }

  .fingerprint {
    margin: 2rem 0;
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: center;
  }

  .copy-button {
    padding: 0.5rem 1rem;
    background: rgba(0, 0, 0, 0.1);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .copy-button:hover {
    background: rgba(0, 0, 0, 0.2);
  }

  .security-note {
    font-size: 0.9rem;
    color: rgba(0, 0, 0, 0.6);
  }
</style>