.PHONY: build test prove upload clean

PROGRAM_ID = zkl-file-verify-v1
BUILD_FLAGS = --docker
SP1_CARGO_PROVE = ~/.sp1/bin/cargo-prove

# Check if SP1 is installed
ifeq (,$(wildcard ~/.sp1/bin/cargo-prove))
$(error "cargo-prove command not found. Please install SP1 using the sp1up command.")
endif

# Default test IPFS hash and secret
TEST_IPFS_HASH ?= QmTPmBiqnUnL1k3W9GxmZTTtMSEX8rgpwqeCfYsJvodS2d
TEST_SECRET ?= test-secret

# Calculate hash value (simplified, for script)
TEST_HASH_VALUE ?= 123456789

build:
	@echo "Building SP1 program..."
	$(SP1_CARGO_PROVE) prove build $(BUILD_FLAGS)
	@echo "Program successfully built."

test:
	@echo "Testing SP1 program..."
	$(SP1_CARGO_PROVE) prove test $(BUILD_FLAGS)
	@echo "Tests completed successfully."

# Generate local proof
prove: build
	@echo "Generating proof: $(TEST_IPFS_HASH) $(TEST_HASH_VALUE) $(TEST_SECRET)"
	cargo run -- "$(TEST_IPFS_HASH)" "$(TEST_HASH_VALUE)" "$(TEST_SECRET)"

# Upload to Succinct Prover Network
upload: build
	@echo "Uploading program to Succinct Prover Network..."
	$(SP1_CARGO_PROVE) prove upload --program-id $(PROGRAM_ID)
	@echo "Program successfully uploaded, program ID: $(PROGRAM_ID)"

# Clean - remove build outputs
clean:
	@echo "Cleaning build outputs..."
	cargo clean
	@echo "Cleaning completed."

# Usage guide
help:
	@echo "Usage:"
	@echo "  make build         - Build the program"
	@echo "  make test          - Run tests"
	@echo "  make prove         - Generate proof locally"
	@echo "  make upload        - Upload program to Succinct Network"
	@echo "  make clean         - Clean build outputs"
	@echo ""
	@echo "Parameters:"
	@echo "  TEST_IPFS_HASH=<hash>    - IPFS hash for testing (default: $(TEST_IPFS_HASH))"
	@echo "  TEST_HASH_VALUE=<value>  - Hash value for testing (default: $(TEST_HASH_VALUE))"
	@echo "  TEST_SECRET=<secret>     - Secret for testing (default: $(TEST_SECRET))"