# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

# Workspace manifests first for best layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY Backend/package.json ./Backend/
COPY Frontend/package.json ./Frontend/

# Install Frontend's workspace slice
RUN pnpm install --frozen-lockfile --filter ./Frontend...

# Source files
COPY Frontend/ ./Frontend/

RUN pnpm --filter ./Frontend build

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/Frontend/dist /usr/share/nginx/html
COPY Frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
