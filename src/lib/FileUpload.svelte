<script>
  import { createEventDispatcher } from 'svelte';
  import { fileStore } from './stores/fileStore.js';
  
  const dispatch = createEventDispatcher();
  let isDragging = false;
  let uploadError = null;

  function handleDragOver(e) {
    e.preventDefault();
    isDragging = true;
  }

  function handleDragLeave() {
    isDragging = false;
  }

  async function handleDrop(e) {
    e.preventDefault();
    isDragging = false;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFileSelect(files[0]);
    }
  }

  async function handleFileSelect(file) {
    if (!file) return;
    
    try {
      uploadError = null;
      await fileStore.uploadFile(file);
      dispatch('fileSelected', { file });
    } catch (error) {
      uploadError = error.message;
      console.error('Upload error:', error);
    }
  }

  function triggerFileInput() {
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.click();
  }
</script>

<div
  class="upload-area"
  class:dragging={isDragging}
  class:error={uploadError}
  on:dragover={handleDragOver}
  on:dragleave={handleDragLeave}
  on:drop={handleDrop}
  on:click={triggerFileInput}
>
  <input
    type="file"
    style="display: none"
    on:change={(e) => handleFileSelect(e.target.files[0])}
  />
  
  <div class="upload-content">
    <div class="upload-icon">↑</div>
    <p class="upload-text">UPLOAD</p>
    {#if uploadError}
      <p class="error-message">{uploadError}</p>
    {:else}
      <p>drag and drop a file</p>
      <p>or <span class="underline">browse</span> to upload</p>
    {/if}
  </div>
</div>

<style>
  .upload-area {
    border: 2px dashed rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    padding: 2rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    background: rgba(255, 255, 255, 0.1);
    min-height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .upload-area:hover:not(.error) {
    background: rgba(0, 0, 0, 0.05);
    transform: translateY(-2px);
  }

  .dragging {
    background: rgba(0, 0, 0, 0.1);
    border-color: rgba(0, 0, 0, 0.5);
  }

  .error {
    border-color: #ff4444;
    background: rgba(255, 68, 68, 0.1);
  }

  .upload-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .upload-text {
    font-family: 'League Spartan', sans-serif;
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
    letter-spacing: 0.05em;
  }

  .underline {
    text-decoration: underline;
  }

  .error-message {
    color: #ff4444;
    margin-top: 1rem;
    font-size: 0.9rem;
  }
</style>