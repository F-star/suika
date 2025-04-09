
# build for production
FROM node:18-alpine as build-stage
WORKDIR /app

COPY package.json pnpm-lock.yaml prisma .env ./

RUN npm config set registry https://registry.npmmirror.com/
RUN npm install -g pnpm

COPY . .

RUN pnpm install 
RUN pnpm exec prisma generate

RUN pnpm run build

# production stage
FROM node:18-alpine as production-stage

COPY --from=build-stage /app/dist /app
COPY --from=build-stage /app/package.json /app/package.json
COPY --from=build-stage /app/prisma /app/prisma
COPY --from=build-stage /app/.env /app/.env

WORKDIR /app

RUN npm config set registry https://registry.npmmirror.com/

RUN npm install -g pnpm
RUN pnpm install
RUN pnpm exec prisma generate


EXPOSE 5356

# CMD ["npm", "run", "start:migrate:prod"]
CMD ["sh", "-c", "pnpm run migrate:prod && node /app/src/main.js"]
