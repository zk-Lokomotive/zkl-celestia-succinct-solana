#![cfg_attr(not(feature = "std"), no_std)]

pub use sp1_sdk;
pub use sha2;

use sp1_sdk::{
    SP1Circuit, SP1Stdin, SP1Verifier, SP1Prover, SP1ContextBuilder,
    utils::serde::{Deserialize, Serialize},
};
use sha2::{Digest, Sha256};

/// IPFS Hash Verification Circuit
///
/// This circuit verifies the integrity of an IPFS hash using a secret.
/// It can be used to prove that a user knows a secret associated with a specific IPFS hash,
/// without revealing the secret itself.
#[derive(Clone, Debug)]
pub struct IPFSVerificationInput {
    /// IPFS hash to verify
    pub ipfs_hash: String,
    /// Prehashed value (for optimization and cross-check)
    pub hash_value: String,
    /// Secret known by the owner
    pub secret: String,
}

// Define the circuit
pub struct IPFSVerificationCircuit;

impl SP1Circuit for IPFSVerificationCircuit {
    type In = IPFSVerificationInput;

    fn define(context: &mut impl SP1ContextBuilder, input: Self::In) {
        // Constraints to verify:
        // 1. The hash_value is correctly derived from ipfs_hash
        // 2. The user knows the secret
        
        // Convert IPFS hash to bytes
        let ipfs_hash_bytes = input.ipfs_hash.as_bytes();
        
        // Calculate the hash value from IPFS hash
        let mut hasher = Sha256::new();
        hasher.update(ipfs_hash_bytes);
        let calculated_hash = hasher.finalize();
        
        // Derive the expected hash from input
        #[cfg(feature = "std")]
        let expected_hash_value = std::str::FromStr::from_str(&input.hash_value).unwrap_or(0);
        #[cfg(not(feature = "std"))]
        let expected_hash_value = parse_u128(&input.hash_value);
        
        // Calculate a commitment using the secret
        let secret_bytes = input.secret.as_bytes();
        let mut commitment_hasher = Sha256::new();
        commitment_hasher.update(ipfs_hash_bytes);
        commitment_hasher.update(secret_bytes);
        let commitment = commitment_hasher.finalize();
        
        // Convert calculated hash to u128 for comparison (simplification)
        let mut calculated_hash_u128: u128 = 0;
        for i in 0..16 {
            calculated_hash_u128 = (calculated_hash_u128 << 8) | (calculated_hash[i] as u128);
        }
        
        // Public output: hash value (this will be visible)
        context.assert_eq(calculated_hash_u128, expected_hash_value);
        
        // Additional public output: first 16 bytes of commitment (hash(ipfs_hash + secret))
        // This allows verification that the user knows the secret without revealing it
        let mut commitment_u128: u128 = 0;
        for i in 0..16 {
            commitment_u128 = (commitment_u128 << 8) | (commitment[i] as u128);
        }
        
        // Output the commitment - this will be part of the public signals
        context.write(&commitment_u128);
    }
}

// no_std uyumu için basit u128 ayrıştırıcı
#[cfg(not(feature = "std"))]
pub fn parse_u128(s: &str) -> u128 {
    let mut result = 0u128;
    for c in s.chars() {
        if let Some(digit) = c.to_digit(10) {
            result = result * 10 + (digit as u128);
        }
    }
    result
}

// Generate and verify proof
#[cfg(feature = "std")]
pub fn generate_proof(ipfs_hash: &str, hash_value: &str, secret: &str) -> sp1_sdk::ProofOptions {
    let input = IPFSVerificationInput {
        ipfs_hash: ipfs_hash.to_string(),
        hash_value: hash_value.to_string(),
        secret: secret.to_string(),
    };
    
    // Setup prover
    let mut prover = SP1Prover::<IPFSVerificationCircuit>::new();
    
    // Generate proof
    prover.prove(input).unwrap()
}

// Verify a proof
#[cfg(feature = "std")]
pub fn verify_proof(proof: &sp1_sdk::ProofOptions) -> bool {
    SP1Verifier::<IPFSVerificationCircuit>::verify(proof).unwrap()
} 