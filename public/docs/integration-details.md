# zkλ Celestia ve Zero Knowledge (ZK) Entegrasyonu

Bu belge, zkλ uygulamasındaki Celestia Data Availability Layer (DA) ve Zero Knowledge (ZK) kanıtları entegrasyonunun teknik detaylarını açıklar.

## Mimari Genel Bakış

zkλ uygulaması, veri transferlerinde güvenlik ve doğrulanabilirliği artırmak için iki ileri teknoloji kullanır:

1. **Celestia Data Availability (DA)**: Dosya transfer bilgilerinin şeffaf ve değiştirilemez şekilde kaydedilmesini sağlar.
2. **Zero Knowledge Proofs (ZKP)**: Dosya transferlerinin gizliliğini koruyarak doğrulanmasını sağlar.

## Celestia Entegrasyonu

Uygulamadaki Celestia entegrasyonu, dosya transferlerinin veya IPFS CID'lerinin blokzincirine kaydedilmesini sağlar.

### Celestia İşlevleri

- **Bağlantı Kontrolü**: `checkCelestiaConnection()` işlevi, bir Celestia light node'una bağlantınızı kontrol eder ve bağlantı detaylarını döndürür.
- **Veri Gönderimi**: `submitToCelestia()` işlevi, bir IPFS CID'yi Celestia blokzincirinde belirli bir namespace ile kaydeder.
- **Veri Doğrulama**: `verifyCelestiaData()` işlevi, belirli bir blok yüksekliğindeki veriyi çeker ve beklenen IPFS CID ile karşılaştırır.
- **İşlemleri Görüntüleme**: `getAllCelestiaTransactions()` işlevi, geçmiş Celestia işlemlerini getirir.

### Kullanım Örneği

```javascript
// Celestia'ya IPFS CID'yi kaydet
const celestiaData = await submitToCelestia(ipfsCid);
console.log(`Dosya Celestia'ya kaydedildi, blok yüksekliği: ${celestiaData.height}`);

// Daha sonra doğrula
const verifyResult = await verifyCelestiaData(celestiaData.height, ipfsCid);
if (verifyResult.isValid) {
  console.log('Celestia verisi doğrulandı!');
}
```

## Zero Knowledge (ZK) Entegrasyonu

ZK entegrasyonumuz, dosyanın IPFS hash'inin mahremiyeti koruyarak doğrulanmasını sağlar.

### ZK İşlevleri

- **Kanıt Oluşturma**: `generateProof()` işlevi, bir IPFS CID ve gizli değer kullanarak ZK kanıtı oluşturur.
- **Kanıt Doğrulama**: `verifyProof()` işlevi, bir ZK kanıtını doğrular ve geçerli olup olmadığını kontrol eder.
- **Dosya Doğrulama**: `createFileVerification()` işlevi, bir IPFS CID için hem kanıt oluşturur hem de doğrulama yapar.
- **Devre Kontrolü**: `checkZkCircuitAvailability()` işlevi, gerekli ZK devre dosyalarının mevcut olup olmadığını kontrol eder.

### Kullanım Örneği

```javascript
// Dosya için ZK kanıtı oluştur
const secret = "kullanıcı-gizli-anahtarı";
const zkResult = await createFileVerification(ipfsCid, secret);

if (zkResult.isValid) {
  console.log('ZK kanıtı başarıyla oluşturuldu');
  
  // Daha sonra kanıtı doğrula
  const isValid = await verifyProof(
    zkResult.verificationData.proof,
    zkResult.verificationData.publicSignals,
    ipfsCid
  );
  
  console.log(`Kanıt doğrulama sonucu: ${isValid}`);
}
```

## Arayüz Bileşenleri

Uygulamada Celestia ve ZK entegrasyonlarını görselleştiren birkaç özel bileşen bulunmaktadır:

1. **CelestiaStatus**: Celestia node'una bağlantı durumunu gösterir
2. **CelestiaTransactions**: Geçmiş Celestia işlemlerini listeler
3. **ZkStatus**: ZK devre dosyalarının durumunu gösterir

## Kurulum ve Gereksinimleri

### Celestia Gereksinimleri

1. Çalışan bir Celestia light node (port 26659)
2. Geçerli bir API anahtarı

### ZK Gereksinimleri

1. `/public/circuits/` dizininde gerekli devre dosyaları:
   - `hash_check.wasm`
   - `hash_check_final.zkey`
   - `verification_key.json`

## Sorun Giderme

### Celestia Sorunları

- **Bağlantı Hatası**: Light node'un çalıştığından ve API anahtarının doğru olduğundan emin olun
- **Yükleme Hatası**: Namespace ID'nin geçerli olduğundan emin olun
- **Veri Bulunamadı**: Doğru blok yüksekliği ve namespace kullanıldığından emin olun

### ZK Sorunları

- **Devre Bulunamadı**: Devre dosyalarının `/public/circuits/` dizininde olduğundan emin olun
- **Kanıt Oluşturma Hatası**: Yeterli bellek olduğundan emin olun, ZK devreleri yoğun hesaplama gerektirir
- **Doğrulama Hatası**: Kanıt, public signals ve IPFS CID'nin doğru olduğundan emin olun

---

Bu belge, zkλ uygulamasının Celestia ve ZK entegrasyonunu anlamanıza yardımcı olmak için hazırlanmıştır. Herhangi bir soru veya sorun için, lütfen geliştirici ekibiyle iletişime geçin.

## Kaynaklar

- [Celestia Dokümantasyonu](https://celestia.org/docs/)
- [ZK-SNARKs Rehberi](https://zkp.science/)
- [IPFS Dokümantasyonu](https://docs.ipfs.io/) 