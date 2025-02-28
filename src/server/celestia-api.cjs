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

// CORS settings - allow all sources
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS']
}));

// JSON body parser, limit size for large blobs
app.use(bodyParser.json({ limit: '50mb' }));

// Celestia node configuration
const CELESTIA_NODE_URL = 'http://localhost:26658';
const CELESTIA_AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBbGxvdyI6WyJwdWJsaWMiLCJyZWFkIiwid3JpdGUiLCJhZG1pbiJdLCJOb25jZSI6IlFJdno4WFc5WHdQQ3BNRkcxRG9QMTNVTk05NlNOQnFPeUtkcEdRaVFXaU09IiwiRXhwaXJlc0F0IjoiMDAwMS0wMS0wMVQwMDowMDowMFoifQ.Sbk2uLWPP53IY2qDIhTDnY0Z5ArkIrrU8sO1AM_x1tQ';

// Succinct Prover Network configuration
const SUCCINCT_API_URL = 'https://testnet-api.succinct.xyz/api';
const SUCCINCT_API_KEY = 'YOUR_SUCCINCT_TESTNET_API_KEY'; // Replace with your real API key
const FILE_VERIFY_PROGRAM_ID = 'zkl-file-verify-v1';

// Middlewares
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// API health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API node status check
app.get('/api/node-status', async (req, res) => {
  try {
    // Get Celestia node information with CLI
    const { stdout, stderr } = await execPromise(`celestia node info --url ${CELESTIA_NODE_URL} --token "${CELESTIA_AUTH_TOKEN}"`);
    
    if (stderr) {
      throw new Error(`CLI error: ${stderr}`);
    }
    
    console.log('Celestia node status (CLI):', stdout);
    const nodeInfo = JSON.parse(stdout);
    
    res.json({ 
      status: 'connected',
      nodeInfo: nodeInfo,
      timestamp: new Date().toISOString(),
      method: 'cli'
    });
  } catch (error) {
    console.error('Celestia node connection error:', error.message);
    res.status(500).json({
      status: 'error',
      message: `Celestia node connection error: ${error.message}`,
      timestamp: new Date().toISOString()
    });
  }
});

// Submit blob with CLI function
async function submitBlobWithCLI(namespace, data, gasPrice = 0.002) {
  try {
    console.log(`Sending blob with CLI: namespace=${namespace}, data=${data.substring(0, 30)}... (${data.length} characters)`);
    
    // Create CLI command - send data in double quotes
    const command = `celestia blob submit ${namespace} "${data}" --gas.price ${gasPrice} --url ${CELESTIA_NODE_URL} --token "${CELESTIA_AUTH_TOKEN}"`;
    console.log('Running CLI command:', command);
    
    const { stdout, stderr } = await execPromise(command);
    
    if (stderr) {
      console.error('CLI stderr:', stderr);
    }
    
    console.log('CLI stdout:', stdout);
    return JSON.parse(stdout);
  } catch (error) {
    console.error('Error submitting blob with CLI:', error.message);
    console.error('CLI command output:', error.stdout, error.stderr);
    throw error;
  }
}

// Get blob with CLI function
async function getBlobWithCLI(height, namespace) {
  try {
    console.log(`Getting blob with CLI: height=${height}, namespace=${namespace}`);
    
    // Create CLI command
    const command = `celestia blob get-all ${height} ${namespace} --url ${CELESTIA_NODE_URL} --token "${CELESTIA_AUTH_TOKEN}"`;
    console.log('Running CLI command:', command);
    
    const { stdout, stderr } = await execPromise(command);
    
    if (stderr) {
      console.error('CLI stderr:', stderr);
    }
    
    console.log('CLI stdout:', stdout);
    return JSON.parse(stdout);
  } catch (error) {
    console.error('Error getting blob with CLI:', error.message);
    console.error('CLI command output:', error.stdout, error.stderr);
    throw error;
  }
}

