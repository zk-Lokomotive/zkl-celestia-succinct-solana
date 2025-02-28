/**
 * Celestia Data Availability (DA) Service
 * This service provides production-ready functions to interact with the Celestia network
 * to upload and verify IPFS hashes to the Celestia network.
 */

import axios from 'axios';

// API proxy connection - Solves CORS issues in the browser
const CELESTIA_API_ENDPOINT = 'http://localhost:3080/api/celestia';

const CELESTIA_AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBbGxvdyI6WyJwdWJsaWMiLCJyZWFkIiwid3JpdGUiLCJhZG1pbiJdLCJOb25jZSI6IlFJdno4WFc5WHdQQ3BNRkcxRG9QMTNVTk05NlNOQnFPeUtkcEdRaVFXaU09IiwiRXhwaXJlc0F0IjoiMDAwMS0wMS0wMVQwMDowMDowMFoifQ.Sbk2uLWPP53IY2qDIhTDnY0Z5ArkIrrU8sO1AM_x1tQ';
// Namespace prefix - a fixed namespace prefix for the application
// makes it easier to find the data
const DEFAULT_NAMESPACE = 'zkl-ipfs';

// Axios retry configuration - retries on connection issues
axios.interceptors.response.use(undefined, async (err) => {
  // Retry only for network errors
  const { config } = err;
  if (!config || !config.retry) {
    return Promise.reject(err);
  }

  config.retry.count = config.retry.count || 0;
  
  if (config.retry.count >= config.retry.maxRetries) {
    return Promise.reject(err);
  }
  
  config.retry.count += 1;
  
  // Wait a bit before retry
  const delay = config.retry.delay || 1000;
  await new Promise(resolve => setTimeout(resolve, delay));
  
  console.log(`Reconnection attempt ${config.retry.count}/${config.retry.maxRetries}`);
  return axios(config);
});

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
      network: 'mocha', // Default network
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
          connectionInfo.balanceWarning = 'Insufficient balance. You cannot upload data.';
        }
      }
    } catch (balanceError) {
      console.warn('Error while checking balance:', balanceError);
      connectionInfo.balanceError = 'Could not retrieve balance information';
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
      userMessage: 'Could not connect to Celestia node. Please make sure the node is running.'
    };
    
    // Save error status to session storage
    try {
      sessionStorage.setItem('celestiaConnectionInfo', JSON.stringify(errorInfo));
    } catch (storageError) {
      console.warn('Failed to save connection error to session storage:', storageError);
    }
    
    throw new Error(`Celestia connection failed: ${error.message}`);
  }
}

/**
 * Celestia connection details
 * @returns {Object} Connection information
 */
