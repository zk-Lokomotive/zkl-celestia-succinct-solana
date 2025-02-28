<script>
    import { fade, fly } from 'svelte/transition';
    import { themeStore } from './stores/themeStore.js';
    export let selectedFile = null;
    export let ipfsHash = null;
  
    // New props
    export let celestiaHeight = null;
    export let celestiaTxHash = null;
    export let celestiaUrl = null;
    export let zkProofData = null;
    export let succinctTxHash = null;
    export let succinctTxUrl = null;

    $: isDark = $themeStore.isDark;
  
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

    // Truncate filename
    function truncateFilename(filename, maxLength = 20) {
      if (!filename) return '';
      
      if (filename.length <= maxLength) return filename;
      
      const extension = filename.split('.').pop();
      const nameWithoutExt = filename.substring(0, filename.length - extension.length - 1);
      
      if (nameWithoutExt.length <= maxLength - 6) return filename;
      
      return `${nameWithoutExt.substring(0, maxLength - 6)}...${extension}`;
    }
    
    // Truncate hashes
    function truncateHash(hash, start = 6, end = 4) {
      if (!hash) return '';
      return `${hash.substring(0, start)}...${hash.substring(hash.length - end)}`;
    }

    // Safe getters for file properties
    function getFileName() {
      return selectedFile && selectedFile.name ? selectedFile.name : 'Unknown';
    }
    
    function getFileSize() {
      return selectedFile && typeof selectedFile.size === 'number' 
        ? (selectedFile.size / 1024).toFixed(2) 
        : '0';
    }
    
    function getFileType() {
      return selectedFile && selectedFile.type ? selectedFile.type : 'Unknown';
    }
    
    // Safe getter for zkProofData timestamp
    function getProofTimestamp() {
      try {
        if (zkProofData && typeof zkProofData === 'object' && zkProofData.timestamp) {
          return new Date(zkProofData.timestamp).toLocaleString();
        }
        return 'Unknown';
      } catch (e) {
        return 'Unknown';
      }
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
    class:dark={isDark}
    role="region"
    aria-label="File Preview Card"
  >
    <div class="preview-content">
      <h2 class="preview-title">File Summary</h2>
      
      {#if !selectedFile && !ipfsHash}
        <div class="empty-state">
          <p>Upload your file to see its preview here.</p>
        </div>
      {:else}
        {#if selectedFile}
          <div class="preview-section">
            <h3>File Information</h3>
            <div class="preview-detail">
              <span class="detail-label">Filename:</span>
              <span class="detail-value">{truncateFilename(getFileName())}</span>
            </div>
            <div class="preview-detail">
              <span class="detail-label">Size:</span>
              <span class="detail-value">{getFileSize()} KB</span>
            </div>
            <div class="preview-detail">
              <span class="detail-label">Type:</span>
              <span class="detail-value">{getFileType()}</span>
            </div>
          </div>
        {/if}
        
        {#if ipfsHash}
          <div class="preview-section">
            <h3>IPFS Information</h3>
            <div class="preview-detail">
              <span class="detail-label">CID:</span>
              <span class="detail-value hash">{truncateHash(ipfsHash)}</span>
            </div>
            <div class="detail-actions">
              <button class="action-button">Open in IPFS</button>
              <button class="action-button">Copy CID</button>
            </div>
          </div>
        {/if}

        <!-- Succinct zkVM Transaction Information -->
        {#if succinctTxHash}
          <div class="preview-section succinct-section">
            <h3>Succinct zkVM Verification</h3>
            <div class="preview-detail">
              <span class="detail-label">Status:</span>
              <span class="detail-value success">Verified ✓</span>
            </div>
            <div class="preview-detail">
              <span class="detail-label">TX Hash:</span>
              <span class="detail-value hash">{truncateHash(succinctTxHash, 8, 6)}</span>
            </div>
            <div class="preview-detail">
              <span class="detail-label">Recipient:</span>
              <span class="detail-value hash">0x2800733fe8CB3018210bC3AC6B179dC5037a27DC</span>
            </div>
            <div class="preview-detail">
              <span class="detail-label">Amount:</span>
              <span class="detail-value">0.00001</span>
            </div>
            <div class="detail-actions">
              {#if succinctTxUrl}
                <a 
                  href={succinctTxUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  class="action-button succinct-button"
                >
                  View in Succinct Explorer
                </a>
              {/if}
            </div>
            <p class="info-text">This file has been verified using Succinct zkVM with a real transaction.</p>
          </div>
        {:else if ipfsHash}
          <div class="preview-section disabled">
            <h3>Succinct zkVM</h3>
            <p class="info-text">No Succinct verification has been created for this file.</p>
          </div>
        {/if}

        <!-- Celestia Data Availability Information -->
        {#if celestiaTxHash && celestiaHeight}
          <div class="preview-section">
            <h3>Celestia Data Availability</h3>
            <div class="preview-detail">
              <span class="detail-label">Block Height:</span>
              <span class="detail-value">{celestiaHeight}</span>
            </div>
            <div class="preview-detail">
              <span class="detail-label">Transaction Hash:</span>
              <span class="detail-value hash">{truncateHash(celestiaTxHash)}</span>
            </div>
            <div class="detail-actions">
              {#if celestiaUrl}
                <a 
                  href={celestiaUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  class="action-button"
                >
                  Open in Celestia Explorer
                </a>
              {/if}
            </div>
            <p class="info-text">This file has been permanently stored on the Celestia data layer.</p>
          </div>
        {:else if ipfsHash}
          <div class="preview-section disabled">
            <h3>Celestia DA</h3>
            <p class="info-text">No Celestia DA record has been created for this file.</p>
          </div>
        {/if}

        <!-- Zero Knowledge Proof Information (keeping for reference but updating title) -->
        {#if zkProofData}
          <div class="preview-section">
            <h3>Zero Knowledge Verification</h3>
            <div class="preview-detail">
              <span class="detail-label">Status:</span>
              <span class="detail-value success">Verified ✓</span>
            </div>
            <div class="preview-detail">
              <span class="detail-label">Created:</span>
              <span class="detail-value">{getProofTimestamp()}</span>
            </div>
            <p class="info-text">A privacy-preserving verification proof has been created for this file.</p>
          </div>
        {:else if ipfsHash && !succinctTxHash}
          <div class="preview-section disabled">
            <h3>Zero Knowledge Verification</h3>
            <p class="info-text">No ZK Proof has been created for this file.</p>
          </div>
        {/if}
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
  
    .preview-container.dark {
      background-color: rgba(255, 255, 255, 0.05);
    }
  
    .preview-content {
      padding: 2rem;
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
  
    .preview-title {
      margin-top: 0;
      margin-bottom: 1.5rem;
      border-bottom: 1px dashed rgba(0, 0, 0, 0.1);
      padding-bottom: 0.5rem;
    }
  
    .dark .preview-title {
      border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
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
  
    .dark .empty-state {
      color: rgba(255, 255, 255, 0.6);
    }
  
    .preview-section {
      margin-bottom: 2rem;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      padding: 1rem;
      background-color: rgba(255, 255, 255, 0.7);
    }
  
    .dark .preview-section {
      background-color: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .succinct-section {
      border: 1px solid rgba(76, 29, 149, 0.4);
      background-color: rgba(76, 29, 149, 0.05);
    }
    
    .dark .succinct-section {
      border: 1px solid rgba(139, 92, 246, 0.4);
      background-color: rgba(139, 92, 246, 0.1);
    }
  
    .preview-section.disabled {
      opacity: 0.6;
    }
  
    .preview-section h3 {
      margin-top: 0;
      margin-bottom: 1rem;
      font-size: 1rem;
    }
  
    .preview-detail {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }
  
    .detail-label {
      font-weight: 500;
      color: rgba(0, 0, 0, 0.7);
    }
  
    .dark .detail-label {
      color: rgba(255, 255, 255, 0.7);
    }
  
    .detail-value {
      font-family: "Monaco", monospace;
    }
  
    .detail-value.hash {
      color: #1a73e8;
    }
  
    .dark .detail-value.hash {
      color: #64b5f6;
    }
  
    .detail-value.success {
      color: #0caf60;
    }
  
    .detail-actions {
      display: flex;
      justify-content: space-between;
      margin-top: 1rem;
    }
  
    .action-button {
      background-color: rgba(0, 0, 0, 0.05);
      border: none;
      padding: 0.5rem 0.75rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.8rem;
      transition: all 0.2s ease;
      text-decoration: none;
      color: inherit;
    }
    
    .succinct-button {
      background-color: rgba(76, 29, 149, 0.2);
      color: rgba(76, 29, 149, 0.9);
    }
    
    .dark .succinct-button {
      background-color: rgba(139, 92, 246, 0.2);
      color: rgba(139, 92, 246, 0.9);
    }
  
    .action-button:hover {
      background-color: rgba(0, 0, 0, 0.1);
      transform: translateY(-1px);
    }
  
    .dark .action-button {
      background-color: rgba(255, 255, 255, 0.1);
    }
  
    .dark .action-button:hover {
      background-color: rgba(255, 255, 255, 0.15);
    }
  
    .info-text {
      font-size: 0.8rem;
      font-style: italic;
      margin-top: 1rem;
      opacity: 0.7;
    }
  </style>