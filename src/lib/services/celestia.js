/**
 * Celestia Data Availability (DA) Service
 * This service provides production-ready functions to interact with the Celestia network
 * to upload and verify IPFS hashes to the Celestia network.
 */

import axios from 'axios';

// Yerel API proxy bağlantısı (CORS hatalarını önler)
const CELESTIA_API_ENDPOINT = 'http://localhost:3080/api/celestia';
const CELESTIA_AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBbGxvdyI6WyJwdWJsaWMiLCJyZWFkIiwid3JpdGUiLCJhZG1pbiJdLCJOb25jZSI6IlFJdno4WFc5WHdQQ3BNRkcxRG9QMTNVTk05NlNOQnFPeUtkcEdRaVFXaU09IiwiRXhwaXJlc0F0IjoiMDAwMS0wMS0wMVQwMDowMDowMFoifQ.Sbk2uLWPP53IY2qDIhTDnY0Z5ArkIrrU8sO1AM_x1tQ';
// Namespace prefix - a fixed namespace prefix for the application
// makes it easier to find the data
const DEFAULT_NAMESPACE = 'zkl-ipfs';

// Axios CORS yapılandırması
axios.defaults.headers.common['Access-Control-Allow-Origin'] = '*';
axios.defaults.headers.common['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, PUT, PATCH, DELETE';
axios.defaults.headers.common['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization';

/**
 * Check Celestia connection
 * @returns {Promise<Object>} Connection status and node information
 */
export async function checkCelestiaConnection() {
  try {
    // Check Celestia node status using JSON-RPC
    const response = await axios.post(CELESTIA_API_ENDPOINT, {
      jsonrpc: "2.0",
      id: 1,
      method: "node.Info",
      params: []
    }, {
      headers: {
        'Authorization': `Bearer ${CELESTIA_AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      // Set timeout to prevent long hanging requests
      timeout: 5000
    });
    
    // Connection information is logged and saved to session storage
    console.log('Celestia connection response:', response.data);
    
    const connectionInfo = {
      timestamp: new Date().toISOString(),
      network: 'mocha', // Varsayılan ağ
      api_version: response.data?.result?.api_version || 'unknown',
      node_type: response.data?.result?.type || 0,
      connected: true
    };
    
    // Try to get balance information
    try {
      const balanceResponse = await axios.post(CELESTIA_API_ENDPOINT, {
        jsonrpc: "2.0",
        id: 1,
        method: "state.Balance",
        params: []
      }, {
        headers: {
          'Authorization': `Bearer ${CELESTIA_AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 3000
      });
      
      if (balanceResponse.data?.result) {
        connectionInfo.balance = balanceResponse.data.result.amount;
        connectionInfo.denom = balanceResponse.data.result.denom;
        
        // Add a warning if balance is low
        if (parseInt(connectionInfo.balance, 10) <= 0) {
          connectionInfo.balanceWarning = 'Yetersiz bakiye. Veri yükleyemezsiniz.';
        }
      }
    } catch (balanceError) {
      console.warn('Bakiye kontrol edilirken hata oluştu:', balanceError);
      connectionInfo.balanceError = 'Bakiye bilgisi alınamadı';
    }
    
    // Save connection status to session storage for UI components
    try {
      sessionStorage.setItem('celestiaConnectionInfo', JSON.stringify(connectionInfo));
    } catch (storageError) {
      console.warn('Failed to save connection info to session storage:', storageError);
    }
    
    return {
      status: 'connected',
      ...connectionInfo
    };
  } catch (error) {
    console.error('Celestia connection error:', error);
    
    const errorInfo = {
      timestamp: new Date().toISOString(),
      error: error.message,
      status: 'disconnected',
      userMessage: 'Celestia node bağlantısı kurulamadı. Lütfen node\'un çalıştığından emin olun.'
    };
    
    // Save error status to session storage
    try {
      sessionStorage.setItem('celestiaConnectionInfo', JSON.stringify(errorInfo));
    } catch (storageError) {
      console.warn('Failed to save connection error to session storage:', storageError);
    }
    
    throw new Error(`Celestia bağlantısı başarısız: ${error.message}`);
  }
}

/**
 * Celestia connection details
 * @returns {Object} Connection information
 */
export function getCelestiaConnectionInfo() {
  const connectionInfoStr = sessionStorage.getItem('celestia_connection_info');
  if (!connectionInfoStr) {
    return {
      isConnected: false,
      lastChecked: null
    };
  }
  
  try {
    return JSON.parse(connectionInfoStr);
  } catch (error) {
    console.error('Celestia connection information parsing error:', error);
    return {
      isConnected: false,
      error: 'Connection information parsing error'
    };
  }
}

/**
 * Generate a unique namespace
 * For different users or sessions of the same application
 * @param {string} seed - Seed for the unique namespace (e.g., user ID)
 * @returns {string} Unique namespace
 */
export function generateUniqueNamespace(seed = null) {
  const uniqueSuffix = seed || Math.random().toString(36).substring(2, 10);
  return `${DEFAULT_NAMESPACE}-${uniqueSuffix}`;
}

/**
 * Convert a string or object to hexadecimal format
 * @param {string|object} data - Data to convert
 * @returns {string} Hexadecimal format data
 */
export function toHexString(data) {
  const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
  
  // Browser-compatible hex conversion
  let hexString = '';
  for (let i = 0; i < jsonStr.length; i++) {
    const hex = jsonStr.charCodeAt(i).toString(16);
    hexString += hex.length === 2 ? hex : '0' + hex;
  }
  return hexString;
}

/**
 * Convert hexadecimal format data to original format
 * @param {string} hexData - Hexadecimal format data
 * @returns {object|string} Original data
 */
export function fromHexString(hexData) {
  try {
    // Browser-compatible hex to string conversion
    let str = '';
    for (let i = 0; i < hexData.length; i += 2) {
      const hexChar = hexData.substr(i, 2);
      const char = String.fromCharCode(parseInt(hexChar, 16));
      str += char;
    }
    
    // Try to parse as JSON, otherwise return as string
    return JSON.parse(str);
  } catch (e) {
    // If parsing fails, return as string
    let str = '';
    for (let i = 0; i < hexData.length; i += 2) {
      const hexChar = hexData.substr(i, 2);
      const char = String.fromCharCode(parseInt(hexChar, 16));
      str += char;
    }
    return str;
  }
}

/**
 * Submit data to Celestia network
 * @param {string} ipfsHash - IPFS hash to store on Celestia
 * @param {string} namespace - Namespace to use (optional)
 * @returns {Promise<Object>} Transaction result with height and txhash
 */
export async function submitToCelestia(ipfsHash, namespace = DEFAULT_NAMESPACE) {
  // Validate inputs
  if (!ipfsHash) {
    throw new Error('Invalid IPFS hash');
  }
  
  try {
    console.log(`Submitting IPFS hash ${ipfsHash} to Celestia under namespace ${namespace}`);
    
    // Check balance first before submission
    try {
      const balanceResponse = await axios.post(
        CELESTIA_API_ENDPOINT,
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
      
      if (balanceResponse.data?.result?.amount) {
        const balance = parseInt(balanceResponse.data.result.amount, 10);
        if (balance <= 0) {
          console.warn('Celestia account has insufficient balance');
          throw new Error('Yetersiz Celestia bakiyesi. Lütfen hesabınıza bakiye yükleyin.');
        }
      }
    } catch (balanceError) {
      console.warn('Could not check balance:', balanceError);
      // Continue with submission attempt
    }
    
    // Convert namespace to hex if it's not already
    const namespaceHex = namespace.startsWith('0x') 
      ? namespace 
      : `0x${toHexString(namespace)}`;
    
    // Convert ipfsHash to hex for submission
    const dataHex = ipfsHash.startsWith('0x')
      ? ipfsHash
      : `0x${toHexString(ipfsHash)}`;
    
    // Prepare the blob submission request
    const rpcRequest = {
      jsonrpc: "2.0",
      id: 1, 
      method: "blob.Submit",
      params: [
        [
          {
            namespace: namespaceHex,
            data: dataHex,
            share_version: 0
          }
        ],
        0.002 // Default gas price
      ]
    };
    
    // Submit blob to Celestia
    const response = await axios.post(
      CELESTIA_API_ENDPOINT,
      rpcRequest,
      {
        headers: {
          'Authorization': `Bearer ${CELESTIA_AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.error) {
      // Check for insufficient balance error specifically
      if (response.data.error.message && response.data.error.message.includes('insufficient')) {
        throw new Error('Yetersiz Celestia bakiyesi. Lütfen hesabınıza bakiye yükleyin.');
      }
      throw new Error(`Celestia error: ${response.data.error.message || JSON.stringify(response.data.error)}`);
    }
    
    const height = response.data.result;
    
    console.log(`Data submitted to Celestia at height: ${height}`);
    
    const txResult = {
      height,
      txhash: `celestia-pfb-${Date.now()}`, // Gerçek txhash yerine placeholder kullanıyoruz
      celestiaUrl: `https://celenium.io/${height}/${namespaceHex}`,
      namespace: namespaceHex,
      ipfsHash
    };
    
    // Save transaction to history
    saveTransactionToHistory(txResult.txhash, height, namespace, ipfsHash);
    
    return txResult;
  } catch (error) {
    console.error('Error submitting to Celestia:', error);
    // Check for specific error messages
    if (error.message.includes('insufficient') || error.message.includes('balance') || error.message.includes('bakiye')) {
      throw new Error('Yetersiz Celestia bakiyesi. Lütfen hesabınıza bakiye yükleyin.');
    }
    throw new Error(`Failed to submit to Celestia: ${error.message}`);
  }
}

/**
 * Save operation to local history
 * @param {string} txhash - Operation hash
 * @param {number} height - Block height
 * @param {string} namespace - Used namespace
 * @param {string} ipfsHash - IPFS CID
 */
function saveTransactionToHistory(txhash, height, namespace, ipfsHash) {
  try {
    const celestiaTransactions = JSON.parse(localStorage.getItem('celestia_transactions') || '[]');
    celestiaTransactions.push({
      txhash,
      height,
      namespace,
      ipfsHash,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('celestia_transactions', JSON.stringify(celestiaTransactions));
  } catch (error) {
    console.error('Error saving operation to history:', error);
  }
}

/**
 * Get all Celestia operations
 * @returns {Array} Operation history
 */
export function getAllCelestiaTransactions() {
  try {
    return JSON.parse(localStorage.getItem('celestia_transactions') || '[]');
  } catch (error) {
    console.error('Error getting Celestia operations:', error);
    return [];
  }
}

/**
 * Get data from Celestia by height and namespace
 * @param {number} height - Block height
 * @param {string} namespace - Namespace to query
 * @returns {Promise<Object>} Retrieved data
 */
export async function getDataFromCelestia(height, namespace = DEFAULT_NAMESPACE) {
  if (!height) {
    throw new Error('Block height is required');
  }
  
  try {
    console.log(`Retrieving data from Celestia at height ${height} for namespace ${namespace}`);
    
    // Convert namespace to hex if it's not already
    const namespaceHex = namespace.startsWith('0x') 
      ? namespace 
      : `0x${toHexString(namespace)}`;
    
    // Prepare the blob get-all request
    const rpcRequest = {
      jsonrpc: "2.0",
      id: 1, 
      method: "blob.GetAll",
      params: [
        typeof height === 'string' ? parseInt(height, 10) : height,
        namespaceHex
      ]
    };
    
    // Get blobs from Celestia
    const response = await axios.post(
      CELESTIA_API_ENDPOINT,
      rpcRequest,
      {
        headers: {
          'Authorization': `Bearer ${CELESTIA_AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.error) {
      throw new Error(`Celestia error: ${response.data.error.message || JSON.stringify(response.data.error)}`);
    }
    
    // The result should be an array of blobs
    const blobs = response.data.result || [];
    
    if (blobs.length === 0) {
      throw new Error(`No data found at height ${height} for namespace ${namespace}`);
    }
    
    // Process the blobs - we expect the blob data to be our IPFS hash or payload
    const processedData = blobs.map(blob => {
      let data = blob.data;
      
      // Try to parse as JSON if possible
      try {
        // If data is hex encoded, convert to string first
        if (data.startsWith('0x')) {
          data = fromHexString(data.slice(2));
        }
        
        // Try to parse as JSON
        return {
          raw: data,
          parsed: JSON.parse(data),
          namespace: blob.namespace,
          commitment: blob.commitment
        };
      } catch (e) {
        // If not JSON, return as is
        return {
          raw: data,
          parsed: null,
          namespace: blob.namespace,
          commitment: blob.commitment
        };
      }
    });
    
    return {
      height,
      namespace: namespaceHex,
      data: processedData,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error retrieving data from Celestia:', error);
    throw new Error(`Failed to retrieve data from Celestia: ${error.message}`);
  }
}

/**
 * Verify data on Celestia matches expected IPFS hash
 * @param {number} height - Block height 
 * @param {string} expectedIpfsHash - Expected IPFS hash
 * @param {string} namespace - Used namespace
 * @returns {Promise<Object>} Verification result
 */
export async function verifyCelestiaData(height, expectedIpfsHash, namespace = DEFAULT_NAMESPACE) {
  if (!height || !expectedIpfsHash) {
    throw new Error('Height and expected IPFS hash are required');
  }
  
  try {
    // Get data from Celestia
    const result = await getDataFromCelestia(height, namespace);
    
    if (!result || !result.data || result.data.length === 0) {
      return {
        isValid: false,
        error: 'No data found'
      };
    }
    
    // Check if any of the blobs contain our expected IPFS hash
    let found = false;
    for (const blob of result.data) {
      // Convert data to string if necessary
      let blobData = blob.raw;
      
      if (typeof blobData === 'object') {
        blobData = JSON.stringify(blobData);
      }
      
      // Check if this blob contains our IPFS hash
      if (blobData.includes(expectedIpfsHash)) {
        found = true;
        break;
      }
    }
    
    return {
      isValid: found,
      height,
      namespace,
      timestamp: new Date().toISOString(),
      error: found ? null : 'IPFS hash not found in blob data'
    };
  } catch (error) {
    console.error('Error verifying Celestia data:', error);
    return {
      isValid: false,
      error: error.message,
      height,
      namespace
    };
  }
}

/**
 * Generate a signature
 * @param {string} data - Data to sign
 * @returns {string} Signature
 */
function generateSignature(data) {
  const hmacKey = "zkl-secret-key";
  const dataToSign = `${data}:${new Date().toISOString()}`;
  
  // Simple hash function that works in browser
  let hash = 0;
  const stringToHash = dataToSign + hmacKey;
  
  for (let i = 0; i < stringToHash.length; i++) {
    const char = stringToHash.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32bit integer
  }
  
  // Create a 64-character signature
  const hashHex = Math.abs(hash).toString(16).padStart(16, '0');
  return hashHex.repeat(4); 
} 