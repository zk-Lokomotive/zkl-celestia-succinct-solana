<script>
  import { userDatabase } from './stores/database.js';
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  $: users = Object.values($userDatabase.users);
  $: sortedUsers = users.sort((a, b) => new Date(b.lastLogin) - new Date(a.lastLogin));

  function formatDate(dateString) {
    return new Date(dateString).toLocaleString();
  }
</script>

<div class="modal-overlay">
  <div class="user-management">
    <div class="header">
      <h1>zkλ/users</h1>
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
      <div class="users-list">
        {#if users.length === 0}
          <p class="no-users">No registered users found.</p>
        {:else}
          {#each sortedUsers as user}
            <div class="user-card">
              <div class="user-info">
                <img src={user.avatar} alt="User avatar" class="user-avatar"/>
                <div class="user-details">
                  <h3>{user.username}</h3>
                  <p class="wallet-address">{user.publicKey}</p>
                  <div class="timestamps">
                    <span>Registered: {formatDate(user.createdAt)}</span>
                    <span>Last Login: {formatDate(user.lastLogin)}</span>
                  </div>
                </div>
              </div>
            </div>
          {/each}
        {/if}
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

  .user-management {
    width: 90%;
    max-width: 1200px;
    height: 90vh;
    background: #feffaf;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
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
    flex: 1;
    overflow-y: auto;
  }

  .users-list {
    display: grid;
    gap: 1.5rem;
    padding: 1rem;
  }

  .no-users {
    text-align: center;
    font-size: 1.2rem;
    color: rgba(0, 0, 0, 0.6);
  }

  .user-card {
    background: rgba(255, 255, 255, 0.5);
    border: 2px dashed rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    padding: 1.5rem;
    transition: all 0.2s;
  }

  .user-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .user-info {
    display: flex;
    gap: 1.5rem;
    align-items: center;
  }

  .user-avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    border: 2px solid rgba(0, 0, 0, 0.1);
  }

  .user-details {
    flex: 1;
  }

  .user-details h3 {
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
  }

  .wallet-address {
    font-family: monospace;
    background: rgba(0, 0, 0, 0.05);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
  }

  .timestamps {
    display: flex;
    gap: 1rem;
    font-size: 0.9rem;
    color: rgba(0, 0, 0, 0.6);
  }

  .timestamps span {
    display: block;
  }
</style>