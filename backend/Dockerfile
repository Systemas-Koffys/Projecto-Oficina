FROM node:18-slim

# Instalar cliente mysql (incluye mysqldump) para permitir copias de seguridad
RUN apt-get update && apt-get install -y default-mysql-client && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
