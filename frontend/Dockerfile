# Stage 1: Build the React app
FROM node:22.12.0-alpine AS builder
WORKDIR /app

# Accept build arguments
ARG VITE_BACKEND_URL
ARG VITE_WEBSOCKET_URL

# Set environment variables for Vite (baked into the build at compile time)
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_WEBSOCKET_URL=$VITE_WEBSOCKET_URL

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build the app
COPY . .
RUN npm run build

# Stage 2: Serve the app with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
