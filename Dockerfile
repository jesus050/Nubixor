FROM node:22-alpine
RUN apk add --no-cache postgresql16-client tar
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 4100
CMD ["sh", "-c", "npm run migrate && npm start"]
