FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev || npm install

COPY . .

EXPOSE 3001

CMD ["node", "src/server.js"]
