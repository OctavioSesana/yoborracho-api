FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev || npm install

COPY . .

EXPOSE 3001

# Migra y después arranca. Horneado acá adentro (en vez de depender del "Start
# Command" del servicio en el hosting) porque plataformas como Render, al
# detectar este Dockerfile, ignoran ese campo y corren el CMD del Dockerfile
# directo — si migrate estaba solo en el Start Command, nunca se ejecutaba.
CMD ["sh", "-c", "npm run migrate && npm start"]
