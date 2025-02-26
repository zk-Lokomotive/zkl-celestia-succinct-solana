import { create } from 'ipfs-http-client';

// Connect to local IPFS node
// ipfs-http-client v60 için doğru kullanım
const ipfs = create({
  host: 'localhost',
  port: 5001,
  protocol: 'http',
  apiPath: '/api/v0'
});

// Local IPFS Gateway URL
const LOCAL_IPFS_GATEWAY = 'http://localhost:8080/ipfs/';

export async function uploadToIPFS(file) {
  try {
    const buffer = await file.arrayBuffer();
    const result = await ipfs.add(buffer);
    
    // Get local gateway URL
    const localUrl = `${LOCAL_IPFS_GATEWAY}${result.path}`;
    
    return {
      cid: result.path,
      url: localUrl
    };
  } catch (error) {
    console.error('IPFS upload error:', error);
    throw new Error('Failed to upload file to IPFS');
  }
}

export async function getFromIPFS(cid) {
  try {
    const stream = ipfs.cat(cid);
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return new Blob(chunks);
  } catch (error) {
    console.error('IPFS download error:', error);
    throw new Error('Failed to download file from IPFS');
  }
}

export function getGatewayUrl(cid) {
  return `${LOCAL_IPFS_GATEWAY}${cid}`;
}

// Verify IPFS node connection
export async function checkIPFSConnection() {
  try {
    // IPFS API isteklerinin POST yöntemiyle yapılması gerekiyor
    const response = await fetch('http://localhost:5001/api/v0/version', {
      method: 'POST',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`IPFS API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Connected to IPFS node version:', data.Version);
    return true;
  } catch (error) {
    console.error('Failed to connect to IPFS node:', error);
    if (error.message && error.message.includes('ECONNREFUSED')) {
      console.error('IPFS daemon is not running. Please start it with: ipfs daemon');
    }
    return false;
  }
}

// Yeni bir fonksiyon - IPFS bağlantısını test etmek için
export async function testIPFSConnection() {
  try {
    // IPFS API isteklerinin POST yöntemiyle yapılması gerekiyor
    const response = await fetch('http://localhost:5001/api/v0/version', {
      method: 'POST',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`IPFS API not responding, status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('IPFS API Response:', data);
    return true;
  } catch (error) {
    console.error('IPFS Connection Test Failed:', error);
    return false;
  }
}