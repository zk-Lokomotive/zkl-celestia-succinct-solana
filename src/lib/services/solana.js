import { 
  Connection, 
  PublicKey, 
  Transaction,
  clusterApiUrl
} from '@solana/web3.js';
import { createMemoInstruction } from '@solana/spl-memo';

// Use devnet for testing
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

// Solana Explorer URL for devnet
const SOLANA_EXPLORER_URL = 'https://explorer.solana.com/tx';

export async function sendMemoTransaction(wallet, recipientAddress, ipfsUrl) {
  try {
    if (!window.solflare?.isConnected) {
      throw new Error('Wallet not connected');
    }

    // Create transaction
    const transaction = new Transaction();
    
    // Create memo instruction with IPFS URL
    const memoInstruction = createMemoInstruction(ipfsUrl);
    transaction.add(memoInstruction);
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash('finalized');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = new PublicKey(wallet.publicKey);

    // Sign and send transaction
    try {
      const signed = await window.solflare.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize());
      
      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error('Transaction failed to confirm');
      }

      // Return both signature and explorer URL
      return {
        signature,
        explorerUrl: `${SOLANA_EXPLORER_URL}/${signature}?cluster=devnet`
      };
    } catch (err) {
      console.error('Transaction error:', err);
      throw new Error('Failed to send transaction');
    }
  } catch (error) {
    console.error('Solana transaction error:', error);
    throw new Error(`Failed to send transaction: ${error.message}`);
  }
}