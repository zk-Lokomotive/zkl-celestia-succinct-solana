.PHONY: build debug test prove upload clean help analyzer reset-analyzer

# Configuration variables
PROGRAM_ID ?= zkl-file-verify-v1
SP1_PATH ?= ${HOME}/.sp1
SP1_BIN ?= ${SP1_PATH}/bin
SP1_CARGO_PROVE ?= ${SP1_BIN}/cargo-prove

# Environment variable checks
ifeq (${SP1_USE_DOCKER},true)
	BUILD_FLAGS := --docker
else 
	BUILD_FLAGS := 
endif

# Default test values
TEST_IPFS_HASH ?= QmTPmBiqnUnL1k3W9GxmZTTtMSEX8rgpwqeCfYsJvodS2d
TEST_SECRET ?= test-secret
TEST_HASH_VALUE ?= 123456789

# Default target
.DEFAULT_GOAL := help

# Check SP1 installation
check-sp1:
	@if [ ! -f "${SP1_CARGO_PROVE}" ]; then \
		echo "❌ SP1 not found. For installation: curl -L https://sp1up.succinct.xyz | bash"; \
		exit 1; \
	fi
	@echo "✅ SP1 installation exists: ${SP1_CARGO_PROVE}"

# Add bin folder to PATH
set-path:
	@echo "🔄 Adding SP1 bin folder to PATH: export PATH=${SP1_BIN}:\$$PATH"
	@export PATH="${SP1_BIN}:$$PATH"

# Compile the program (for SP1 RISC-V target)
build: check-sp1
	@echo "🔨 Compiling SP1 program..."
	@PATH="${SP1_BIN}:$$PATH" ${SP1_CARGO_PROVE} prove build ${BUILD_FLAGS}
	@echo "✅ Program successfully compiled."

# Compile in debug mode (with special flags)
debug: check-sp1
	@echo "🔍 Compiling in debug mode..."
	@PATH="${SP1_BIN}:$$PATH" ${SP1_CARGO_PROVE} prove build ${BUILD_FLAGS} --features verbose
	@echo "✅ Debug compilation completed."

# Run tests
test: check-sp1
	@echo "🧪 Running tests..."
	@PATH="${SP1_BIN}:$$PATH" ${SP1_CARGO_PROVE} prove test ${BUILD_FLAGS}
	@echo "✅ Tests successfully completed."

# Generate proof locally
prove: build
	@echo "🔐 Generating proof: ${TEST_IPFS_HASH} ${TEST_HASH_VALUE} ${TEST_SECRET}"
	@cargo run -- "${TEST_IPFS_HASH}" "${TEST_HASH_VALUE}" "${TEST_SECRET}"
	@echo "✅ Proof generation completed."

# Upload to Succinct Prover Network
upload: build
	@echo "🌐 Uploading program to Succinct Network..."
	@if [ -z "${SUCCINCT_API_KEY}" ]; then \
		echo "❌ SUCCINCT_API_KEY not defined! Load the .env file or define the environment variable."; \
		exit 1; \
	fi
	@PATH="${SP1_BIN}:$$PATH" ${SP1_CARGO_PROVE} prove upload --program-id ${PROGRAM_ID} ${BUILD_FLAGS}
	@echo "✅ Program successfully uploaded, Program ID: ${PROGRAM_ID}"

# Compile native target to support Rust Analyzer
analyzer:
	@echo "🧠 Compiling standard target for Rust Analyzer..."
	@RUSTFLAGS="--cfg=feature=\"std\"" cargo check --target x86_64-unknown-linux-gnu || cargo check
	@echo "✅ Standard target compilation completed."

# Clean build for Rust Analyzer
reset-analyzer:
	@echo "🧹 Cleaning Rust Analyzer build outputs..."
	@rm -rf target/analyzer || true
	@rm -rf target/*/debug || true
	@echo "✅ Rust Analyzer cleanup completed."

# Cleanup
clean:
	@echo "🧹 Cleaning build outputs..."
	@cargo clean
	@echo "✅ Cleanup completed."

# Docker check
docker-check:
	@echo "🐳 Checking Docker..."
	@if ! docker info > /dev/null 2>&1; then \
		echo "❌ Docker is not running or has authorization issues."; \
		exit 1; \
	fi
	@echo "✅ Docker is running."

# Help menu
help:
	@echo "📚 ZKL File Verify - SP1 Program Commands"
	@echo ""
	@echo "Usage:"
	@echo "  make build         - Compile the program"
	@echo "  make debug         - Compile in debug mode"
	@echo "  make test          - Run tests"
	@echo "  make prove         - Generate proof locally"
	@echo "  make upload        - Upload program to Succinct Network"
	@echo "  make analyzer      - Compile standard target for Rust Analyzer"
	@echo "  make reset-analyzer- Clean Rust Analyzer build outputs"
	@echo "  make clean         - Clean build outputs"
	@echo "  make docker-check  - Check Docker status"
	@echo ""
	@echo "Parameters:"
	@echo "  PROGRAM_ID=<id>        - Program ID (default: ${PROGRAM_ID})"
	@echo "  SP1_USE_DOCKER=true    - Compile using Docker"
	@echo "  TEST_IPFS_HASH=<hash>  - Test IPFS hash (${TEST_IPFS_HASH})"
	@echo "  TEST_HASH_VALUE=<val>  - Test hash value (${TEST_HASH_VALUE})"
	@echo "  TEST_SECRET=<secret>   - Test secret (${TEST_SECRET})"
	@echo ""
	@echo "SP1 Installation: ${SP1_PATH}" 