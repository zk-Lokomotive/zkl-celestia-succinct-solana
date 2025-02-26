# Celestia Light Node Kurulumu

Bu rehber, ZKL uygulaması için bir Celestia Light Node kurulumunu açıklamaktadır. Bu rehber, Tarayıcı tabanlı uygulamanızı gerçek bir Celestia ağına bağlayabilmeniz için gerekli adımları içerir.

## Gereksinimler

- Linux veya macOS işletim sistemi
- En az 2 GB RAM
- En az 100 GB disk alanı
- Go 1.21+ kurulu olmalı

## Kurulum Adımları

### 1. Bağımlılıkların Kurulması

**Ubuntu/Debian için:**

```bash
sudo apt-get update
sudo apt-get install -y curl git build-essential
```

**macOS için:**

```bash
brew install curl git
```

### 2. Go Kurulumu

Go'nun son sürümünü kurun:

```bash
wget https://go.dev/dl/go1.21.6.linux-amd64.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.21.6.linux-amd64.tar.gz
```

PATH değişkenini güncelleyin:

```bash
echo "export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin" >> $HOME/.profile
source $HOME/.profile
```

Go sürümünü kontrol edin:

```bash
go version
```

### 3. Celestia Node Reposunu Klonlama

```bash
git clone https://github.com/celestiaorg/celestia-node.git
cd celestia-node
```

En son sürümü kontrol edin:

```bash
git checkout tags/v0.12.4
```

### 4. Node'u İnşa Etme

```bash
make build
make install
```

Kurulumu doğrulayın:

```bash
celestia version
```

### 5. Light Node Başlatma

#### 5.1 Light Node Başlatma (Mocha Testnet)

Önce node'u başlatın:

```bash
celestia light init --p2p.network mocha
```

Bu komut bir yetkilendirme anahtarı oluşturacaktır. Bu anahtarı not edin:

```bash
celestia light auth admin --p2p.network mocha
```

Çıktıyı not alın, aşağıdaki gibi görünecek:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBbGxvdyI6WyJwdWJsaWMiLCJyZWFkIiwid3JpdGUiLCJhZG1pbiJdfQ.ayarlRig-VW15nL05_mmj5rHUmlouFF25xevip2yrr0
```

#### 5.2 Light Node'u Hizmet Olarak Başlatma

Aşağıdaki komutu kullanarak light node'u başlatın:

```bash
celestia light start --p2p.network mocha --core.ip rpc-mocha.pops.one --gateway --gateway.addr 127.0.0.1 --gateway.port 26659 --rpc.addr 127.0.0.1
```

veya arka planda çalıştırmak için:

```bash
nohup celestia light start --p2p.network mocha --core.ip rpc-mocha.pops.one --gateway --gateway.addr 127.0.0.1 --gateway.port 26659 --rpc.addr 127.0.0.1 > celestia.log 2>&1 &
```

## 6. ZKL Uygulamasını Yapılandırma

`src/lib/services/celestia.js` dosyasında, aşağıdaki yapılandırmayı güncelleyin:

```javascript
// Celestia light client API endpoint
const CELESTIA_API_ENDPOINT = 'http://localhost:26659';
const CELESTIA_AUTH_TOKEN = 'YUKARIDA_OLUŞTURULAN_YETKILENDIRME_ANAHTARI';
```

## Sorun Giderme

### Node Bağlantı Hatası

Uygulamanız aşağıdaki hatayı verirse:

```
Celestia node connection error: Network Error
```

Şu adımları deneyin:

1. **Celestia Node'un Çalıştığını Kontrol Edin**

```bash
ps aux | grep celestia
```

2. **Node'un Doğru Portta Dinlediğini Kontrol Edin**

```bash
netstat -tuln | grep 26659
```

3. **Manuel olarak API'yi Test Edin**

```bash
curl -X GET http://localhost:26659/header/status -H "Authorization: Bearer YETKILENDIRME_ANAHTARINIZ" -v
```

4. **Node Loglarını Kontrol Edin**

```bash
tail -f celestia.log
```

5. **Restart the Node**

```bash
pkill celestia
nohup celestia light start --p2p.network mocha --core.ip rpc-mocha.pops.one --gateway --gateway.addr 127.0.0.1 --gateway.port 26659 --rpc.addr 127.0.0.1 > celestia.log 2>&1 &
```

6. **Testnet Sorunları**

Mocha testnet bazen sorunlar yaşayabilir. Alternatif olarak başka bir testnet deneyebilirsiniz veya ana ağı kullanabilirsiniz.

## Geliştirme vs. Üretim

- Geliştirme için Mocha testnet önerilir.
- Üretim için, Celestia ana ağını kullanmanız ve node'unuzu `--p2p.network celestia` ile yapılandırmanız gerekir.

## Kaynaklar

- [Celestia Resmi Belgeler](https://docs.celestia.org/)
- [GitHub Reposu](https://github.com/celestiaorg/celestia-node)
- [Discord Topluluğu](https://discord.com/invite/YsnTPcSfWQ)
- [Celestia Light Node Dokümantasyonu](https://docs.celestia.org/nodes/light-node) 