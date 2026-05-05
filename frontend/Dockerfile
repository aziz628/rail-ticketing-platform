# Stage 1: Build React with Node/Vite
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm install
COPY . .
# Use example env as baseline and build
RUN cp .env.example .env
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
# Copy the static files from the build stage
COPY --from=build /app/dist /usr/share/nginx/html
# Copy nginx config file to replace the default main config
COPY nginx.conf /etc/nginx/nginx.conf
# Expose port 80
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
