<script>
  import { themeStore } from './stores/themeStore.js';
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  $: isDark = $themeStore.isDark;
</script>

<div class="help-overlay" class:dark={isDark}>
  <div class="help-container">
    <div class="help-header">
      <h1>Celestia and ZK Integration</h1>
      <button 
        class="close-button" 
        on:click={() => dispatch('close')}
      >
        <div class="close-button-inner">
          <span class="close-icon">×</span>
        </div>
      </button>
    </div>
    
    <div class="help-content">
      <div class="section">
        <h2>What is Celestia Data Availability (DA)?</h2>
        <p>
          Celestia is a Data Availability (DA) layer that allows you to store a record of your file transfers on the blockchain.
          This ensures that your IPFS references are stored in a permanent and immutable way.
        </p>
        <div class="feature-box">
          <h3>Advantages of Celestia:</h3>
          <ul>
            <li>Immutable record for transfer proofs</li>
            <li>Verifiability by everyone</li>
            <li>True decentralized data persistence</li>
            <li>Transactions viewable through Explorer</li>
          </ul>
        </div>
      </div>
      
      <div class="section">
        <h2>What are Zero Knowledge Proofs (ZKP)?</h2>
        <p>
          Zero Knowledge Proofs are a cryptographic mechanism that allows you to prove the integrity of your file without revealing its content.
          It enables privacy-preserving verification of file transfers.
        </p>
        <div class="feature-box">
          <h3>Advantages of ZK Proofs:</h3>
          <ul>
            <li>Privacy-preserving verification</li>
            <li>Minimal data requirements</li>
            <li>Mathematically provable security</li>
            <li>Fast verification time</li>
          </ul>
        </div>
      </div>
      
      <div class="section">
        <h2>How to Use</h2>
        <ol>
          <li>
            <strong>Using Celestia DA:</strong> 
            Enable the "Celestia Data Availability" option when uploading your file.
            This ensures your IPFS hash is stored on the Celestia blockchain.
          </li>
          <li>
            <strong>Zero Knowledge Verification:</strong> 
            Enable the "Zero Knowledge Verification" option when uploading your file.
            This creates a ZK proof that preserves the integrity of your file.
          </li>
          <li>
            <strong>View Status:</strong>
            You can see the Celestia and ZK circuit statuses in the interface,
            and view Celestia transactions.
          </li>
        </ol>
      </div>
      
      <div class="section">
        <h2>More Information</h2>
        <p>
          For detailed technical information, setup steps, and advanced usage examples,
          please review the <a href="/docs/integration-details.md" target="_blank">integration documentation</a>.
        </p>
        <div class="buttons">
          <a href="https://celestia.org" target="_blank" class="external-link">
            Celestia Official Website
          </a>
          <a href="https://zkp.science" target="_blank" class="external-link">
            About ZK Proofs
          </a>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .help-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(3px);
  }
  
  .help-container {
    width: 90%;
    max-width: 1000px;
    max-height: 90vh;
    background: white;
    border-radius: 12px;
    box-shadow: 0 5px 25px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  
  .dark .help-container {
    background: #1a1a1a;
    color: #f0f0f0;
    box-shadow: 0 5px 25px rgba(255, 255, 255, 0.1);
  }
  
  .help-header {
    padding: 1.5rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid rgba(0, 0, 0, 0.1);
  }
  
  .dark .help-header {
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  h1 {
    margin: 0;
    font-size: 1.8rem;
    font-weight: 600;
  }
  
  .help-content {
    padding: 0 2rem 2rem;
    overflow-y: auto;
    flex: 1;
  }
  
  .section {
    margin: 2rem 0;
  }
  
  h2 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: #333;
  }
  
  .dark h2 {
    color: #e0e0e0;
  }
  
  h3 {
    font-size: 1.2rem;
    margin-bottom: 0.8rem;
  }
  
  p {
    line-height: 1.6;
    margin-bottom: 1.2rem;
  }
  
  ul, ol {
    padding-left: 1.5rem;
    margin-bottom: 1.5rem;
  }
  
  li {
    margin-bottom: 0.8rem;
    line-height: 1.5;
  }
  
  .feature-box {
    background: rgba(0, 0, 0, 0.03);
    border-radius: 8px;
    padding: 1.2rem;
    margin: 1rem 0;
  }
  
  .dark .feature-box {
    background: rgba(255, 255, 255, 0.05);
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
  
  .buttons {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    margin-top: 1.5rem;
  }
  
  .external-link {
    background: #2196F3;
    color: white;
    padding: 0.8rem 1.2rem;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 500;
    transition: all 0.2s ease;
  }
  
  .external-link:hover {
    background: #1976D2;
    transform: translateY(-2px);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
  }
  
  a {
    color: #2196F3;
    text-decoration: none;
  }
  
  .dark a {
    color: #64B5F6;
  }
  
  a:hover {
    text-decoration: underline;
  }
</style> 