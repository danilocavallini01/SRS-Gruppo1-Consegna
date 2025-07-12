# Base image
FROM node:20-alpine
# Set working directory
WORKDIR /app
# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install
RUN apk update

ARG PRODUCT
ARG VERSION

RUN apk add --update --virtual .deps --no-cache gnupg && \
    cd /tmp && \
    wget https://releases.hashicorp.com/terraform/1.7.4/terraform_1.7.4_linux_amd64.zip && \
    wget https://releases.hashicorp.com/terraform/1.7.4/terraform_1.7.4_SHA256SUMS && \
    wget https://releases.hashicorp.com/terraform/1.7.4/terraform_1.7.4_SHA256SUMS.sig && \
    wget -qO- https://www.hashicorp.com/.well-known/pgp-key.txt | gpg --import && \
    gpg --verify terraform_1.7.4_SHA256SUMS.sig terraform_1.7.4_SHA256SUMS && \
    grep terraform_1.7.4_linux_amd64.zip terraform_1.7.4_SHA256SUMS | sha256sum -c && \
    unzip /tmp/terraform_1.7.4_linux_amd64.zip -d /tmp && \
    mv /tmp/terraform /usr/local/bin/terraform && \
    rm -f /tmp/terraform_1.7.4_linux_amd64.zip terraform_1.7.4_SHA256SUMS 1.7.4/terraform_1.7.4_SHA256SUMS.sig && \
    apk del .deps
# Copy source code
COPY . .
# Build TypeScript
RUN npm run build
# Expose port
EXPOSE 8000
# Start app
CMD ["node", "dist/src/server.js"]
