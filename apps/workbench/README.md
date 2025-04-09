需要环境：

- nodejs
- postgres

部署脚本：

```sh
pnpm install

# 安装 postgres，基于 docker
pnpm run backend:docker-run
pnpm run backend:prisma-migrate

npm run build
```

后端的环境变量：

```
DATABASE_URL="postgresql://myuser:mypassword@localhost:5432/mydb?schema=public"
```

nginx 代理配置：

```
# /design -> 编辑器 6167
# /api -> 后端 5356 /api
# 其它 -> 工作台
```
