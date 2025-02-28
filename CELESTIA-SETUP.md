# Celestia Light Node Setup

This guide explains the setup of a Celestia Light Node for the ZKL application. This guide includes the necessary steps for you to connect your browser-based application to a real Celestia network.

## Requirements

- Linux or macOS operating system
- At least 2 GB RAM
- At least 100 GB disk space
- Go 1.21+ installed

## Installation Steps

### 1. Installing Dependencies

**For Ubuntu/Debian**

```bash
sudo apt-get update
sudo apt-get install -y curl git build-essential
```

**For macOS:**

```bash
brew install curl git
```

### 2. Installing Go

Install the latest version of Go:

```bash
wget https://go.dev/dl/go1.21.6.linux-amd64.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.21.6.linux-amd64.tar.gz
```

Update the PATH variable:

```bash
echo "export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin" >> $HOME/.profile
source $HOME/.profile
```

Check Go version:

```bash
go version
```

### 3. Cloning the Celestia Node Repository

```bash
git clone https://github.com/celestiaorg/celestia-node.git
cd celestia-node
```

Check the latest version:

```bash
git checkout tags/v0.12.4
```

### 4. Building the Node

```bash
make build
make install
```

Verify the installation:

```bash
celestia version
```

### 5. Starting the Light Node

#### 5.1 Starting the Light Node (Mocha Testnet)

First, initialize the node:

```bash
celestia light init --p2p.network mocha
```

This command will generate an authorization key. Note this key:

```bash
celestia light auth admin --p2p.network mocha
```

Note the output, it will look like this:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBbGxvdyI6WyJwdWJsaWMiLCJyZWFkIiwid3JpdGUiLCJhZG1pbiJdfQ.ayarlRig-VW15nL05_mmj5rHUmlouFF25xevip2yrr0
```

#### 5.2 Starting the Light Node as a Service

Start the light node using the following command:

```bash
celestia light start --p2p.network mocha --core.ip rpc-mocha.pops.one --gateway --gateway.addr 127.0.0.1 --gateway.port 26659 --rpc.addr 127.0.0.1
```

or to run in the background:

```bash
nohup celestia light start --p2p.network mocha --core.ip rpc-mocha.pops.one --gateway --gateway.addr 127.0.0.1 --gateway.port 26659 --rpc.addr 127.0.0.1 > celestia.log 2>&1 &
```

## 6. Configuring the ZKL Application

In the `src/lib/services/celestia.js` file, update the following configuration:

```javascript
// Celestia light client API endpoint
const CELESTIA_API_ENDPOINT = 'http://localhost:26659';
const CELESTIA_AUTH_TOKEN = 'AUTHORIZATION_KEY_GENERATED_ABOVE';
```

## Troubleshooting

### Node Connection Error

If your application gives the following error:

```
Celestia node connection error: Network Error
```

Try these steps:

1. **Check if the Celestia Node is Running**

```bash
ps aux | grep celestia
```

2. **Check if the Node is Listening on the Correct Port**

```bash
netstat -tuln | grep 26659
```

3. **Test the API Manually**

```bash
curl -X GET http://localhost:26659/header/status -H "Authorization: Bearer YOUR_AUTHORIZATION_KEY" -v
```

4. **Check Node Logs**

```bash
tail -f celestia.log
```

5. **Restart the Node**

```bash
pkill celestia
nohup celestia light start --p2p.network mocha --core.ip rpc-mocha.pops.one --gateway --gateway.addr 127.0.0.1 --gateway.port 26659 --rpc.addr 127.0.0.1 > celestia.log 2>&1 &
```

6. **Testnet Issues**

The Mocha testnet may experience issues occasionally. Alternatively, you can try another testnet or use the main network.

## Development vs. Production

- Mocha testnet is recommended for development.
- For production, you should use the Celestia main network and configure your node with `--p2p.network celestia`.

## Resources

- [Celestia Official Documentation](https://docs.celestia.org/)
- [GitHub Repository](https://github.com/celestiaorg/celestia-node)
- [Discord Community](https://discord.com/invite/YsnTPcSfWQ)
- [Celestia Light Node Documentation](https://docs.celestia.org/nodes/light-node) 