# zkλ Celestia and Zero Knowledge (ZK) Integration

This document explains the technical details of the Celestia Data Availability Layer (DA) and Zero Knowledge (ZK) proofs integration in the zkλ application.

## Architecture Overview

The zkλ application uses two advanced technologies to enhance security and verifiability in data transfers:

1. **Celestia Data Availability (DA)**: Ensures file transfer information is recorded transparently and immutably.
2. **Zero Knowledge Proofs (ZKP)**: Enables verification of file transfers while preserving privacy.

## Celestia Integration

The Celestia integration in the application allows recording file transfers or IPFS CIDs to the blockchain.

### Celestia Functions

- **Connection Check**: The `checkCelestiaConnection()` function checks your connection to a Celestia light node and returns connection details.
- **Data Submission**: The `submitToCelestia()` function records an IPFS CID on the Celestia blockchain with a specific namespace.
- **Data Verification**: The `verifyCelestiaData()` function retrieves data at a specific block height and compares it with the expected IPFS CID.
- **View Transactions**: The `getAllCelestiaTransactions()` function retrieves past Celestia transactions.

