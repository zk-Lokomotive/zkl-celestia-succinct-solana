.PHONY: build test prove upload clean

PROGRAM_ID = zkl-file-verify-v1
BUILD_FLAGS = --docker
SP1_CARGO_PROVE = ~/.sp1/bin/cargo-prove

# SP1 yüklü olup olmadığını kontrol et
ifeq (,$(wildcard ~/.sp1/bin/cargo-prove))
$(error "cargo-prove komutu bulunamadı. Lütfen sp1up komutuyla SP1 yükleyin.")
endif

# Varsayılan test IPFS hash'i ve secret
TEST_IPFS_HASH ?= QmTPmBiqnUnL1k3W9GxmZTTtMSEX8rgpwqeCfYsJvodS2d
TEST_SECRET ?= test-secret

# Hash değerini hesapla (basitleştirilmiş, script için)
TEST_HASH_VALUE ?= 123456789

build:
	@echo "SP1 programı derleniyor..."
	$(SP1_CARGO_PROVE) prove build $(BUILD_FLAGS)
	@echo "Program başarıyla derlendi."

test:
	@echo "SP1 programı test ediliyor..."
	$(SP1_CARGO_PROVE) prove test $(BUILD_FLAGS)
	@echo "Testler başarıyla tamamlandı."

# Yerel proof oluşturma
prove: build
	@echo "Proof oluşturuluyor: $(TEST_IPFS_HASH) $(TEST_HASH_VALUE) $(TEST_SECRET)"
	cargo run -- "$(TEST_IPFS_HASH)" "$(TEST_HASH_VALUE)" "$(TEST_SECRET)"

# Succinct Prover Network'e gönderme
upload: build
	@echo "Program Succinct Prover Network'e yükleniyor..."
	$(SP1_CARGO_PROVE) prove upload --program-id $(PROGRAM_ID)
	@echo "Program başarıyla yüklendi, program ID: $(PROGRAM_ID)"

# Clean - derleme çıktılarını temizle
clean:
	@echo "Derleme çıktıları temizleniyor..."
	cargo clean
	@echo "Temizleme tamamlandı."

# Kullanım kılavuzu
help:
	@echo "Kullanım:"
	@echo "  make build         - Programı derle"
	@echo "  make test          - Testleri çalıştır"
	@echo "  make prove         - Yerel olarak proof oluştur"
	@echo "  make upload        - Programı Succinct Network'e yükle"
	@echo "  make clean         - Derleme çıktılarını temizle"
	@echo ""
	@echo "Parametreler:"
	@echo "  TEST_IPFS_HASH=<hash>    - Test için IPFS hash'i (varsayılan: $(TEST_IPFS_HASH))"
	@echo "  TEST_HASH_VALUE=<value>  - Test için hash değeri (varsayılan: $(TEST_HASH_VALUE))"
	@echo "  TEST_SECRET=<secret>     - Test için secret (varsayılan: $(TEST_SECRET))" 