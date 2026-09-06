FROM node:22-alpine

WORKDIR /app

# Install k6 binary & curl
RUN apk add --no-cache curl openssl \
    && curl -L https://github.com/grafana/k6/releases/download/v0.54.0/k6-v0.54.0-linux-amd64.tar.gz | tar -xz -C /tmp \
    && mv /tmp/k6-v0.54.0-linux-amd64/k6 /usr/local/bin/k6 \
    && rm -rf /tmp/k6*

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

CMD ["npm", "run", "start"]
