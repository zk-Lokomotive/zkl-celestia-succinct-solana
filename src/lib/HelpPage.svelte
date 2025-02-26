<script>
  import { themeStore } from './stores/themeStore.js';
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  $: isDark = $themeStore.isDark;
</script>

<div class="help-overlay" class:dark={isDark}>
  <div class="help-container">
    <div class="help-header">
      <h1>Celestia ve ZK Entegrasyonu</h1>
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
        <h2>Celestia Data Availability (DA) Nedir?</h2>
        <p>
          Celestia, dosya transferlerinizin bir kaydını blokzincirde saklamanıza olanak tanıyan bir Data Availability (DA) katmanıdır. 
          Bu, dosyalarınızın IPFS referanslarının kalıcı ve değiştirilemez bir şekilde saklanmasını sağlar.
        </p>
        <div class="feature-box">
          <h3>Celestia'nın Avantajları:</h3>
          <ul>
            <li>Transfer kanıtları için değiştirilemez kayıt</li>
            <li>Herkes tarafından doğrulanabilirlik</li>
            <li>Gerçek merkeziyetsiz veri kalıcılığı</li>
            <li>Explorer üzerinden görüntülenebilir işlemler</li>
          </ul>
        </div>
      </div>
      
      <div class="section">
        <h2>Zero Knowledge Proofs (ZKP) Nedir?</h2>
        <p>
          Zero Knowledge Proofs, dosya içeriğini ifşa etmeden dosyanızın bütünlüğünü kanıtlamanıza olanak tanıyan kriptografik bir mekanizmadır.
          Gizlilik korumalı bir şekilde dosya transferlerinin doğrulanmasını sağlar.
        </p>
        <div class="feature-box">
          <h3>ZK Kanıtlarının Avantajları:</h3>
          <ul>
            <li>Gizlilik korumalı doğrulama</li>
            <li>Minimum veri gereksinimi</li>
            <li>Matematiksel olarak kanıtlanabilir güvenlik</li>
            <li>Hızlı doğrulama süresi</li>
          </ul>
        </div>
      </div>
      
      <div class="section">
        <h2>Nasıl Kullanılır?</h2>
        <ol>
          <li>
            <strong>Celestia DA Kullanımı:</strong> 
            Dosyanızı yüklerken "Celestia Data Availability" seçeneğini etkinleştirin. 
            Bu, IPFS hash'inizin Celestia blokzincirinde saklanmasını sağlar.
          </li>
          <li>
            <strong>Zero Knowledge Doğrulaması:</strong> 
            Dosyanızı yüklerken "Zero Knowledge Verification" seçeneğini etkinleştirin. 
            Bu, dosyanızın bütünlüğünü koruyan bir ZK kanıtı oluşturur.
          </li>
          <li>
            <strong>Durumu Görüntüle:</strong>
            Arayüzde Celestia ve ZK devre durumlarını görebilir, 
            Celestia işlemlerini görüntüleyebilirsiniz.
          </li>
        </ol>
      </div>
      
      <div class="section">
        <h2>Daha Fazla Bilgi</h2>
        <p>
          Detaylı teknik bilgiler, kurulum adımları ve gelişmiş kullanım örnekleri 
          için lütfen <a href="/docs/integration-details.md" target="_blank">entegrasyon belgesini</a> inceleyin.
        </p>
        <div class="buttons">
          <a href="https://celestia.org" target="_blank" class="external-link">
            Celestia Resmi Sitesi
          </a>
          <a href="https://zkp.science" target="_blank" class="external-link">
            ZK Kanıtları Hakkında
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