// Celestia RPC API proxy endpoint
app.post('/api/celestia', async (req, res) => {
  try {
    console.log(`Request received [${new Date().toISOString()}]:`, JSON.stringify(req.body, null, 2));
    
    if (!req.body) {
      console.error('Invalid request: Body missing');
      return res.status(400).json({
        error: 'Request body missing',
        status: 'error'
      });
    }
    
    // Special handling for blob.Submit method - use CLI
    if (req.body.method === 'blob.Submit') {
      try {
        const blobs = req.body.params[0]; // First parameter is blob array
        const gasPrice = req.body.params[1] || 0.002; // Second parameter is gas price
        
        console.log('Blob Details (using CLI):');
        let allResults = [];
        
        // Run CLI command for each blob
        for (let i = 0; i < blobs.length; i++) {
          const blob = blobs[i];
          console.log(`Blob ${i}:`, {
            namespace: blob.namespace,
            data: blob.data ? `${blob.data.substring(0, 30)}... (${blob.data.length} characters)` : 'NO DATA!',
            share_version: blob.share_version
          });
          
          const result = await submitBlobWithCLI(blob.namespace, blob.data, gasPrice);
          allResults.push(result);
        }
        
        // Convert CLI result to JSON-RPC format
        const cliResult = allResults[0].result;
        console.log('CLI operation successful:', cliResult);
        
        // Create JSON-RPC compatible response
        const jsonRpcResponse = {
          jsonrpc: "2.0",
          id: req.body.id,
          result: cliResult.height
        };
        
        res.json(jsonRpcResponse);
        return;
      } catch (cliError) {
        console.error('Error submitting blob with CLI:', cliError);
        return res.status(500).json({ 
          error: `Error submitting blob with CLI: ${cliError.message}`,
          code: 'CLI_ERROR',
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Special handling for blob.GetAll method - use CLI
    if (req.body.method === 'blob.GetAll') {
      try {
        const height = req.body.params[0];
        const namespaces = req.body.params[1];
        
        if (!Array.isArray(namespaces)) {
          return res.status(400).json({
            error: 'Namespace should be an array',
            timestamp: new Date().toISOString()
          });
        }
        
        const namespace = namespaces[0]; // Get first namespace
        
        console.log('GetAll Details (using CLI):');
        console.log(`  Height: ${height}`);
        console.log(`  Namespace: ${namespace}`);
        
        const result = await getBlobWithCLI(height, namespace);
        console.log('Successfully got blob with CLI:', result);
        
        // Create JSON-RPC compatible response
        const jsonRpcResponse = {
          jsonrpc: "2.0",
          id: req.body.id,
          result: result.result
        };
        
        res.json(jsonRpcResponse);
        return;
      } catch (cliError) {
        console.error('Error getting blob with CLI:', cliError);
        return res.status(500).json({ 
          error: `Error getting blob with CLI: ${cliError.message}`,
          code: 'CLI_ERROR',
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Use normal JSON-RPC for other methods
    try {
      console.log('Sending JSON-RPC request to Celestia node:', JSON.stringify(req.body, null, 2));
      
      const response = await axios.post(
        CELESTIA_NODE_URL,
        req.body,
        {
          headers: {
            'Authorization': `Bearer ${CELESTIA_AUTH_TOKEN}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 seconds timeout
        }
      );
      
      console.log('Celestia Response:', JSON.stringify(response.data, null, 2));
      res.json(response.data);
    } catch (error) {
      console.error('Celestia API error:', {
        message: error.message,
        code: error.code,
        status: error.response?.status
      });
      
      // Log error details more thoroughly
      console.error('Full Error:', error);
      
      if (error.response?.data) {
        console.error('Error Details:', JSON.stringify(error.response.data, null, 2));
      }
      
      res.status(error.response?.status || 500).json({ 
        error: error.message,
        code: error.code,
        details: error.response?.data || 'No details found',
        timestamp: new Date().toISOString()
      });
    }
  } catch (globalError) {
    console.error('Global proxy error:', globalError);
    res.status(500).json({
      error: 'API proxy error',
      details: globalError.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Celestia node status endpoint
app.get('/api/celestia/status', async (req, res) => {
  try {
    // Get node information with CLI
    const { stdout } = await execPromise(`celestia node info --url ${CELESTIA_NODE_URL} --token "${CELESTIA_AUTH_TOKEN}"`);
    const nodeInfo = JSON.parse(stdout);
    
    // Get balance information
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
    console.error('Could not get node status:', {
      message: error.message
    });
    
    res.status(500).json({ 
      status: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Celestia balance endpoint
app.get('/api/celestia/balance', async (req, res) => {
  try {
    // Get balance information with CLI
    const { stdout } = await execPromise(`celestia state balance --url ${CELESTIA_NODE_URL} --token "${CELESTIA_AUTH_TOKEN}"`);
    const balanceInfo = JSON.parse(stdout);
    
    res.json(balanceInfo);
  } catch (error) {
    console.error('Could not get balance:', error.message);
    res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// CLI blob submission helper endpoint
app.get('/api/celestia/cli-help', (req, res) => {
  const cliCommand = `
  #!/bin/bash
  
  # Command to send IPFS hash with Celestia CLI:
  celestia blob submit 0x7a6b6c2d69706673 "IPFS_HASH_HERE" --url http://localhost:26658 --token "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBbGxvdyI6WyJwdWJsaWMiLCJyZWFkIiwid3JpdGUiLCJhZG1pbiJdLCJOb25jZSI6IlFJdno4WFc5WHdQQ3BNRkcxRG9QMTNVTk05NlNOQnFPeUtkcEdRaVFXaU09IiwiRXhwaXJlc0F0IjoiMDAwMS0wMS0wMVQwMDowMDowMFoifQ.Sbk2uLWPP53IY2qDIhTDnY0Z5ArkIrrU8sO1AM_x1tQ"
  
  # Example: 
  # celestia blob submit 0x7a6b6c2d69706673 "QmTPmBiqnUnL1k3W9GxmZTTtMSEX8rgpwqeCfYsJvodS2d" --url http://localhost:26658 --token "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBbGxvdyI6WyJwdWJsaWMiLCJyZWFkIiwid3JpdGUiLCJhZG1pbiJdLCJOb25jZSI6IlFJdno4WFc5WHdQQ3BNRkcxRG9QMTNVTk05NlNOQnFPeUtkcEdRaVFXaU09IiwiRXhwaXJlc0F0IjoiMDAwMS0wMS0wMVQwMDowMDowMFoifQ.Sbk2uLWPP53IY2qDIhTDnY0Z5ArkIrrU8sO1AM_x1tQ"
  `;
  
  res.json({
    message: 'CLI command example for blob submission',
    command: cliCommand,
    timestamp: new Date().toISOString()
  });
});

// Direct CLI command execution endpoint (for development/testing)
app.post('/api/celestia/run-cli', async (req, res) => {
  try {
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({
        error: 'Command parameter required',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`Running CLI command: ${command}`);
    
    const { stdout, stderr } = await execPromise(command);
    
    if (stderr) {
      console.warn('CLI stderr:', stderr);
    }
    
    console.log('CLI stdout:', stdout);
    
    try {
      // Try to parse as JSON
      const jsonResult = JSON.parse(stdout);
      res.json({
        result: jsonResult,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      // Return as plain text if not parseable as JSON
      res.json({
        result: stdout,
        stderr: stderr || null,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('CLI execution error:', error);
    res.status(500).json({
      error: `Could not execute CLI command: ${error.message}`,
      stderr: error.stderr || null,
      timestamp: new Date().toISOString()
    });
  }
});

// ===== Succinct Prover Network Integration =====

// Succinct Network status check
app.get('/api/succinct/status', async (req, res) => {
  try {
    console.log('Checking Succinct Network status...');
    
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
    console.error('Could not get Succinct Network status:', error.message);
    res.status(500).json({
      status: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Succinct Proof generation endpoint
app.post('/api/succinct/generate-proof', async (req, res) => {
  try {
    const { ipfs_hash, secret } = req.body;
    
    if (!ipfs_hash) {
      return res.status(400).json({
        error: 'IPFS hash required',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`Generating Succinct Proof: IPFS Hash=${ipfs_hash}`);
    
    // Simple hash value calculation (similar to frontend's calculateHashValue function)
    const hashBuffer = Buffer.from(ipfs_hash);
    let hashValue = BigInt(0);
    const FIELD_SIZE = BigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617");
    
    for (let i = 0; i < hashBuffer.length; i++) {
      hashValue = (hashValue * BigInt(256) + BigInt(hashBuffer[i])) % FIELD_SIZE;
    }
    
    // Prepare input for proof
    const inputs = {
      ipfs_hash,
      hash_value: hashValue.toString(),
      secret: secret || "default-secret"
    };
    
    // Send proof request to Succinct API
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
    console.log('Proof request created:', proofRequest);
    
    res.json({
      status: 'pending',
      request_id: proofRequest.request_id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating proof:', error.message);
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Proof status check endpoint
app.get('/api/succinct/proof-status/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    
    if (!requestId) {
      return res.status(400).json({
        error: 'Request ID required',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`Checking proof status: ${requestId}`);
    
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
    console.error('Could not get proof status:', error.message);
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Proof verification endpoint
app.post('/api/succinct/verify-proof', async (req, res) => {
  try {
    const { proof, public_inputs } = req.body;
    
    if (!proof || !public_inputs) {
      return res.status(400).json({
        error: 'Proof and public inputs required',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('Verifying proof...');
    
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
    console.error('Proof verification error:', error.message);
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// General error handler
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({
    error: 'Server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Handler for non-existent routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found', 
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(port, () => {
  console.log(`Celestia & Succinct API Proxy server running at: http://localhost:${port}`);
  console.log(`Celestia node port: ${CELESTIA_NODE_URL}`);
  console.log(`Succinct API: ${SUCCINCT_API_URL}`);
}); 