<script>
  import { createEventDispatcher } from 'svelte';
  import Sphere from './Sphere.svelte';
  
  const dispatch = createEventDispatcher();

  function handleUploadClick() {
    dispatch('showUpload');
  }
</script>

<div class="upload-container dashed-border" on:click={handleUploadClick} role="button" tabindex="0">
  <div class="upload-content">
    <div class="upload-text">UPLOAD</div>
    <div class="upload-icon">↑</div>
    <p>drag and drop a file</p>
    <p>or <span class="underline">browse</span> to upload</p>
  </div>
  <div class="sphere-container">
    <Sphere />
  </div>
</div>

<style>
  .upload-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 300px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
  }

  .upload-container:hover {
    transform: translateY(2px);
    background: rgba(0, 0, 0, 0.02);
  }

  .upload-container:active {
    transform: translateY(4px);
    background: rgba(0, 0, 0, 0.05);
  }

  .upload-content {
    text-align: center;
    width: 100%;
    z-index: 2;
  }

  .upload-text {
    font-family: 'League Spartan', sans-serif;
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
    letter-spacing: 0.05em;
  }

  .upload-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .underline {
    text-decoration: underline;
    cursor: pointer;
  }

  .sphere-container {
    perspective: 1000px;
    position: absolute;
    right: 2rem;
    z-index: 1;
  }

  /* Accessibility */
  .upload-container:focus {
    outline: 2px solid #000;
    outline-offset: -2px;
  }

  .upload-container:focus:not(:focus-visible) {
    outline: none;
  }
</style>