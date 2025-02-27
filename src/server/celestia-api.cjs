// Celestia API Proxy Server
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3080;

// CORS ayarları - tüm kaynaklara izin ver
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS']
}));

// JSON body parser, limit size for large blobs
app.use(bodyParser.json({ limit: '50mb' }));

// Celestia node yapılandırması
const CELESTIA_NODE_URL = 'http://localhost:26658';
const CELESTIA_AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBbGxvdyI6WyJwdWJsaWMiLCJyZWFkIiwid3JpdGUiLCJhZG1pbiJdLCJOb25jZSI6IlFJdno4WFc5WHdQQ3BNRkcxRG9QMTNVTk05NlNOQnFPeUtkcEdRaVFXaU09IiwiRXhwaXJlc0F0IjoiMDAwMS0wMS0wMVQwMDowMDowMFoifQ.Sbk2uLWPP53IY2qDIhTDnY0Z5ArkIrrU8sO1AM_x1tQ';

// Middlewares
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// API sağlık kontrolü endpoint'i
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API node durumu kontrolü
app.get('/api/node-status', async (req, res) => {
  try {
    // Celestia Node'a temel bir HTTP GET isteği gönder
    const response = await axios.get(`${CELESTIA_NODE_URL}`, {
      timeout: 2000,
      headers: {
        'Authorization': `Bearer ${CELESTIA_AUTH_TOKEN}`
      }
    });
    
    console.log('Celestia node yanıt verdi:', response.status);
    res.json({ 
      status: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Celestia node bağlantı hatası:', error.message);
    res.status(500).json({
      status: 'error',
      message: `Celestia node bağlantı hatası: ${error.message}`,
      timestamp: new Date().toISOString()
    });
  }
});

// Celestia RPC API proxy endpoint
app.post('/api/celestia', async (req, res) => {
  try {
    console.log(`İstek alındı [${new Date().toISOString()}]:`, JSON.stringify(req.body, null, 2));
    
    if (!req.body) {
      console.error('Geçersiz istek: Body eksik');
      return res.status(400).json({
        error: 'İstek body eksik',
        status: 'error'
      });
    }
    
    // blob.Submit metodu için özel işlem
    if (req.body.method === 'blob.Submit') {
      // Blob verilerini log'la - detaylı olarak
      try {
        const blobs = req.body.params[0]; // İlk parametre blob dizisi
        console.log('Blob Detayları:');
        blobs.forEach((blob, index) => {
          console.log(`Blob ${index}:`, {
            namespace: blob.namespace,
            data: blob.data ? `${blob.data.substring(0, 30)}... (${blob.data.length} karakter)` : 'VERİ YOK!',
            share_version: blob.share_version
          });
          
          // Namespace'in hex olup olmadığını kontrol et
          if (blob.namespace && !blob.namespace.startsWith('0x')) {
            console.warn(`UYARI: Namespace (${blob.namespace}) '0x' ile başlamıyor!`);
          }
          
          // Data formatını kontrol et (ek bilgi için)
          if (blob.data) {
            try {
              const isBase64 = /^[A-Za-z0-9+/=]+$/.test(blob.data);
              console.log(`  Base64 formatında mı: ${isBase64 ? 'Evet' : 'Hayır'}`);
            } catch (e) {
              console.log('  Format kontrolü hatası:', e.message);
            }
          }
        });
      } catch (e) {
        console.error('Blob parse hatası:', e);
      }
    }
    
    // blob.GetAll metodu için özel işlem 
    if (req.body.method === 'blob.GetAll') {
      try {
        // GetAll parametrelerini kontrol et
        const height = req.body.params[0];
        const namespaces = req.body.params[1];
        
        console.log('GetAll Detayları:');
        console.log(`  Yükseklik: ${height}`);
        console.log(`  Namespaces: ${JSON.stringify(namespaces)}`);
        
        // Namespace'in bir dizi olup olmadığını kontrol et
        if (!Array.isArray(namespaces)) {
          console.warn('UYARI: Namespace parametresi bir dizi değil! Dizi olmalı.');
          // Düzeltme yap - namespace'i diziye çevir
          req.body.params[1] = Array.isArray(namespaces) ? namespaces : [namespaces];
          console.log(`  Namespaces düzeltildi: ${JSON.stringify(req.body.params[1])}`);
        }
      } catch (e) {
        console.error('GetAll parametreleri parse hatası:', e);
      }
    }
    
    // İsteği doğrudan Celestia'ya ilet
    try {
      console.log('Celestia node\'una gönderiliyor:', JSON.stringify(req.body, null, 2));
      
      const response = await axios.post(
        CELESTIA_NODE_URL,
        req.body,
        {
          headers: {
            'Authorization': `Bearer ${CELESTIA_AUTH_TOKEN}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 saniye timeout
        }
      );
      
      console.log('Celestia Yanıtı:', JSON.stringify(response.data, null, 2));
      res.json(response.data);
    } catch (error) {
      console.error('Celestia API hatası:', {
        message: error.message,
        code: error.code,
        status: error.response?.status
      });
      
      if (error.response?.data) {
        console.error('Hata Detayları:', JSON.stringify(error.response.data, null, 2));
      }
      
      res.status(error.response?.status || 500).json({ 
        error: error.message,
        code: error.code,
        details: error.response?.data || 'Detay bulunamadı',
        timestamp: new Date().toISOString()
      });
    }
  } catch (globalError) {
    console.error('Global proxy hatası:', globalError);
    res.status(500).json({
      error: 'API proxy hatası',
      details: globalError.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Celestia node durumu endpoint'i
app.get('/api/celestia/status', async (req, res) => {
  try {
    const response = await axios.post(
      CELESTIA_NODE_URL,
      {
        jsonrpc: "2.0",
        id: 1,
        method: "node.Info",
        params: []
      },
      {
        headers: {
          'Authorization': `Bearer ${CELESTIA_AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }
    );
    
    res.json({
      status: 'connected',
      nodeInfo: response.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Node durumu alınamadı:', {
      message: error.message,
      code: error.code,
      status: error.response?.status
    });
    
    res.status(500).json({ 
      status: 'disconnected',
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    });
  }
});

// Celestia bakiye endpoint'i
app.get('/api/celestia/balance', async (req, res) => {
  try {
    const response = await axios.post(
      CELESTIA_NODE_URL,
      {
        jsonrpc: "2.0",
        id: 1,
        method: "state.Balance",
        params: []
      },
      {
        headers: {
          'Authorization': `Bearer ${CELESTIA_AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('Bakiye alınamadı:', error.message);
    res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// CLI ile blob gönderme yardımcı endpoint'i
app.get('/api/celestia/cli-help', (req, res) => {
  const cliCommand = `
  #!/bin/bash
  
  # IPFS hash'i Celestia CLI ile gönderme komutu:
  celestia blob submit 0x7a6b6c2d69706673 "IPFS_HASH_BURAYA" --url http://localhost:26658 --token "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBbGxvdyI6WyJwdWJsaWMiLCJyZWFkIiwid3JpdGUiLCJhZG1pbiJdLCJOb25jZSI6IlFJdno4WFc5WHdQQ3BNRkcxRG9QMTNVTk05NlNOQnFPeUtkcEdRaVFXaU09IiwiRXhwaXJlc0F0IjoiMDAwMS0wMS0wMVQwMDowMDowMFoifQ.Sbk2uLWPP53IY2qDIhTDnY0Z5ArkIrrU8sO1AM_x1tQ"
  
  # Örnek: 
  # celestia blob submit 0x7a6b6c2d69706673 "QmTPmBiqnUnL1k3W9GxmZTTtMSEX8rgpwqeCfYsJvodS2d" --url http://localhost:26658 --token "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBbGxvdyI6WyJwdWJsaWMiLCJyZWFkIiwid3JpdGUiLCJhZG1pbiJdLCJOb25jZSI6IlFJdno4WFc5WHdQQ3BNRkcxRG9QMTNVTk05NlNOQnFPeUtkcEdRaVFXaU09IiwiRXhwaXJlc0F0IjoiMDAwMS0wMS0wMVQwMDowMDowMFoifQ.Sbk2uLWPP53IY2qDIhTDnY0Z5ArkIrrU8sO1AM_x1tQ"
  `;
  
  res.json({
    message: 'Blob gönderimi için CLI komut örneği',
    command: cliCommand,
    timestamp: new Date().toISOString()
  });
});

// Genel hata yakalayıcı
app.use((err, req, res, next) => {
  console.error('Express hatası:', err);
  res.status(500).json({
    error: 'Sunucu hatası',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Var olmayan rotalar için handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Bulunamadı', 
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Sunucuyu başlat
app.listen(port, () => {
  console.log(`Celestia API Proxy sunucusu şurada çalışıyor: http://localhost:${port}`);
  console.log(`Celestia node'una bağlanıyor: ${CELESTIA_NODE_URL}`);
}); 