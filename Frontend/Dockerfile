# Step 1: Build the Vite app
FROM node:24-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:stable-alpine
# Clean the default nginx page
RUN rm -rf /usr/share/nginx/html/*
# Copy build output to Nginx public folder
COPY --from=builder /app/dist /usr/share/nginx/html
# Replace default nginx config with our own (optional)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
