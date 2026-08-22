FROM node:22-alpine
ARG BUILD_COMMIT=unknown
ARG BUILD_TIME
ENV BUILD_COMMIT=$BUILD_COMMIT BUILD_TIME=$BUILD_TIME
RUN apk add --no-cache postgresql16-client tar
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 4100
CMD ["sh", "-c", "npm run migrate && npm start"]
