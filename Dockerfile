FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm install --ignore-scripts
COPY . .
RUN npm run build
ENV NODE_ENV=production HOST=0.0.0.0
EXPOSE 8080
CMD ["node", "publisher/server.mjs"]
