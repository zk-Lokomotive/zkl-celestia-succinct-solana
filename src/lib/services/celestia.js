/**
 * Celestia Data Availability (DA) Service
 * This service provides production-ready functions to interact with the Celestia network
 * to upload and verify IPFS hashes to the Celestia network.
 */

import axios from 'axios';

// Celestia light client API endpoint
// These details are used to connect to the actual Celestia network
const CELESTIA_API_ENDPOINT = 'http://localhost:26659';
const CELESTIA_AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBbGxvdyI6WyJwdWJsaWMiLCJyZWFkIiwid3JpdGUiLCJhZG1pbiJdLCJOb25jZSI6IlFJdno4WFc5WHdQQ3BNRkcxRG9QMTNVTk05NlNOQnFPeUtkcEdRaVFXaU09IiwiRXhwaXJlc0F0IjoiMDAwMS0wMS0wMVQwMDowMDowMFoifQ.Sbk2uLWPP53IY2qDIhTDnY0Z5ArkIrrU8sO1AM_x1tQ';
// Namespace prefix - a fixed namespace prefix for the application
// makes it easier to find the data
const DEFAULT_NAMESPACE = 'zkl-ipfs';

/**
 * Check Celestia connection
 * @returns {Promise<Object>} Connection status and node information
 */
export async function checkCelestiaConnection() {
  try {
    // Check Celestia node status
    const response = await axios.get(`${CELESTIA_API_ENDPOINT}/header/status`, {
      headers: {
        'Authorization': `Bearer ${CELESTIA_AUTH_TOKEN}`
      },
      // Set timeout to prevent long hanging requests
      timeout: 5000
    });
    
    // Connection information is logged and saved to session storage
    console.log('Celestia connection response:', response.data);
    
    const connectionInfo = {
      timestamp: new Date().toISOString(),
      network: response.data?.network || 'unknown',
      height: response.data?.height || 0,
      lastHeightRecorded: response.data?.height || 0,
      isConnected: true
    };
    
    sessionStorage.setItem('celestia_connection_info', JSON.stringify(connectionInfo));
    
    return connectionInfo;
  } catch (error) {
    console.error('Celestia node connection error:', error);
    
    const connectionInfo = {
      timestamp: new Date().toISOString(),
      error: error.message || 'Network connection error',
      isConnected: false
    };
    
    sessionStorage.setItem('celestia_connection_info', JSON.stringify(connectionInfo));
    
    throw new Error(`Celestia node connection error: ${error.message || 'Network connection error'}`);
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
 * Upload IPFS hash to Celestia
 * @param {string} ipfsHash - IPFS CID
 * @param {string} namespace - Optional custom namespace
 * @returns {Promise<Object>} Operation result
 */
export async function submitToCelestia(ipfsHash, namespace = DEFAULT_NAMESPACE) {
  try {
    // Convert namespace to hexadecimal format using browser-compatible method
    let namespaceHex = '';
    for (let i = 0; i < namespace.length; i++) {
      const hex = namespace.charCodeAt(i).toString(16);
      namespaceHex += hex.length === 2 ? hex : '0' + hex;
    }
    
    // Create payload containing IPFS hash and metadata
    const payload = {
      ipfsHash,
      timestamp: new Date().toISOString(),
      signature: generateSignature(ipfsHash),
      metadata: {
        source: 'zkl-file-transfer',
        version: '1.0.0'
      }
    };
    
    // Convert payload to string and then to hexadecimal format
    const data = toHexString(payload);
    
    // Send SubmitPayForBlob request to Celestia
    const response = await axios.post(
      `${CELESTIA_API_ENDPOINT}/submit_pfb`,
      {
        namespace_id: namespaceHex,
        data: data,
        gas_limit: 100000,
        fee: 10000
      },
      {
        headers: {
          'Authorization': `Bearer ${CELESTIA_AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );
    
    // Get returned height and txhash information
    const { height, txhash } = response.data;
    console.log('Celestia upload successful:', { height, txhash, namespace });
    
    // Save operation to localStorage (for past tracking)
    saveTransactionToHistory(txhash, height, namespace, ipfsHash);
    
    // Create Celestia explorer URL
    const celestiaUrl = `https://celenium.io/tx/${txhash}`;
    
    return { 
      height, 
      txhash, 
      namespace,
      celestiaUrl,
      explorerUrl: celestiaUrl,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Celestia upload error:', error);
    throw new Error(`Celestia data upload failed: ${error.message || 'Network connection error'}`);
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
 * Get data from Celestia
 * @param {number} height - Block height
 * @param {string} namespace - Used namespace
 * @returns {Promise<Object>} Retrieved data
 */
export async function getDataFromCelestia(height, namespace = DEFAULT_NAMESPACE) {
  try {
    // Convert namespace to hexadecimal format using browser-compatible method
    let namespaceHex = '';
    for (let i = 0; i < namespace.length; i++) {
      const hex = namespace.charCodeAt(i).toString(16);
      namespaceHex += hex.length === 2 ? hex : '0' + hex;
    }
    
    // Get data from specified height and namespace
    const response = await axios.get(
      `${CELESTIA_API_ENDPOINT}/namespaced_shares/${namespaceHex}/height/${height}`,
      {
        headers: {
          'Authorization': `Bearer ${CELESTIA_AUTH_TOKEN}`
        },
        timeout: 10000 // 10 second timeout
      }
    );
    
    if (!response.data || !response.data.shares || response.data.shares.length === 0) {
      throw new Error('Data not found');
    }
    
    // Convert hexadecimal format data to original format
    const hexData = response.data.shares[0]; // Get first share
    return fromHexString(hexData);
  } catch (error) {
    console.error('Error getting data from Celestia:', error);
    throw new Error(`Celestia data retrieval failed: ${error.message || 'Network connection error'}`);
  }
}

/**
 * Verify data
 * @param {number} height - Block height
 * @param {string} expectedIpfsHash - Expected IPFS hash
 * @param {string} namespace - Used namespace
 * @returns {Promise<Object>} Verification result
 */
export async function verifyCelestiaData(height, expectedIpfsHash, namespace = DEFAULT_NAMESPACE) {
  try {
    const data = await getDataFromCelestia(height, namespace);
    
    // Verify IPFS hash
    if (data.ipfsHash !== expectedIpfsHash) {
      throw new Error('IPFS hash mismatch');
    }
    
    return {
      isValid: true,
      data
    };
  } catch (error) {
    console.error('Verification error:', error);
    return {
      isValid: false,
      error: error.message || 'Verification failed'
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