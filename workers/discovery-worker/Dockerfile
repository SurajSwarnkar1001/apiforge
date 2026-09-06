FROM mcr.microsoft.com/playwright:v1.50.1-jammy

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

CMD ["npm", "run", "start"]
