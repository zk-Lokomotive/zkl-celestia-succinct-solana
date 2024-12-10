import { create } from 'ipfs-http-client';

const ipfs = create({
  host: 'localhost',
  port: 5001,
  protocol: 'http'
});

export async function uploadToIPFS(file) {
  try {
    const buffer = await file.arrayBuffer();
    const result = await ipfs.add(buffer);
    return result.path;
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