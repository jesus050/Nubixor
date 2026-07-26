FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 4100
CMD ["sh", "-c", "npm run migrate && npm start"]
