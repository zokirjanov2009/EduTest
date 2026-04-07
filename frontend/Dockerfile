# Build: VITE_API_URL build vaqtida backend URL (masalan https://xxx.up.railway.app/api)
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

FROM node:20-alpine
RUN npm install -g serve@14
WORKDIR /app
COPY --from=build /app/dist ./dist
ENV PORT=8080
EXPOSE 8080
CMD ["sh", "-c", "serve -s dist -l tcp://0.0.0.0:${PORT}"]
