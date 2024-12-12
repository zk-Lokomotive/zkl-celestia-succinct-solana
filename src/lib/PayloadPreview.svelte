<script>
    import { fade, fly } from 'svelte/transition';
    export let selectedFile = null;
    export let ipfsHash = null;
  
    let isHovered = false;
    let rotation = { x: 0, y: 0 };
    
    function handleMouseMove(event) {
      if (!isHovered) return;
      const container = event.currentTarget;
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      rotation.x = (y - centerY) / 20;
      rotation.y = (x - centerX) / 20;
    }
  </script>
  
  <div 
    class="preview-container"
    on:mousemove={handleMouseMove}
    on:mouseenter={() => isHovered = true}
    on:mouseleave={() => {
      isHovered = false;
      rotation = { x: 0, y: 0 };
    }}
    style="transform: perspective(1000px) rotateX({rotation.x}deg) rotateY({rotation.y}deg)"
  >
    <div class="preview-content">
      <h3>Payload Preview</h3>
      
      {#if selectedFile}
        <div class="preview-card" in:fly={{ y: 20, duration: 400 }}>
          <div class="file-icon">📄</div>
          <div class="file-details">
            <p class="file-name">{selectedFile.name}</p>
            <p class="file-size">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MiB</p>
          </div>
          
          {#if ipfsHash}
            <div class="ipfs-details" in:fade={{ duration: 300, delay: 200 }}>
              <code class="ipfs-hash">IPFS: {ipfsHash}</code>
              <div class="status-indicator">
                <span class="dot"></span>
                Ready to transfer
              </div>
            </div>
          {/if}
        </div>
        
        <div class="security-info" in:fade={{ duration: 300, delay: 400 }}>
          <div class="security-item">
            <span class="icon">🔒</span>
            <span>End-to-end encrypted</span>
          </div>
          <div class="security-item">
            <span class="icon">⚡</span>
            <span>Decentralized storage</span>
          </div>
          <div class="security-item">
            <span class="icon">✨</span>
            <span>Zero-knowledge proof</span>
          </div>
        </div>
      {:else}
        <div class="empty-state" in:fade>
          <div class="upload-icon">↑</div>
          <p>Upload a file to see its preview</p>
        </div>
      {/if}
    </div>
  </div>
  
  <style>
    .preview-container {
      height: 100%;
      transition: transform 0.1s ease;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      overflow: hidden;
      border: 2px dashed rgba(0, 0, 0, 0.3);
    }
  
    .preview-content {
      padding: 2rem;
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
  
    h3 {
      font-family: 'League Spartan', sans-serif;
      font-size: 1.8rem;
      margin: 0;
      text-align: center;
    }
  
    .preview-card {
      background: rgba(255, 255, 255, 0.5);
      padding: 1.5rem;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  
    .file-icon {
      font-size: 3rem;
    }
  
    .file-details {
      text-align: center;
    }
  
    .file-name {
      font-weight: 500;
      margin: 0;
    }
  
    .file-size {
      color: rgba(0, 0, 0, 0.6);
      margin: 0.5rem 0 0 0;
    }
  
    .ipfs-details {
      width: 100%;
      padding-top: 1rem;
      margin-top: 1rem;
      border-top: 1px dashed rgba(0, 0, 0, 0.3);
      text-align: center;
    }
  
    .ipfs-hash {
      display: block;
      font-family: monospace;
      background: rgba(0, 0, 0, 0.05);
      padding: 0.5rem;
      border-radius: 4px;
      margin-bottom: 0.5rem;
    }
  
    .status-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: rgba(0, 0, 0, 0.8);
    }
  
    .dot {
      width: 8px;
      height: 8px;
      background: #4CAF50;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
  
    @keyframes pulse {
      0% { transform: scale(0.95); opacity: 0.5; }
      50% { transform: scale(1.05); opacity: 1; }
      100% { transform: scale(0.95); opacity: 0.5; }
    }
  
    .security-info {
      margin-top: auto;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
  
    .security-item {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      font-size: 0.9rem;
      color: rgba(0, 0, 0, 0.8);
    }
  
    .icon {
      font-size: 1.2rem;
    }
  
    .empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      color: rgba(0, 0, 0, 0.6);
    }
  
    .upload-icon {
      font-size: 3rem;
      animation: float 3s ease-in-out infinite;
    }
  
    @keyframes float {
      0% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
      100% { transform: translateY(0); }
    }
  </style>