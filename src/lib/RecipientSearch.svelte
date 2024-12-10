<script>
    import { createEventDispatcher } from 'svelte';
    import { userDatabase } from './stores/database.js';
    
    const dispatch = createEventDispatcher();
    let searchQuery = '';
    let showDropdown = false;
  
    $: users = Object.values($userDatabase.users);
    $: filteredUsers = searchQuery 
      ? users.filter(user => 
          user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.publicKey.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : users;
  
    function selectRecipient(user) {
      dispatch('select', user);
      searchQuery = '';
      showDropdown = false;
    }
  </script>
  
  <div class="search-container">
    <input
      type="text"
      bind:value={searchQuery}
      on:focus={() => showDropdown = true}
      placeholder="Search recipients..."
      class="search-input"
    />
    
    {#if showDropdown && filteredUsers.length > 0}
      <div class="dropdown">
        {#each filteredUsers as user}
          <button 
            class="recipient-option"
            on:click={() => selectRecipient(user)}
          >
            <img src={user.avatar} alt="" class="recipient-avatar"/>
            <div class="recipient-info">
              <span class="recipient-name">{user.username}</span>
              <span class="recipient-address">{user.publicKey}</span>
            </div>
          </button>
        {/each}
      </div>
    {/if}
  </div>
  
  <style>
    .search-container {
      position: relative;
      width: 100%;
    }
  
    .search-input {
      width: 100%;
      padding: 0.8rem;
      border: 2px solid rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      font-family: 'League Spartan', sans-serif;
      background: white;
      transition: all 0.2s ease;
    }
  
    .search-input:focus {
      border-color: rgba(0, 0, 0, 0.3);
      outline: none;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  
    .dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 2px solid rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      margin-top: 0.5rem;
      max-height: 300px;
      overflow-y: auto;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  
    .recipient-option {
      width: 100%;
      padding: 0.8rem;
      border: none;
      background: none;
      display: flex;
      align-items: center;
      gap: 1rem;
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
    }
  
    .recipient-option:hover {
      background: rgba(0, 0, 0, 0.05);
    }
  
    .recipient-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
    }
  
    .recipient-info {
      display: flex;
      flex-direction: column;
    }
  
    .recipient-name {
      font-weight: 500;
    }
  
    .recipient-address {
      font-size: 0.8rem;
      color: rgba(0, 0, 0, 0.6);
      font-family: monospace;
    }
  </style>