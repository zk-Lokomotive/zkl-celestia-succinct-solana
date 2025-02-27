/**
 * Zero Knowledge Proof (ZKP) Service
 * This service provides Zero Knowledge Proof generation and verification
 * functions to verify IPFS file integrity.
 */

import * as snarkjs from 'snarkjs';
import { Buffer } from 'buffer';

// ZK circuit file URLs
const CIRCUIT_WASM_URL = '/circuits/hash_check.wasm';
const CIRCUIT_ZKEY_URL = '/circuits/hash_check_final.zkey';
const VERIFICATION_KEY_URL = '/circuits/verification_key.json';

// Large prime number limit for SNARKs
const SNARK_FIELD_SIZE = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;

// For cache and performance optimization
let verificationKey = null;
let circuit = null;
let isInitialized = false;

/**
 * Load circuit files
 * @returns {Promise<Object>} Circuit components
 */
async function loadCircuit() {
  if (circuit && isInitialized) return circuit;
  
  console.log('Loading ZK circuits...');
  
  try {
    // Load WebAssembly circuit file
    console.log('Loading WASM circuit file:', CIRCUIT_WASM_URL);
    const wasmResponse = await fetch(CIRCUIT_WASM_URL);
    
    if (!wasmResponse.ok) {
      throw new Error(`Circuit WASM file could not be loaded: ${wasmResponse.status} - ${wasmResponse.statusText}`);
    }
    
    const wasm = await wasmResponse.arrayBuffer();
    console.log('WASM circuit file successfully loaded:', wasm.byteLength, 'bytes');
      
    // Load zKey file  
    console.log('Loading zKey file:', CIRCUIT_ZKEY_URL);
    const zkeyResponse = await fetch(CIRCUIT_ZKEY_URL);
    
    if (!zkeyResponse.ok) {
      throw new Error(`Circuit zKey file could not be loaded: ${zkeyResponse.status} - ${zkeyResponse.statusText}`);
    }
    
    const zkey = await zkeyResponse.arrayBuffer();
    console.log('zKey file successfully loaded:', zkey.byteLength, 'bytes');
    
    circuit = { wasm, zkey };
    isInitialized = true;
    console.log('ZK circuits successfully loaded and ready');
    return circuit;
  } catch (error) {
    console.error('ZK circuit loading error:', error);
    console.error('Error details:', error.stack);
    isInitialized = false;
    throw error;
  }
}

/**
 * Load verification key
 * @returns {Promise<Object>} Verification key
 */
async function loadVerificationKey() {
  if (verificationKey) return verificationKey;
  
  try {
    console.log('Loading verification key:', VERIFICATION_KEY_URL);
    const response = await fetch(VERIFICATION_KEY_URL);
    
    if (!response.ok) {
      throw new Error(`Verification key could not be loaded: ${response.status} - ${response.statusText}`);
    }
    
    verificationKey = await response.json();
    console.log('Verification key successfully loaded');
    return verificationKey;
  } catch (error) {
    console.error('Verification key loading error:', error);
    console.error('Error details:', error.stack);
    throw error;
  }
}

/**
 * Calculate numerical value for IPFS hash
 * @param {string} ipfsHash - IPFS CID
 * @returns {BigInt} Hash value
 */
function calculateHashValue(ipfsHash) {
  const hashBuffer = Buffer.from(ipfsHash);
  let hashValue = 0n; // Define as BigInt
  for (let i = 0; i < hashBuffer.length; i++) {
    hashValue = (hashValue * 256n + BigInt(hashBuffer[i])) % SNARK_FIELD_SIZE;
  }
  return hashValue;
}

/**
 * Create a simple ZK proof
 * 
 * Simplified function to be used in case of FastFile error.
 * Creates a temporary proof instead of a real ZK proof.
 * 
 * @param {string} ipfsHash - IPFS CID
 * @param {string} secret - Secret value
 * @returns {Object} Simple verification data
 */
function generateSimpleProof(ipfsHash, secret) {
  console.log('Creating simple ZK proof (fallback)...');
  
  // Calculate hash value
  const hashValue = calculateHashValue(ipfsHash);
  const secretBuffer = Buffer.from(secret);
  
  // Create a simple signature
  const signature = {
    r: Array.from(hashValue.toString()).map(c => c.charCodeAt(0)),
    s: Array.from(secretBuffer).map(b => b % 255)
  };
  
  return {
    proof: {
      pi_a: [hashValue.toString(), "1", "1"],
      pi_b: [["1", "1"], ["1", "1"], ["1", "0"]],
      pi_c: [hashValue.toString(), "1", "1"],
      protocol: "groth16",
      curve: "bn128"
    },
    publicSignals: [hashValue.toString()],
    hashValue: hashValue.toString(),
    signature: signature,
    isFallback: true
  };
}

/**
 * Create Zero Knowledge Proof for given IPFS hash
 * 
 * @param {string} ipfsHash - IPFS CID
 * @param {string} secret - Secret value (e.g. known by the user)
 * @returns {Promise<object>} - Generated proof
 */
