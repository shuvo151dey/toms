# Stage 1: Build the React app
FROM node:22.12.0-alpine AS builder
WORKDIR /app

# Accept build arguments
ARG REACT_APP_BACKEND_URL
ARG REACT_APP_WEBSOCKET_URL

# Set environment variables for React
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
ENV REACT_APP_WEBSOCKET_URL=$REACT_APP_WEBSOCKET_URL

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build the React app
COPY . .
RUN npm run build

# Stage 2: Serve the app with Nginx
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
