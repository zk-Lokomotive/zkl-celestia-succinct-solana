import { 
  Connection, 
  PublicKey, 
  Transaction,
  clusterApiUrl,
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { createMemoInstruction } from '@solana/spl-memo';

// Use devnet for testing
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

// Solana Explorer URL for devnet
const SOLANA_EXPLORER_URL = 'https://explorer.solana.com/tx';

// Platform fee wallet address
const PLATFORM_FEE_WALLET = new PublicKey('AE5pPiytWmesahTzu9mUmgJAh7zCp985ru2XuNN35YNu');

// Calculate platform fee based on file size
function calculatePlatformFee(fileSize) {
  // Base fee: 0.001 SOL
  const baseFee = 0.001;
  
  // Additional fee per MB: 0.0001 SOL
  const feePerMB = 0.0001;
  const fileSizeInMB = fileSize / (1024 * 1024);
  const additionalFee = fileSizeInMB * feePerMB;
  
  // Total fee in SOL
  const totalFee = baseFee + additionalFee;
  
  // Convert to lamports
  return Math.ceil(totalFee * LAMPORTS_PER_SOL);
}

export async function sendMemoTransaction(wallet, recipientAddress, ipfsUrl, fileSize) {
  try {
    if (!wallet?.publicKey || !window.solflare?.isConnected) {
      throw new Error('Wallet not connected');
    }

    // Calculate platform fee
    const platformFee = calculatePlatformFee(fileSize);

    // Create transaction
    const transaction = new Transaction();
    
    // Add platform fee transfer instruction
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: new PublicKey(wallet.publicKey),
        toPubkey: PLATFORM_FEE_WALLET,
        lamports: platformFee
      })
    );
    
    // Add memo instruction with IPFS URL and recipient address
    const memoText = JSON.stringify({
      url: ipfsUrl,
      recipient: recipientAddress
    });
    transaction.add(createMemoInstruction(memoText));
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash('finalized');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = new PublicKey(wallet.publicKey);

    // Sign and send transaction
    try {
      // Request signature from Solflare
      const signedTx = await window.solflare.signTransaction(transaction);
      
      // Send signed transaction
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      
      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error('Transaction failed to confirm');
      }

      // Return transaction details
      return {
        signature,
        explorerUrl: `${SOLANA_EXPLORER_URL}/${signature}?cluster=devnet`,
        platformFee
      };
    } catch (err) {
      console.error('Transaction error:', err);
      throw new Error(`Failed to send transaction: ${err.message}`);
    }
  } catch (error) {
    console.error('Solana transaction error:', error);
    throw new Error(`Failed to send transaction: ${error.message}`);
  }
}