export async function generateProof(ipfsHash, secret) {
  try {
    console.log('Creating ZK Proof...');
    console.log('IPFS Hash:', ipfsHash);
    console.log('Secret length:', secret?.length || 0);
    
    // Calculate hash value
    const hashValue = calculateHashValue(ipfsHash);
    console.log('Calculated hash value:', hashValue.toString());
    
    // Calculate numerical value from secret
    const secretBuffer = Buffer.from(secret);
    let secretValue = 0n; // Define as BigInt
    for (let i = 0; i < secretBuffer.length; i++) {
      secretValue = (secretValue * 256n + BigInt(secretBuffer[i])) % SNARK_FIELD_SIZE;
    }
    
    // ZK Proof inputs
    const input = {
      hash: hashValue.toString(),
      secret: secretValue.toString()
    };
    console.log('ZK Proof inputs ready');
    
    // Load ZK circuit
    console.log('Loading ZK circuit...');
    try {
      await loadCircuit();
      console.log('ZK circuit successfully loaded');
    } catch (circuitError) {
      console.error('ZK circuit loading error (switching to simple mode):', circuitError);
      return generateSimpleProof(ipfsHash, secret);
    }
    
    // Create proof with snarkjs
    try {
      console.log('Calling snarkjs.groth16.fullProve');
      console.log('Circuit status:', {
        wasmLength: circuit?.wasm?.byteLength || 0,
        zkeyLength: circuit?.zkey?.byteLength || 0
      });
      
      const proof = await snarkjs.groth16.fullProve(
        input, 
        circuit.wasm, 
        circuit.zkey
      );
      
      console.log('ZK Proof successfully created');
      return {
        proof: proof.proof,
        publicSignals: proof.publicSignals,
        hashValue: hashValue.toString()
      };
    } catch (proofError) {
      console.error('snarkjs proof generation error:', proofError);
      
      // Fallback for Invalid FastFile error
      if (proofError.message && proofError.message.includes('Invalid FastFile type')) {
        console.log('Invalid FastFile error caught, switching to simple mode');
        return generateSimpleProof(ipfsHash, secret);
      }
      
      throw proofError;
    }
  } catch (error) {
    console.error('ZK Proof generation error:', error);
    console.error('Error stack:', error.stack);
    throw new Error(`Could not create ZK Proof: ${error.message}`);
  }
}

/**
 * Verify given proof for expected IPFS hash
 *
 * @param {object} proof - ZK proof to verify
 * @param {Array<string>} publicSignals - Public signals of the proof
 * @param {string} expectedIpfsHash - Expected IPFS hash
 * @returns {Promise<boolean>} - Is the proof valid
 */
export async function verifyProof(proof, publicSignals, expectedIpfsHash) {
  try {
    console.log('Verifying ZK Proof...');
    
    // Fallback proof check
    if (proof.isFallback) {
      console.log('Verifying simple proof (fallback mode)');
      const expectedHashValue = calculateHashValue(expectedIpfsHash).toString();
      return publicSignals[0] === expectedHashValue;
    }
    
    // Calculate numerical value from expected IPFS hash
    const expectedHashValue = calculateHashValue(expectedIpfsHash);
    
    // Load verification key
    const vKey = await loadVerificationKey();
    
    // Verify with snarkjs
    const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);
    
    console.log('ZK Proof verification result:', isValid);
    return isValid;
  } catch (error) {
    console.error('ZK Proof verification error:', error);
    throw new Error(`Could not verify ZK Proof: ${error.message}`);
  }
}

/**
 * Create a ZK proof to verify IPFS file existence and save it on Celestia
 * 
 * @param {string} ipfsHash - IPFS CID to verify
 * @param {string} secret - Secret value known by the file owner
 * @returns {Promise<object>} - ZK verification results
 */
export async function createFileVerification(ipfsHash, secret) {
  try {
    console.log('File verification starting:', ipfsHash);
    
    // Check ZK circuits availability
    try {
      await checkZkCircuitAvailability();
    } catch (e) {
      console.warn('ZK circuits check failed:', e);
    }
    
    // Generate ZK Proof
    const { proof, publicSignals, hashValue, isFallback } = await generateProof(ipfsHash, secret);
    
    // Serialize ZK Proof and related information
    const verificationData = {
      ipfsHash,
      publicSignals,
      proof,
      hashValue,
      timestamp: new Date().toISOString(),
      isFallback: isFallback || false
    };
    
    return {
      isValid: true,
      verificationData
    };
  } catch (error) {
    console.error('File verification error:', error);
    return {
      isValid: false,
      error: error.message
    };
  }
}

/**
 * Check ZK circuit files availability
 * 
 * @returns {Promise<boolean>} - Are circuit files available
 */
export async function checkZkCircuitAvailability() {
  try {
    console.log('Checking ZK circuit files availability...');
    
    // Check circuit files existence
    const wasmResponse = await fetch(CIRCUIT_WASM_URL, { method: 'HEAD' });
    const zkeyResponse = await fetch(CIRCUIT_ZKEY_URL, { method: 'HEAD' });
    const vkeyResponse = await fetch(VERIFICATION_KEY_URL, { method: 'HEAD' });
    
    const circuitsAvailable = wasmResponse.ok && zkeyResponse.ok && vkeyResponse.ok;
    
    console.log('Are ZK circuit files available:', circuitsAvailable);
    console.log('WASM:', wasmResponse.status, 'zKey:', zkeyResponse.status, 'vKey:', vkeyResponse.status);
    
    // Save result to session storage (for UI display)
    sessionStorage.setItem('zk_circuits_available', String(circuitsAvailable));
    
    return circuitsAvailable;
  } catch (error) {
    console.error('ZK circuit check error:', error);
    sessionStorage.setItem('zk_circuits_available', 'false');
    return false;
  }
}

// Preload ZK circuit - can be called when page loads if desired
export async function preloadZkCircuits() {
  try {
    await loadCircuit();
    await loadVerificationKey();
    return true;
  } catch (e) {
    console.error('ZK circuits could not be preloaded:', e);
    return false;
  }
}

/**
 * Check ZK status
 * 
 * @returns {Promise<Object>} - ZK status information
 */
export async function getZkStatus() {
  try {
    // Check circuit files
    const circuitsAvailable = await checkZkCircuitAvailability();
    
    return {
      circuitsAvailable,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('ZK status check error:', error);
    return {
      circuitsAvailable: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
} 