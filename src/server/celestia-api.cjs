// Celestia API Proxy Server with Succinct integration
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

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

// Succinct Prover Network yapılandırması
const SUCCINCT_API_URL = 'https://testnet-api.succinct.xyz/api';
const SUCCINCT_API_KEY = 'YOUR_SUCCINCT_TESTNET_API_KEY'; // Gerçek API anahtarınızla değiştirin
const FILE_VERIFY_PROGRAM_ID = 'zkl-file-verify-v1';

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
    // CLI ile Celestia node bilgilerini getir
    const { stdout, stderr } = await execPromise(`celestia node info --url ${CELESTIA_NODE_URL} --token "${CELESTIA_AUTH_TOKEN}"`);
    
    if (stderr) {
      throw new Error(`CLI hatası: ${stderr}`);
    }
    
    console.log('Celestia node durumu (CLI):', stdout);
    const nodeInfo = JSON.parse(stdout);
    
    res.json({ 
      status: 'connected',
      nodeInfo: nodeInfo,
      timestamp: new Date().toISOString(),
      method: 'cli'
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

// CLI ile blob submit fonksiyonu
async function submitBlobWithCLI(namespace, data, gasPrice = 0.002) {
  try {
    console.log(`CLI ile blob gönderiliyor: namespace=${namespace}, data=${data.substring(0, 30)}... (${data.length} karakter)`);
    
    // CLI komutu oluştur - çift tırnak içinde veriyi gönder
    const command = `celestia blob submit ${namespace} "${data}" --gas.price ${gasPrice} --url ${CELESTIA_NODE_URL} --token "${CELESTIA_AUTH_TOKEN}"`;
    console.log('Çalıştırılan CLI komutu:', command);
    
    const { stdout, stderr } = await execPromise(command);
    
    if (stderr) {
      console.error('CLI stderr:', stderr);
    }
    
    console.log('CLI stdout:', stdout);
    return JSON.parse(stdout);
  } catch (error) {
    console.error('CLI ile blob submit hatası:', error.message);
    console.error('CLI komut çıktısı:', error.stdout, error.stderr);
    throw error;
  }
}

// CLI ile blob get-all fonksiyonu
async function getBlobWithCLI(height, namespace) {
  try {
    console.log(`CLI ile blob alınıyor: height=${height}, namespace=${namespace}`);
    
    // CLI komutu oluştur
    const command = `celestia blob get-all ${height} ${namespace} --url ${CELESTIA_NODE_URL} --token "${CELESTIA_AUTH_TOKEN}"`;
    console.log('Çalıştırılan CLI komutu:', command);
    
    const { stdout, stderr } = await execPromise(command);
    
    if (stderr) {
      console.error('CLI stderr:', stderr);
    }
    
    console.log('CLI stdout:', stdout);
    return JSON.parse(stdout);
  } catch (error) {
    console.error('CLI ile blob get-all hatası:', error.message);
    console.error('CLI komut çıktısı:', error.stdout, error.stderr);
    throw error;
  }
}

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
    
    // blob.Submit metodu için özel işlem - CLI kullan
    if (req.body.method === 'blob.Submit') {
      try {
        const blobs = req.body.params[0]; // İlk parametre blob dizisi
        const gasPrice = req.body.params[1] || 0.002; // İkinci parametre gas price
        
        console.log('Blob Detayları (CLI kullanılacak):');
        let allResults = [];
        
        // Her bir blob için CLI komutu çalıştır
        for (let i = 0; i < blobs.length; i++) {
          const blob = blobs[i];
          console.log(`Blob ${i}:`, {
            namespace: blob.namespace,
            data: blob.data ? `${blob.data.substring(0, 30)}... (${blob.data.length} karakter)` : 'VERİ YOK!',
            share_version: blob.share_version
          });
          
          const result = await submitBlobWithCLI(blob.namespace, blob.data, gasPrice);
          allResults.push(result);
        }
        
        // CLI sonucunu JSON-RPC formatında dönüştür
        const cliResult = allResults[0].result;
        console.log('CLI işlemi başarılı:', cliResult);
        
        // JSON-RPC uyumlu yanıt oluştur
        const jsonRpcResponse = {
          jsonrpc: "2.0",
          id: req.body.id,
          result: cliResult.height
        };
        
        res.json(jsonRpcResponse);
        return;
      } catch (cliError) {
        console.error('CLI ile blob submit hatası:', cliError);
        return res.status(500).json({ 
          error: `CLI ile blob submit hatası: ${cliError.message}`,
          code: 'CLI_ERROR',
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // blob.GetAll metodu için özel işlem - CLI kullan
    if (req.body.method === 'blob.GetAll') {
      try {
        const height = req.body.params[0];
        const namespaces = req.body.params[1];
        
        if (!Array.isArray(namespaces)) {
          return res.status(400).json({
            error: 'Namespace dizisi olmalı',
            timestamp: new Date().toISOString()
          });
        }
        
        const namespace = namespaces[0]; // İlk namespace'i al
        
        console.log('GetAll Detayları (CLI kullanılacak):');
        console.log(`  Yükseklik: ${height}`);
        console.log(`  Namespace: ${namespace}`);
        
        const result = await getBlobWithCLI(height, namespace);
        console.log('CLI ile blob alma başarılı:', result);
        
        // JSON-RPC uyumlu yanıt oluştur
        const jsonRpcResponse = {
          jsonrpc: "2.0",
          id: req.body.id,
          result: result.result
        };
        
        res.json(jsonRpcResponse);
        return;
      } catch (cliError) {
        console.error('CLI ile blob get-all hatası:', cliError);
        return res.status(500).json({ 
          error: `CLI ile blob get-all hatası: ${cliError.message}`,
          code: 'CLI_ERROR',
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Diğer metodlar için normal JSON-RPC kullan
    try {
      console.log('Celestia node\'una JSON-RPC isteği gönderiliyor:', JSON.stringify(req.body, null, 2));
      
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
      
      // Hata detaylarını daha ayrıntılı log'la
      console.error('Tam Hata:', error);
      
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
    // CLI ile node bilgilerini al
    const { stdout } = await execPromise(`celestia node info --url ${CELESTIA_NODE_URL} --token "${CELESTIA_AUTH_TOKEN}"`);
    const nodeInfo = JSON.parse(stdout);
    
    // Balans bilgisini al
    const { stdout: balanceStdout } = await execPromise(`celestia state balance --url ${CELESTIA_NODE_URL} --token "${CELESTIA_AUTH_TOKEN}"`);
    const balanceInfo = JSON.parse(balanceStdout);
    
    res.json({
      status: 'connected',
      nodeInfo: nodeInfo,
      balance: balanceInfo.result?.amount,
      denom: balanceInfo.result?.denom,
      timestamp: new Date().toISOString(),
      method: 'cli'
    });
  } catch (error) {
    console.error('Node durumu alınamadı:', {
      message: error.message
    });
    
    res.status(500).json({ 
      status: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Celestia bakiye endpoint'i
app.get('/api/celestia/balance', async (req, res) => {
  try {
    // CLI ile bakiye bilgilerini al
    const { stdout } = await execPromise(`celestia state balance --url ${CELESTIA_NODE_URL} --token "${CELESTIA_AUTH_TOKEN}"`);
    const balanceInfo = JSON.parse(stdout);
    
    res.json(balanceInfo);
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

// Doğrudan CLI komut çalıştırma endpoint'i (geliştirme/test için)
app.post('/api/celestia/run-cli', async (req, res) => {
  try {
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({
        error: 'Komut parametresi gerekli',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`CLI komutu çalıştırılıyor: ${command}`);
    
    const { stdout, stderr } = await execPromise(command);
    
    if (stderr) {
      console.warn('CLI stderr:', stderr);
    }
    
    console.log('CLI stdout:', stdout);
    
    try {
      // JSON olarak parse etmeyi dene
      const jsonResult = JSON.parse(stdout);
      res.json({
        result: jsonResult,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      // JSON olarak parse edilemiyorsa düz metin olarak döndür
      res.json({
        result: stdout,
        stderr: stderr || null,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('CLI çalıştırma hatası:', error);
    res.status(500).json({
      error: `CLI komutu çalıştırılamadı: ${error.message}`,
      stderr: error.stderr || null,
      timestamp: new Date().toISOString()
    });
  }
});

// ===== Succinct Prover Network Entegrasyonu =====

// Succinct Network durum kontrolü
app.get('/api/succinct/status', async (req, res) => {
  try {
    console.log('Succinct Network durumu kontrol ediliyor...');
    
    const response = await axios.get(
      `${SUCCINCT_API_URL}/status`,
      {
        headers: {
          'Authorization': `Bearer ${SUCCINCT_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    res.json({
      status: 'connected',
      networkInfo: response.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Succinct Network durumu alınamadı:', error.message);
    res.status(500).json({
      status: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Succinct Proof oluşturma endpoint'i
app.post('/api/succinct/generate-proof', async (req, res) => {
  try {
    const { ipfs_hash, secret } = req.body;
    
    if (!ipfs_hash) {
      return res.status(400).json({
        error: 'IPFS hash gerekli',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`Succinct Proof oluşturuluyor: IPFS Hash=${ipfs_hash}`);
    
    // Basit hash değeri hesaplama (frontend'in calculateHashValue fonksiyonuna benzer)
    const hashBuffer = Buffer.from(ipfs_hash);
    let hashValue = BigInt(0);
    const FIELD_SIZE = BigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617");
    
    for (let i = 0; i < hashBuffer.length; i++) {
      hashValue = (hashValue * BigInt(256) + BigInt(hashBuffer[i])) % FIELD_SIZE;
    }
    
    // Proof için input hazırlama
    const inputs = {
      ipfs_hash,
      hash_value: hashValue.toString(),
      secret: secret || "default-secret"
    };
    
    // Succinct API'ye proof isteği gönder
    const response = await axios.post(
      `${SUCCINCT_API_URL}/proofs/generate`,
      {
        program_id: FILE_VERIFY_PROGRAM_ID,
        inputs
      },
      {
        headers: {
          'Authorization': `Bearer ${SUCCINCT_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const proofRequest = response.data;
    console.log('Proof isteği oluşturuldu:', proofRequest);
    
    res.json({
      status: 'pending',
      request_id: proofRequest.request_id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Proof oluşturma hatası:', error.message);
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Proof durumu kontrol endpoint'i
app.get('/api/succinct/proof-status/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    
    if (!requestId) {
      return res.status(400).json({
        error: 'Request ID gerekli',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`Proof durumu kontrol ediliyor: ${requestId}`);
    
    const response = await axios.get(
      `${SUCCINCT_API_URL}/proofs/${requestId}`,
      {
        headers: {
          'Authorization': `Bearer ${SUCCINCT_API_KEY}`
        }
      }
    );
    
    res.json({
      ...response.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Proof durumu alınamadı:', error.message);
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Proof doğrulama endpoint'i
app.post('/api/succinct/verify-proof', async (req, res) => {
  try {
    const { proof, public_inputs } = req.body;
    
    if (!proof || !public_inputs) {
      return res.status(400).json({
        error: 'Proof ve public inputs gerekli',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('Proof doğrulanıyor...');
    
    const response = await axios.post(
      `${SUCCINCT_API_URL}/proofs/verify`,
      {
        program_id: FILE_VERIFY_PROGRAM_ID,
        proof,
        public_inputs
      },
      {
        headers: {
          'Authorization': `Bearer ${SUCCINCT_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    res.json({
      ...response.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Proof doğrulama hatası:', error.message);
    res.status(500).json({
      status: 'error',
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
  console.log(`Celestia & Succinct API Proxy sunucusu şurada çalışıyor: http://localhost:${port}`);
  console.log(`Celestia node port: ${CELESTIA_NODE_URL}`);
  console.log(`Succinct API: ${SUCCINCT_API_URL}`);
}); 