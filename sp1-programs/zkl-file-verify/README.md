# zkλ File Verification - Succinct SP1 Programı

Bu klasör, zkλ uygulamasının IPFS hash doğrulama işlemlerini Succinct Prover Network üzerinde çalıştırmak için gereken SP1 zkVM programını içerir.

## Genel Bakış

Bu program, bir IPFS CID hash değerini ve kullanıcıya ait gizli bir değeri (secret) kullanarak Zero Knowledge kanıtları oluşturur. Bu kanıtlar, dosyanın bütünlüğünü ve kullanıcının gizli değeri bildiğini (dolayısıyla dosyanın sahibi olduğunu) kanıtlar, ancak gizli değeri ifşa etmez.

## Ön Gereksinimler

SP1 zkVM kullanabilmek için aşağıdaki yazılımlara ihtiyacınız var:

- Git
- Rust (Nightly)
- Docker

## Kurulum

### 1. Succinct Toolchain Kurulumu

SP1 araç zincirini yüklemek için terminalinizde aşağıdaki komutu çalıştırın:

```bash
# Yükleyiciyi indirin ve çalıştırın
curl -L https://sp1up.succinct.xyz | bash

# Yükleme tamamlandıktan sonra araç zincirini yükleyin
sp1up
```

Kurulumu doğrulamak için:

```bash
cargo prove --version
```

### 2. Programı Derleme

Programı derlemek için:

```bash
cd sp1-programs/zkl-file-verify
make build
```

Bu komut, SP1 programını derleyecek ve çalıştırılabilir bir ELF dosyası oluşturacaktır.

### 3. Testleri Çalıştırma

Programı test etmek için:

```bash
make test
```

### 4. Yerel Olarak Kanıt Oluşturma

Yerel olarak bir ZK kanıtı oluşturmak için:

```bash
make prove TEST_IPFS_HASH="QmYourHashHere" TEST_SECRET="YourSecretHere"
```

Not: Yerel makinelar için çok büyük programların kanıtlarını oluşturmak uzun sürebilir. Büyük programlar için Succinct Prover Network kullanmanızı öneririz.

### 5. Succinct Prover Network'e Yükleme

Programı Succinct Prover Network'e yüklemek için (Testnet API anahtarına ihtiyacınız olacak):

```bash
# API anahtarınızı ayarlayın (bu bilgiyi güvenli bir şekilde saklayın)
export SUCCINCT_API_KEY="your-api-key-here"

# Programı yükleyin
make upload
```

Program yüklendikten sonra, programın program_id'sini not edin. Bu ID, zkλ uygulamasında `src/lib/services/zk.js` dosyasındaki `FILE_VERIFY_PROGRAM_ID` değişkenine eklenmelidir.

## Program Detayları

Program, bir IPFS hash değeri ve gizli bir değeri (secret) kullanarak aşağıdaki işlemleri gerçekleştirir:

1. IPFS hash değerinden bir sayısal değer hesaplar.
2. Kullanıcının gizli değeri ve IPFS hash değerini kullanarak bir bağlılık (commitment) oluşturur.
3. Hesaplanan hash değerinin, beklenen değerle eşleştiğini doğrular.
4. Gizli değeri açıklamadan, kullanıcının bu değeri bildiğini kanıtlar.

## API Kullanımı

Programı Succinct Prover Network üzerinden çağırmak için gereken girdiler:

- `ipfs_hash`: IPFS CID değeri (örn: "QmTPmBiq...")
- `hash_value`: IPFS CID'den hesaplanan sayısal değer
- `secret`: Kullanıcı tarafından bilinen gizli değer

Çıktı, doğrulanabilir bir Zero Knowledge kanıtı ve bağlılık (commitment) değerini içerir.

## Sorun Giderme

- **Docker Sorunları**: Programı Docker içinde derlemek için `--docker` bayrağı kullanılır. Docker'ın yüklü ve çalışır durumda olduğundan emin olun.
- **API Anahtarı Hataları**: Succinct API anahtarınızın doğru olduğundan ve testnet için geçerli olduğundan emin olun.
- **Kaynak Yetersizliği**: Büyük programlar için yeterli RAM ve CPU kaynağı sağlayın veya Succinct Prover Network'ü kullanın.

## Kaynaklar

- [SP1 Dokümanları](https://docs.succinct.xyz/sp1)
- [Succinct Prover Network](https://docs.succinct.xyz/prover-network)
- [SP1 Github Reposu](https://github.com/succinctlabs/sp1) 