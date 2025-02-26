/**
 * IPFS Service
 * This service provides core functions for interacting with the IPFS network.
 */

import axios from 'axios';

// IPFS API endpoint - connects to a local node
// In a real application, this value should be taken from .env file or user settings
const IPFS_API_ENDPOINT = 'http://localhost:5001/api/v0';

// Alternative services like Infura or Dedicated Gateway can also be used
// const INFURA_PROJECT_ID = 'your-infura-project-id';
// const INFURA_API_SECRET = 'your-infura-api-secret';
// const INFURA_ENDPOINT = 'https://ipfs.infura.io:5001/api/v0';

/**
 * Check IPFS connection
 * @returns {Promise<boolean>} Connection status
 */
export async function checkIPFSConnection() {
  try {
    // Try IPFS API connection
    const response = await axios.post(`${IPFS_API_ENDPOINT}/id`);
    
    if (response.status === 200 && response.data) {
      console.log('IPFS node ID:', response.data.ID);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('IPFS node connection error:', error);
    throw new Error(`IPFS connection failed: ${error.message}`);
  }
}

/**
 * Upload file to IPFS
 * @param {File} file - File to upload
 * @returns {Promise<{cid: string, url: string}>} CID and URL information
 */
export async function ipfsUpload(file) {
  try {
    if (!file) {
      throw new Error('No file found to upload');
    }
    
    // Create FormData
    const formData = new FormData();
    formData.append('file', file);
    
    // Send file to IPFS node
    const response = await axios.post(
      `${IPFS_API_ENDPOINT}/add?pin=true`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    if (!response.data || !response.data.Hash) {
      throw new Error('Invalid IPFS response');
    }
    
    const cid = response.data.Hash;
    // IPFS Gateway URL
    const url = `https://ipfs.io/ipfs/${cid}`;
    
    console.log('IPFS file upload successful:', { cid, url });
    
    return { cid, url };
  } catch (error) {
    console.error('IPFS upload error:', error);
    throw new Error(`IPFS upload failed: ${error.message}`);
  }
}

/**
 * Download file from IPFS
 * @param {string} cid - CID of the file to download
 * @param {string} filename - Filename to save as
 * @returns {Promise<void>} 
 */
export async function ipfsDownload(cid, filename) {
  if (!cid) {
    throw new Error('No valid CID specified');
  }
  
  try {
    // Get file from IPFS
    const response = await axios.post(
      `${IPFS_API_ENDPOINT}/cat?arg=${cid}`,
      {},
      { responseType: 'blob' }
    );
    
    // Create blob and initiate download
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename || cid;
    document.body.appendChild(a);
    a.click();
    
    // Clean up resources
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    console.log('IPFS file download successful:', cid);
  } catch (error) {
    console.error('IPFS download error:', error);
    throw new Error(`IPFS download failed: ${error.message}`);
  }
}

/**
 * Get data from IPFS (for small files)
 * @param {string} cid - Data CID
 * @returns {Promise<string>} Data content
 */
export async function ipfsGet(cid) {
  if (!cid) {
    throw new Error('No valid CID specified');
  }
  
  try {
    // Get content from IPFS
    const response = await axios.post(
      `${IPFS_API_ENDPOINT}/cat?arg=${cid}`,
      {},
      { responseType: 'text' }
    );
    
    return response.data;
  } catch (error) {
    console.error('IPFS data retrieval error:', error);
    throw new Error(`IPFS data retrieval failed: ${error.message}`);
  }
}

/**
 * Get metadata of data in IPFS
 * @param {string} cid - Data CID
 * @returns {Promise<Object>} Metadata
 */
export async function ipfsGetMetadata(cid) {
  if (!cid) {
    throw new Error('No valid CID specified');
  }
  
  try {
    // Get stat information from IPFS
    const response = await axios.post(`${IPFS_API_ENDPOINT}/object/stat?arg=${cid}`);
    
    if (!response.data) {
      throw new Error('Invalid IPFS response');
    }
    
    return response.data;
  } catch (error) {
    console.error('IPFS metadata retrieval error:', error);
    throw new Error(`IPFS metadata retrieval failed: ${error.message}`);
  }
}