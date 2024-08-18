
FROM node:18-alpine AS build
WORKDIR /app

COPY . .

RUN npm config set registry https://registry.npmmirror.com/
RUN npm install -g pnpm@9.0.2
RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM nginx

COPY --from=build /app/packages/suika-multiplayer/build /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
