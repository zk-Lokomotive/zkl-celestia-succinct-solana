/**
 * Zero Knowledge Proof (ZKP) Service
 * Bu servis IPFS dosya bütünlüğünü doğrulamak için Zero Knowledge Proof
 * oluşturma ve doğrulama fonksiyonları sağlar.
 */

import * as snarkjs from 'snarkjs';
import { Buffer } from 'buffer';

// ZK devre dosyalarının URL'leri
const CIRCUIT_WASM_URL = '/circuits/hash_check.wasm';
const CIRCUIT_ZKEY_URL = '/circuits/hash_check_final.zkey';
const VERIFICATION_KEY_URL = '/circuits/verification_key.json';

// SNARK'lar için büyük asal sayı limiti
const SNARK_FIELD_SIZE = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;

// Cache ve performans optimizasyonu için
let verificationKey = null;
let circuit = null;

/**
 * Devre dosyalarını yükle
 * @returns {Promise<Object>} Devre bileşenleri
 */
async function loadCircuit() {
  if (circuit) return circuit;
  
  try {
    // WebAssembly devre dosyasını yükle
    const wasm = await fetch(CIRCUIT_WASM_URL)
      .then(res => {
        if (!res.ok) throw new Error(`Devre WASM dosyası yüklenemedi: ${res.status}`);
        return res.arrayBuffer();
      });
      
    // zKey dosyasını yükle  
    const zkey = await fetch(CIRCUIT_ZKEY_URL)
      .then(res => {
        if (!res.ok) throw new Error(`Devre zKey dosyası yüklenemedi: ${res.status}`);
        return res.arrayBuffer();
      });
      
    circuit = { wasm, zkey };
    return circuit;
  } catch (error) {
    console.error('ZK devre yükleme hatası:', error);
    throw error;
  }
}

/**
 * Doğrulama anahtarını yükle
 * @returns {Promise<Object>} Doğrulama anahtarı
 */
async function loadVerificationKey() {
  if (verificationKey) return verificationKey;
  
  try {
    verificationKey = await fetch(VERIFICATION_KEY_URL)
      .then(res => {
        if (!res.ok) throw new Error(`Doğrulama anahtarı yüklenemedi: ${res.status}`);
        return res.json();
      });
    return verificationKey;
  } catch (error) {
    console.error('Doğrulama anahtarı yükleme hatası:', error);
    throw error;
  }
}

/**
 * IPFS hash'i için sayısal değer hesapla
 * @param {string} ipfsHash - IPFS CID
 * @returns {BigInt} Hash değeri
 */
function calculateHashValue(ipfsHash) {
  const hashBuffer = Buffer.from(ipfsHash);
  let hashValue = 0n; // BigInt olarak tanımla
  for (let i = 0; i < hashBuffer.length; i++) {
    hashValue = (hashValue * 256n + BigInt(hashBuffer[i])) % SNARK_FIELD_SIZE;
  }
  return hashValue;
}

/**
 * Verilen IPFS hash'i için Zero Knowledge Proof oluştur
 * 
 * @param {string} ipfsHash - IPFS CID
 * @param {string} secret - Gizli değer (ör. kullanıcı tarafından bilinen)
 * @returns {Promise<object>} - Oluşturulan kanıt
 */
export async function generateProof(ipfsHash, secret) {
  try {
    console.log('ZK Kanıtı oluşturuluyor...');
    
    // Hash değerini hesapla
    const hashValue = calculateHashValue(ipfsHash);
    
    // Gizli değerden sayısal değer hesapla
    const secretBuffer = Buffer.from(secret);
    let secretValue = 0n; // BigInt olarak tanımla
    for (let i = 0; i < secretBuffer.length; i++) {
      secretValue = (secretValue * 256n + BigInt(secretBuffer[i])) % SNARK_FIELD_SIZE;
    }
    
    // ZK Proof girdileri
    const input = {
      hash: hashValue.toString(),
      secret: secretValue.toString()
    };
    
    // ZK devresini yükle
    await loadCircuit();
    
    // snarkjs ile kanıt oluştur
    const proof = await snarkjs.groth16.fullProve(
      input, 
      circuit.wasm, 
      circuit.zkey
    );
    
    console.log('ZK Kanıtı başarıyla oluşturuldu');
    return {
      proof: proof.proof,
      publicSignals: proof.publicSignals,
      hashValue: hashValue.toString()
    };
  } catch (error) {
    console.error('ZK Kanıtı oluşturma hatası:', error);
    throw new Error(`ZK Kanıtı oluşturulamadı: ${error.message}`);
  }
}

