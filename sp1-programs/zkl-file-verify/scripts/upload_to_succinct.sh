#!/bin/bash

# SP1 programını Succinct Network'e yükleyen script

# Gerekli ortam değişkenlerini kontrol et
if [ -z "$SUCCINCT_API_KEY" ]; then
    if [ -f .env ]; then
        echo "SUCCINCT_API_KEY ortam değişkeni bulunamadı, .env dosyasından yükleniyor..."
        export $(cat .env | grep -v "^#" | xargs)
    else
        echo "HATA: SUCCINCT_API_KEY bulunamadı. Lütfen .env dosyası oluşturun veya ortam değişkenini ayarlayın."
        exit 1
    fi
fi

PROGRAM_ID=${PROGRAM_ID:-"zkl-file-verify-v1"}

# cargo prove yüklü mü kontrol et
if ! command -v cargo prove &> /dev/null; then
    echo "HATA: 'cargo prove' komutu bulunamadı. Lütfen SP1 toolchain'i yükleyin."
    echo "Kurulum için: curl -L https://sp1up.succinct.xyz | bash"
    exit 1
fi

# Docker çalışıyor mu kontrol et
if ! docker info &> /dev/null; then
    echo "UYARI: Docker çalışmıyor veya erişilemiyor. Reproducible build için Docker gereklidir."
    echo "Yine de devam etmek istiyor musunuz? (e/h)"
    read -r response
    if [[ "$response" != "e" ]]; then
        echo "İşlem iptal edildi."
        exit 1
    fi
    DOCKER_FLAG=""
else
    DOCKER_FLAG="--docker"
fi

echo "Programı derleniyor..."
cargo prove build $DOCKER_FLAG

if [ $? -ne 0 ]; then
    echo "HATA: Program derlenemedi."
    exit 1
fi

echo "Program Succinct Network'e yükleniyor (program ID: $PROGRAM_ID)..."
cargo prove upload --program-id "$PROGRAM_ID"

if [ $? -ne 0 ]; then
    echo "HATA: Program yüklenemedi."
    exit 1
fi

echo "Program başarıyla yüklendi!"
echo "Program ID: $PROGRAM_ID"
echo ""
echo "Bu ID'yi src/lib/services/zk.js dosyasındaki FILE_VERIFY_PROGRAM_ID değişkenine eklemeyi unutmayın." 