#FROM node:20-alpine
FROM node:20-bullseye

# 安装 libc6-compat
RUN apt-get update && apt-get install -y libc6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /src
ADD . .

# install dependencies
RUN npm install -g pnpm typescript

# RUN set -ex && npm install
#RUN set -ex && pnpm install

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

#RUN npx prisma generate
RUN tsc

#ENTRYPOINT ["npm", "run", "start"]
# CMD ["npm", "run", "start"]
CMD ["pnpm", "start"]