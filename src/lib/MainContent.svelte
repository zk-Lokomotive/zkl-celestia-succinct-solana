<script>
  import { createEventDispatcher } from 'svelte';
  import { slide } from 'svelte/transition';
  import UploadSection from './UploadSection.svelte';
  import Inbox from './Inbox.svelte';
  import { walletStore } from './stores/wallet.js';

  const dispatch = createEventDispatcher();

  function handleUploadClick() {
    dispatch('showUpload');
  }
</script>

<main class="container">
  <div class="trust-section dashed-border">
    <h1>Do not trust <span class="underline">us</span>!</h1>
    <p>
      Send and receive your files, securely today with zk-Lokomotive's fully decentralized platform. 
      Powered by elliptic curve cryptography, Arweave, Solana, Ethereum and Wormhole; 
      <strong>zkλ</strong> ensures data integrity, confidentiality, and availability.
    </p>
    <p class="cia-note">That's the CIA triad, (not the terrorist one).</p>
  </div>

  <div class="content-grid">
    <UploadSection on:showUpload={handleUploadClick} />
    
    {#if $walletStore.connected}
      <div class="inbox-section" transition:slide>
        <Inbox />
      </div>
    {/if}
    
    <div class="ensure-section dashed-border">
      <h2>don't believe, ensure</h2>
      <p>
        Learn more about zk-Lokomotive's <span class="italic">never-before-seen</span> fully 
        decentralized architecture. When we say "decentralized", it's not a buzzword. We mean it.
      </p>
    </div>
  </div>
</main>

<style>
  .trust-section {
    margin-top: 2rem;
  }

  h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .underline {
    text-decoration: underline;
  }

  .cia-note {
    margin-top: 1rem;
    font-size: 0.9rem;
  }

  .content-grid {
    display: grid;
    gap: 2rem;
    margin: 2rem 0;
  }

  .inbox-section {
    opacity: 0;
    animation: fadeIn 0.3s ease-out forwards;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .ensure-section h2 {
    font-size: 2rem;
    margin-bottom: 1rem;
  }

  .italic {
    font-style: italic;
  }
</style>