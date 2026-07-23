FROM node:22-bookworm-slim

ENV NODE_ENV=production
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/* \
    && npm install --global pnpm@10.28.1

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile \
    && pnpm prisma:generate \
    && pnpm build:api

CMD ["pnpm", "--filter", "@integra/api", "start"]
