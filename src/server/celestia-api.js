// Celestia API Proxy Server
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3080;

// CORS ayarları
app.use(cors());
app.use(bodyParser.json());

// Celestia node yapılandırması
const CELESTIA_NODE_URL = 'http://localhost:26659';
const CELESTIA_AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBbGxvdyI6WyJwdWJsaWMiLCJyZWFkIiwid3JpdGUiLCJhZG1pbiJdLCJOb25jZSI6IlFJdno4WFc5WHdQQ3BNRkcxRG9QMTNVTk05NlNOQnFPeUtkcEdRaVFXaU09IiwiRXhwaXJlc0F0IjoiMDAwMS0wMS0wMVQwMDowMDowMFoifQ.Sbk2uLWPP53IY2qDIhTDnY0Z5ArkIrrU8sO1AM_x1tQ';

// Celestia RPC API proxy endpoint
app.post('/api/celestia', async (req, res) => {
  try {
    console.log('İstek alındı:', req.body);
    
    const response = await axios.post(
      CELESTIA_NODE_URL,
      req.body,
      {
        headers: {
          'Authorization': `Bearer ${CELESTIA_AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Celestia Yanıtı:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Celestia API hatası:', error.message);
    res.status(500).json({ 
      error: error.message,
      details: error.response?.data || 'Detay bulunamadı'
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
        }
      }
    );
    
    res.json({
      status: 'connected',
      nodeInfo: response.data
    });
  } catch (error) {
    console.error('Node durumu alınamadı:', error.message);
    res.status(500).json({ 
      status: 'disconnected',
      error: error.message
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
        }
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('Bakiye alınamadı:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Sunucuyu başlat
app.listen(port, () => {
  console.log(`Celestia API Proxy sunucusu şurada çalışıyor: http://localhost:${port}`);
}); 