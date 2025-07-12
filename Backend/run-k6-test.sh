#!/bin/bash

# Load variables from .env file line by line
if [ -f .env ]; then
  while IFS='=' read -r key value; do
    # Skip comments and empty lines
    if [[ ! $key =~ ^# && -n $key ]]; then
      export "$key"="$value"
    fi
  done < .env
fi

# Run your k6 script with environment variables
k6 run --env TEST_MAIL="$TEST_MAIL" --env TEST_PASSWORD="$TEST_PASSWORD" src/test/scalabilityTest.js
# k6 run --env TEST_MAIL="$TEST_MAIL" --env TEST_PASSWORD="$TEST_PASSWORD" src/test/spikeTest.js
