# zkλ: Decentralized Cryptographic File Sharing with Celestia DA and Zero Knowledge Proofs

## Technical Overview

zkλ is a cutting-edge decentralized file sharing application that combines several advanced cryptographic primitives and blockchain technologies to provide secure, private, and verifiable file transfers. The application leverages a multi-layered architecture comprising:

1. **InterPlanetary File System (IPFS)** - Distributed content-addressable storage
2. **Celestia Data Availability (DA) Layer** - Guaranteeing blockchain-level data persistence
3. **Zero Knowledge Proofs (ZK)** - Privacy-preserving verification mechanisms
4. **Svelte Frontend** - Reactive and efficient user interface

This technological stack creates a powerful synergy between decentralized storage, data availability guarantees, and cryptographic verifiability while maintaining a seamless user experience.

## Core Technologies

### Celestia Data Availability Layer

Celestia is used as a Data Availability (DA) layer within zkλ for the following reasons:

- **Data Persistence**: Celestia provides a blockchain-based guarantee that IPFS Content Identifiers (CIDs) will remain available even if IPFS nodes go offline, solving the persistence problem of pure P2P storage systems.
- **Verifiable Namespaces**: zkλ utilizes Celestia's namespace system (`0x7a6b6c2d69706673` and custom namespaces) to organize and categorize different file transfers while ensuring they can be cryptographically verified.
- **Light Client Compatibility**: The application connects to a Celestia light node, making it possible to interact with the blockchain without maintaining a full node, significantly reducing resource requirements.
- **Payload Blob Submission**: When a file is uploaded to IPFS, its CID is submitted as a Celestia blob with associated metadata, creating an immutable record of the transfer that can be later verified.

Implementation details:
- Communication with Celestia occurs through a dedicated API proxy server (`celestia-api.cjs`) 
- The system uses the `blob.Submit` and `blob.GetAll` methods of the Celestia API
- Celestia transactions are viewable through the integrated explorer at `https://explorer.consensus-celestia.app/`

### Zero Knowledge Proofs

The ZK integration in zkλ serves multiple critical functions:

- **Privacy-Preserving Verification**: Allows proving the integrity and existence of a file without revealing its contents
- **Selective Disclosure**: Enables users to prove specific properties about files without revealing all data
- **Mathematical Certainty**: Provides cryptographic guarantees rather than trust-based assurances

Technical implementation:
- Uses `snarkjs` library for ZK circuit execution
- Implements `groth16` proving system for efficiency and security
- Includes custom circuits located in `/public/circuits/`
- Handles circuit execution in the browser through WebAssembly

The ZK proving process follows these steps:
1. Calculate a numerical representation of the IPFS CID
2. Generate a witness using the file hash and a secret
3. Create a ZK proof using the precompiled circuit
4. Store verification data alongside the file reference

## System Architecture

The zkλ architecture consists of several interconnected components:

```
┌───────────────────┐     ┌─────────────────────┐     ┌─────────────────┐
│                   │     │                     │     │                 │
│  Svelte Frontend  │◄───►│  zkλ Core Services  │◄───►│  API Proxy      │
│  (User Interface) │     │  (Business Logic)   │     │  (Server)       │
│                   │     │                     │     │                 │
└────────┬──────────┘     └─────────┬───────────┘     └────────┬────────┘
         │                          │                          │
         │                          │                          │
         ▼                          ▼                          ▼
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│                           External Services                            │
│                                                                        │
├────────────────┬─────────────────────────────┬───────────────────────┐ │
│                │                             │                       │ │
│  IPFS Node     │  Celestia Light Node       │  ZK Circuit Execution │ │
│  (Storage)     │  (Data Availability)        │  (Verification)       │ │
│                │                             │                       │ │
└────────────────┴─────────────────────────────┴───────────────────────┘ │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Core Components

1. **Service Layer** (`/src/lib/services/`)
   - `celestia.js` - Handles all interactions with the Celestia DA layer
   - `ipfs.js` - Manages file uploads and downloads through IPFS
   - `zk.js` - Implements Zero Knowledge Proof generation and verification

2. **State Management** (`/src/lib/stores/`)
   - `fileStore.js` - Manages file upload/download state and operations
   - `inboxStore.js` - Maintains the user's inbox of received files
   - `wallet.js` - Handles wallet connectivity and user authentication
   - `themeStore.js` - Controls application theming

3. **User Interface** (`/src/lib/`)
   - `UploadInterface.svelte` - File upload and transfer UI
   - `Inbox.svelte` - Received files management
   - `CelestiaStatus.svelte` - Celestia network connection status
   - `ZkStatus.svelte` - ZK circuit availability status

4. **Server** (`/src/server/`)
   - `celestia-api.cjs` - Backend proxy for Celestia node communication

## Prerequisites

To run zkλ, you need the following components:

- **Node.js** (v16+)
- **IPFS Daemon** (local or remote)
- **Celestia Light Node** (running on local machine or accessible endpoint)
- **Modern Web Browser** (Chrome, Firefox, Edge, or Safari)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/zkl.git
cd zkl
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

#### IPFS Configuration

Ensure your IPFS daemon is running and accessible. Default configuration in `ipfs.js` points to:

```javascript
const IPFS_API_ENDPOINT = 'http://localhost:5001/api/v0';
```

#### Celestia Configuration

You need a running Celestia light node. Set up your Celestia light node:

```bash
# Install Celestia (see full instructions in CELESTIA-SETUP.md)
# Initialize light node
celestia light init --p2p.network mocha

