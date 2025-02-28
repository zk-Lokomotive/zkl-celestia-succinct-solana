#![cfg_attr(not(feature = "std"), no_std)]

// Standart kütüphaneye bağlı parçaları şartlı olarak içe aktarıyoruz
#[cfg(feature = "std")]
use std::env;
#[cfg(feature = "std")]
use std::fs;
#[cfg(feature = "std")]
use std::path::Path;

// Kütüphanemizi içe aktarıyoruz
use zkl_file_verify_lib::{
    IPFSVerificationInput, generate_proof, verify_proof
};

// Main function to demonstrate usage
#[cfg(feature = "std")]
fn main() {
    let args: Vec<String> = env::args().collect();
    
    if args.len() < 4 {
        println!("Usage: {} <ipfs_hash> <hash_value> <secret>", args[0]);
        return;
    }
    
    let ipfs_hash = &args[1];
    let hash_value = &args[2];
    let secret = &args[3];
    
    println!("Creating proof for IPFS hash: {}", ipfs_hash);
    
    // Generate proof
    let proof = generate_proof(ipfs_hash, hash_value, secret);
    println!("Proof successfully generated!");
    
    // Verify the proof
    let ok = verify_proof(&proof);
    println!("Proof verification result: {}", ok);
    
    // Save the proof to a file (for demonstration)
    let proof_path = Path::new("ipfs_verification_proof.json");
    match serde_json::to_string(&proof) {
        Ok(json_str) => {
            if let Err(e) = fs::write(proof_path, json_str) {
                println!("Error writing proof to file: {}", e);
            } else {
                println!("Proof saved to: {:?}", proof_path);
            }
        },
        Err(e) => println!("Error serializing proof: {}", e),
    }
    
    // Output public signals if available
    if let Some(public_values) = &proof.public {
        println!("Public signals:");
        for (i, signal) in public_values.iter().enumerate() {
            println!("  {}: {}", i, signal);
        }
    }
}

// RISC-V hedefi için main ekle
#[cfg(not(feature = "std"))]
fn main() {
    // RISC-V ortamında boş ana fonksiyon
}

// Test kodu
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_ipfs_verification() {
        // Test values
        let ipfs_hash = "QmTPmBiqnUnL1k3W9GxmZTTtMSEX8rgpwqeCfYsJvodS2d";
        let hash_value = "123456789";
        let secret = "test-secret";
        
        // Generate proof
        let proof = generate_proof(ipfs_hash, hash_value, secret);
        
        // Verify proof
        let ok = verify_proof(&proof);
        
        assert!(ok, "Proof verification should succeed");
    }
} 