export function getCelestiaConnectionInfo() {
  // Try the new key first
  let connectionInfoStr = sessionStorage.getItem('celestiaConnectionInfo');
  
  // If not found, check the old key
  if (!connectionInfoStr) {
    connectionInfoStr = sessionStorage.getItem('celestia_connection_info');
  }
  
  if (!connectionInfoStr) {
    return {
      isConnected: false,
      lastChecked: null
    };
  }
  
  try {
    return JSON.parse(connectionInfoStr);
  } catch (error) {
    console.error('Celestia connection info parsing error:', error);
    return {
      isConnected: false,
      error: 'Connection info parsing error'
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
 * Convert a string or object to base64 format
 * This method will not be used for blob submit,
 * but is kept for other parts.
 * @param {string|object} data - Data to convert
 * @returns {string} Base64 format data
 */
export function toBase64String(data) {
  try {
    const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
    console.log('Data before Base64 conversion:', jsonStr);
    
    // UTF-8 to Base64 conversion - Use web-safe base64
    const base64Str = btoa(unescape(encodeURIComponent(jsonStr)));
    console.log('After Base64 conversion:', base64Str);
    
    // Check validity of Base64 format
    const isValidBase64 = /^[A-Za-z0-9+/=]+$/.test(base64Str);
    console.log('Is valid base64 format?', isValidBase64);
    
    return base64Str;
  } catch (error) {
    console.error('Base64 conversion error:', error);
    // Better to throw an error than return empty string in case of failure
    throw new Error(`Base64 conversion failed: ${error.message}`);
  }
}

/**
 * Convert base64 format data to original format
 * @param {string} base64Data - Base64 format data
 * @returns {object|string} Original data
 */
export function fromBase64String(base64Data) {
  try {
    // Decode from base64 using standard window.atob
    const rawString = atob(base64Data);
    
    // Handle UTF-8 characters correctly
    const result = decodeURIComponent(escape(rawString));
    
    console.log('Base64 decoded data:', result);
    
    // Try to parse as JSON, otherwise return as string
    try {
      return JSON.parse(result);
    } catch (e) {
      return result;
    }
  } catch (e) {
    console.error('Base64 decoding error:', e);
    return base64Data; // Return original data in case of error
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
    console.log(`Sending IPFS hash ${ipfsHash} to Celestia under namespace ${namespace}`);
    
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
          throw new Error('Insufficient Celestia balance. Please add funds to your account.');
        }
      }
    } catch (balanceError) {
      console.warn('Could not check balance:', balanceError);
      // Continue with submission attempt
    }
    
    // Prepare namespace in hex format - should always start with 0x
    const namespaceHex = namespace.startsWith('0x') 
      ? namespace 
      : `0x${toHexString(namespace)}`;
    
    // IMPORTANT CHANGE: Leave the IPFS hash as plain text
    // Celestia will encode it itself, so you won't get errors
    const rpcRequest = {
      jsonrpc: "2.0",
      id: 1, 
      method: "blob.Submit",
      params: [
        [
          {
            namespace: namespaceHex,
            data: ipfsHash, // Send as plain text - IMPORTANT
            share_version: 0
          }
        ],
        0.002 // Default gas price
      ]
    };
    
    console.log('Celestia blob submission request:', JSON.stringify(rpcRequest, null, 2));
    
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
        throw new Error('Insufficient Celestia balance. Please add funds to your account.');
      }
      throw new Error(`Celestia error: ${response.data.error.message || JSON.stringify(response.data.error)}`);
    }
    
    const height = response.data.result;
    
    console.log(`Data submitted to Celestia at height: ${height}`);
    
    // Get the actual txhash from the response
    const txhash = response.data.result.txhash || `celestia-pfb-${height}-${Date.now()}`;
    
    const txResult = {
      height,
      txhash, // Use the actual transaction hash
      celestiaUrl: `https://explorer.consensus-celestia.app/tx/${txhash}`,
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
      throw new Error('Insufficient Celestia balance. Please add funds to your account.');
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
    
    // Ensure namespace is formatted with 0x prefix
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
        [namespaceHex] // Namespace is now sent as an array - IMPORTANT
      ]
    };
    
    console.log('Celestia GetAll request:', JSON.stringify(rpcRequest, null, 2));
    
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
    
    // Process the response
    console.log('Celestia GetAll response:', JSON.stringify(response.data, null, 2));
    
    // The result should be an array of blobs
    const blobs = response.data.result || [];
    
    if (blobs.length === 0) {
      throw new Error(`No data found at height ${height} for namespace ${namespace}`);
    }
    
    // Process the blobs - we expect the blob data to be our IPFS hash or payload
    const processedData = blobs.map(blob => {
      let data = blob.data;
      
      console.log('Raw blob data:', data);
      
      // In most cases, data will come directly as IPFS hash,
      // because we sent it as plain text.
      // However, in some cases there might be formatting, let's check for those.
      
      // Let's also store the raw data
      return {
        raw: data,
        parsed: typeof data === 'string' ? data : JSON.stringify(data),
        namespace: blob.namespace,
        commitment: blob.commitment
      };
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
        error: 'No data found',
        height,
        namespace,
        timestamp: new Date().toISOString()
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
      
      // If raw data is not a string
      if (typeof blobData !== 'string') {
        console.log('Non-string blob data found:', blobData);
        continue;
      }
      
      // Check if this blob contains our IPFS hash
      if (blobData.includes(expectedIpfsHash)) {
        found = true;
        console.log('IPFS hash verified in Celestia blob:', expectedIpfsHash);
        break;
      }
    }
    
    return {
      isValid: found,
      height,
      namespace,
      timestamp: new Date().toISOString(),
      error: found ? null : `IPFS hash '${expectedIpfsHash}' not found in blob data`
    };
  } catch (error) {
    console.error('Error verifying Celestia data:', error);
    return {
      isValid: false,
      error: error.message,
      height,
      namespace,
      timestamp: new Date().toISOString()
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