# Get authorization token
celestia light auth admin --p2p.network mocha

# Start the light node
celestia light start --p2p.network mocha --core.ip rpc-mocha.pops.one --gateway --gateway.addr 127.0.0.1 --gateway.port 26659 --rpc.addr 127.0.0.1
```

Update the configuration in `src/server/celestia-api.cjs`:

```javascript
const CELESTIA_NODE_URL = 'http://localhost:26658';
const CELESTIA_AUTH_TOKEN = 'your-auth-token-here';
```

### 4. Start the API Proxy Server

```bash
npm run api
```

This starts the Celestia API proxy server on port 3080.

### 5. Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173/` by default.

## Advanced Configuration

### Celestia Network Selection

By default, zkλ connects to the Mocha testnet. To use a different network:

1. Update the light node startup parameters:
   ```bash
   celestia light start --p2p.network <network-name>
   ```

2. Update Celestia authentication token in `celestia-api.cjs`

### ZK Circuit Customization

To modify the Zero Knowledge proving system:

1. Replace the circuit files in `/public/circuits/`:
   - `hash_check.wasm` - WebAssembly compiled circuit
   - `hash_check_final.zkey` - Proving key
   - `verification_key.json` - Verification key

2. Update the circuit parameters in `src/lib/services/zk.js`

### Docker Deployment

A Docker Compose file is provided for containerized deployment:

```yaml
version: '3'

services:
  zkl-app:
    build: .
    ports:
      - "5173:5173"
    depends_on:
      - celestia-light-node
    environment:
      - CELESTIA_NODE_URL=http://celestia-light-node:26659
      - CELESTIA_AUTH_TOKEN=your-auth-token

  celestia-light-node:
    image: ghcr.io/celestiaorg/celestia-node:v0.21.5-mocha
    restart: unless-stopped
    user: "10001:10001"
    volumes:
      - ./celestia-light-data:/home/celestia
    ports:
      - "26659:26659"
    command: >
      /bin/bash -c "
      if [ ! -f /home/celestia/.celestia-light-mocha/config.toml ]; then
        celestia light init --p2p.network mocha;
      fi;
      celestia light start --core.ip consensus-validator.celestia-mocha.com --core.port 26657 --p2p.network mocha --gateway --gateway.addr 0.0.0.0 --gateway.port 26659 --rpc.addr 0.0.0.0
      "
```

## System Requirements

### Minimum Requirements

- **CPU**: Dual-core processor (2+ GHz)
- **RAM**: 4 GB
- **Disk**: 10 GB free space
- **Network**: Broadband connection (5+ Mbps)

### Recommended Requirements

- **CPU**: Quad-core processor (3+ GHz)
- **RAM**: 8 GB
- **Disk**: 50 GB free space (SSD preferred)
- **Network**: High-speed connection (20+ Mbps)

## Technical Implementation Details

### File Transfer Flow

When a file is uploaded and sent through zkλ, the following technical process occurs:

1. **File Upload to IPFS**
   ```javascript
   const { cid, url } = await ipfsUpload(selectedFile);
   ```

2. **ZK Proof Generation**
   ```javascript
   const secret = `${selectedFile.name}-${selectedFile.size}-${nanoid()}`;
   const verificationResult = await createFileVerification(cid.toString(), secret);
   ```

3. **Celestia DA Submission**
   ```javascript
   const celestiaData = await submitToCelestia(cid.toString());
   ```

4. **Transfer Record Creation**
   ```javascript
   const transferRecord = {
     id: transferId,
     file: { name, size, type },
     ipfs: { cid },
     ipfsHash: cid.toString(),
     celestia: celestiaData,
     zkProof: zkProofData,
     recipient,
     sender,
     message,
     timestamp: currentTime
   };
   ```

5. **Inbox Message Creation**
   ```javascript
   inboxStore.addMessage(recipient, inboxMessage);
   ```

### Celestia Interaction Details

The application interacts with Celestia through JSON-RPC calls:

```javascript
// Example of blob submission
const rpcRequest = {
  jsonrpc: "2.0",
  id: 1, 
  method: "blob.Submit",
  params: [
    [
      {
        namespace: namespaceHex,
        data: ipfsHash,
        share_version: 0
      }
    ],
    0.002 // Gas price
  ]
};

const response = await axios.post(
  CELESTIA_API_ENDPOINT,
  rpcRequest,
  {
    headers: {
      'Authorization': `Bearer ${CELESTIA_AUTH_TOKEN}`,
      'Content-Type': 'application/json'
    }
  }
);
```

