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

app.use(bodyParser.json());

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
      // Blob verilerini log'la
      try {
        const blobs = req.body.params[0]; // İlk parametre blob dizisi
        console.log('Blob Detayları:');
        blobs.forEach((blob, index) => {
          console.log(`Blob ${index}:`, {
            namespace: blob.namespace,
            data: blob.data ? `${blob.data}` : 'VERİ YOK!', // Veriyi olduğu gibi göster
            share_version: blob.share_version
          });
        });
      } catch (e) {
        console.error('Blob parse hatası:', e);
      }
    }
    
    try {
      const response = await axios.post(
        CELESTIA_NODE_URL,
        req.body, // Değişiklik yapmadan ilet
        {
          headers: {
            'Authorization': `Bearer ${CELESTIA_AUTH_TOKEN}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      console.log('Celestia Yanıtı:', response.data);
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