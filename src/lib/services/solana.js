import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

export async function sendMemoTransaction(senderWallet, recipientAddress, ipfsHash) {
  try {
    const transaction = new Transaction();
    
    // Create memo instruction
    const memoInstruction = new TransactionInstruction({
      keys: [],
      programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
      data: Buffer.from(ipfsHash)
    });
    
    transaction.add(memoInstruction);
    
    // Get recent blockhash
    const { blockhash } = await connection.getRecentBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = senderWallet.publicKey;
    
    // Sign and send transaction
    const signed = await senderWallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signed.serialize());
    
    // Wait for confirmation
    await connection.confirmTransaction(signature);
    
    return signature;
  } catch (error) {
    console.error('Solana transaction error:', error);
    throw new Error('Failed to send transaction to Solana network');
  }
}

export async function getTransactionMemos(address) {
  try {
    const publicKey = new PublicKey(address);
    const transactions = await connection.getSignaturesForAddress(publicKey);
    
    const memos = [];
    for (const tx of transactions) {
      const transaction = await connection.getTransaction(tx.signature);
      if (transaction?.meta?.logMessages) {
        const memoLog = transaction.meta.logMessages.find(log => 
          log.startsWith('Program MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr invoke')
        );
        if (memoLog) {
          memos.push({
            signature: tx.signature,
            memo: memoLog.split('[')[1].split(']')[0],
            timestamp: tx.blockTime * 1000
          });
        }
      }
    }
    
    return memos;
  } catch (error) {
    console.error('Error fetching memos:', error);
    throw new Error('Failed to fetch transaction memos');
  }
}