### ZK Circuit Execution

The ZK proving system works by:

1. Loading the circuit from WebAssembly:
   ```javascript
   const wasmBuffer = await fetch(CIRCUIT_WASM_URL).then(r => r.arrayBuffer());
   const zkeyBuffer = await fetch(CIRCUIT_ZKEY_URL).then(r => r.arrayBuffer());
   ```

2. Creating inputs from the file hash:
   ```javascript
   const hashValue = calculateHashValue(ipfsHash);
   const input = {
     hash: hashValue.toString(),
     secret: secretValue.toString()
   };
   ```

3. Generating the proof:
   ```javascript
   const proof = await snarkjs.groth16.fullProve(input, circuit.wasm, circuit.zkey);
   ```

4. Verifying the proof:
   ```javascript
   const vKey = await loadVerificationKey();
   const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);
   ```

## Troubleshooting

### Common Issues

#### 1. Celestia Connection Errors

**Problem**: Unable to connect to Celestia node

**Solution**:
- Check if your Celestia light node is running: `ps aux | grep celestia`
- Verify the node is listening on the correct port: `lsof -i :26658`
- Ensure your authorization token is correct
- Restart the node and API proxy server

#### 2. IPFS Connectivity Issues

**Problem**: Files not uploading to IPFS

**Solution**:
- Verify your IPFS daemon is running: `ipfs id`
- Check IPFS API accessibility: `curl -X POST http://localhost:5001/api/v0/id`
- Ensure proper CORS configuration: `ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'`

#### 3. ZK Circuit Loading Failures

**Problem**: ZK circuit files not loading properly

**Solution**:
- Confirm circuit files exist in `/public/circuits/`
- Check browser console for specific loading errors
- Try using the browser on a device with more RAM
- Clear browser cache and refresh

## API Reference

### Celestia Service API

| Method | Description |
|--------|-------------|
| `checkCelestiaConnection()` | Tests connection to Celestia node |
| `submitToCelestia(ipfsHash, namespace)` | Submits data to Celestia |
| `getDataFromCelestia(height, namespace)` | Retrieves data from specified block |
| `verifyCelestiaData(height, expectedIpfsHash, namespace)` | Verifies stored data |
| `generateUniqueNamespace(seed)` | Creates unique namespace identifier |

### Zero Knowledge API

| Method | Description |
|--------|-------------|
| `generateProof(ipfsHash, secret)` | Creates ZK proof for file |
| `verifyProof(proof, publicSignals, expectedIpfsHash)` | Verifies ZK proof |
| `createFileVerification(ipfsHash, secret)` | Complete verification process |
| `checkZkCircuitAvailability()` | Checks if ZK circuits are available |

### IPFS Service API

| Method | Description |
|--------|-------------|
| `checkIPFSConnection()` | Tests connection to IPFS node |
| `ipfsUpload(file)` | Uploads file to IPFS |
| `ipfsDownload(cid, filename)` | Downloads file from IPFS |
| `ipfsGet(cid)` | Gets data from IPFS (small files) |
| `ipfsGetMetadata(cid)` | Gets file metadata from IPFS |

## Security Considerations

zkλ implements several security measures:

1. **Data Integrity**
   - IPFS content-addressing ensures data has not been tampered with
   - Celestia DA layer provides blockchain-level integrity guarantees

2. **Cryptographic Verification**
   - ZK proofs verify file properties without revealing content
   - Celestia namespaces provide cryptographic isolation of data

3. **Authentication**
   - Wallet-based authentication for sender verification
   - Celestia authorization tokens for node access

4. **Privacy Protection**
   - Zero Knowledge Proofs allow verification without data exposure
   - Selective disclosure of file metadata

## Future Development

Planned technical improvements for zkλ:

1. **Celestia Mainnet Support**
   - Production deployment on Celestia mainnet
   - Network parameter optimization for cost efficiency

2. **Enhanced ZK Circuit Capabilities**
   - Implement more complex ZK proving statements
   - Add selective disclosure of file properties (size, type, creation date)

3. **Cross-Chain Integration**
   - Support for multiple blockchain backends beyond Celestia
   - Bridge to Ethereum and other EVM-compatible chains

4. **Performance Optimization**
   - WebAssembly optimizations for ZK proof generation
   - Parallel processing for large file uploads

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Celestia team for their data availability layer implementation
- SnarkJS and circom for ZK circuit development tools
- IPFS project for decentralized storage capabilities
- Svelte framework for reactive UI components

---

## Development Process

To contribute to the development of zkλ:

```bash
# Fork and clone the repository
git clone https://github.com/yourusername/zkl.git

# Create a feature branch
git checkout -b feature/your-feature-name

# Make changes and test
npm run dev

# Submit a pull request
git push origin feature/your-feature-name
```

All contributions must include appropriate tests and documentation.