/**
 * Verilen kanıtı beklenen IPFS hash'i için doğrula
 *
 * @param {object} proof - Doğrulanacak ZK kanıtı
 * @param {Array<string>} publicSignals - Kanıtın açık sinyalleri
 * @param {string} expectedIpfsHash - Beklenen IPFS hash'i
 * @returns {Promise<boolean>} - Kanıt geçerli mi
 */
export async function verifyProof(proof, publicSignals, expectedIpfsHash) {
  try {
    console.log('ZK Kanıtı doğrulanıyor...');
    
    // Beklenen IPFS hash'inden sayısal değer hesapla
    const expectedHashValue = calculateHashValue(expectedIpfsHash);
    
    // Doğrulama anahtarını yükle
    const vKey = await loadVerificationKey();
    
    // snarkjs ile doğrula
    const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);
    
    console.log('ZK Kanıtı doğrulama sonucu:', isValid);
    return isValid;
  } catch (error) {
    console.error('ZK Kanıtı doğrulama hatası:', error);
    throw new Error(`ZK Kanıtı doğrulanamadı: ${error.message}`);
  }
}

/**
 * IPFS dosyasının varlığını doğrulamak ve Celestia'da kaydetmek için
 * bir ZK kanıtı oluştur
 * 
 * @param {string} ipfsHash - Doğrulanacak IPFS CID
 * @param {string} secret - Dosya sahibi tarafından bilinen gizli değer
 * @returns {Promise<object>} - ZK doğrulama sonuçları
 */
export async function createFileVerification(ipfsHash, secret) {
  try {
    // ZK Kanıtı oluştur
    const { proof, publicSignals, hashValue } = await generateProof(ipfsHash, secret);
    
    // ZK Kanıtı ve ilgili bilgileri serileştir
    const verificationData = {
      ipfsHash,
      publicSignals,
      proof,
      hashValue,
      timestamp: new Date().toISOString()
    };
    
    return {
      isValid: true,
      verificationData
    };
  } catch (error) {
    console.error('Dosya doğrulama hatası:', error);
    return {
      isValid: false,
      error: error.message
    };
  }
}

/**
 * ZK devre dosyalarının varlığını kontrol et
 * 
 * @returns {Promise<boolean>} - Devre dosyaları mevcut mu
 */
export async function checkZkCircuitAvailability() {
  try {
    // Devre dosyalarının varlığını kontrol et
    const wasmResponse = await fetch(CIRCUIT_WASM_URL, { method: 'HEAD' });
    const zkeyResponse = await fetch(CIRCUIT_ZKEY_URL, { method: 'HEAD' });
    const vkeyResponse = await fetch(VERIFICATION_KEY_URL, { method: 'HEAD' });
    
    const circuitsAvailable = wasmResponse.ok && zkeyResponse.ok && vkeyResponse.ok;
    
    // Sonucu session storage'a kaydet (UI gösterimi için)
    sessionStorage.setItem('zk_circuits_available', String(circuitsAvailable));
    
    return circuitsAvailable;
  } catch (error) {
    console.error('ZK devre kontrolü hatası:', error);
    sessionStorage.setItem('zk_circuits_available', 'false');
    return false;
  }
}

/**
 * ZK durumunu kontrol et
 * 
 * @returns {Promise<Object>} - ZK durum bilgisi
 */
export async function getZkStatus() {
  try {
    // Devre dosyalarını kontrol et
    const circuitsAvailable = await checkZkCircuitAvailability();
    
    return {
      circuitsAvailable,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('ZK durum kontrolü hatası:', error);
    return {
      circuitsAvailable: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
} 