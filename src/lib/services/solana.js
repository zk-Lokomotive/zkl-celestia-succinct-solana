import { 
  Connection, 
  PublicKey, 
  Transaction,
  sendAndConfirmTransaction
} from '@solana/web3.js';
import { createMemoInstruction } from '@solana/spl-memo';

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

export async function sendMemoTransaction(wallet, recipientAddress, ipfsHash) {
  try {
    // @ts-ignore
    if (!window?.solflare?.connected) {
      throw new Error('Wallet not connected');
    }

    const transaction = new Transaction();
    
    // Add memo instruction
    const memoInstruction = createMemoInstruction(ipfsHash);
    transaction.add(memoInstruction);
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = new PublicKey(wallet.publicKey);

    // @ts-ignore
    const signedTransaction = await window.solflare.signTransaction(transaction);
    
    // Send and confirm transaction
    const signature = await connection.sendRawTransaction(signedTransaction.serialize());
    await connection.confirmTransaction(signature);
    
    return signature;
  } catch (error) {
    console.error('Solana transaction error:', error);
    throw new Error('Failed to send transaction to Solana network');
  }
}