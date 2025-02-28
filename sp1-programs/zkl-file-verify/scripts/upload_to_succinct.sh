#!/bin/bash

# Script to upload the SP1 program to the Succinct Network

# Check required environment variables
if [ -z "$SUCCINCT_API_KEY" ]; then
    if [ -f .env ]; then
        echo "SUCCINCT_API_KEY environment variable not found, loading from .env file..."
        export $(cat .env | grep -v "^#" | xargs)
    else
        echo "ERROR: SUCCINCT_API_KEY not found. Please create an .env file or set the environment variable."
        exit 1
    fi
fi

PROGRAM_ID=${PROGRAM_ID:-"zkl-file-verify-v1"}

# Check if cargo prove is installed
if ! command -v cargo prove &> /dev/null; then
    echo "ERROR: 'cargo prove' command not found. Please install the SP1 toolchain."
    echo "For installation: curl -L https://sp1up.succinct.xyz | bash"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "WARNING: Docker is not running or accessible. Docker is required for reproducible builds."
    echo "Do you want to continue anyway? (y/n)"
    read -r response
    if [[ "$response" != "y" ]]; then
        echo "Operation cancelled."
        exit 1
    fi
    DOCKER_FLAG=""
else
    DOCKER_FLAG="--docker"
fi

echo "Building the program..."
cargo prove build $DOCKER_FLAG

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to build the program."
    exit 1
fi

echo "Uploading the program to Succinct Network (program ID: $PROGRAM_ID)..."
cargo prove upload --program-id "$PROGRAM_ID"

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to upload the program."
    exit 1
fi

echo "Program successfully uploaded!"
echo "Program ID: $PROGRAM_ID"
echo ""
echo "Don't forget to add this ID to the FILE_VERIFY_PROGRAM_ID variable in src/lib/services/zk.js."