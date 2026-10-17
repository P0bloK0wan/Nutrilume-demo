FROM node:24-bookworm-slim
WORKDIR /app
COPY --chown=node:node package.json index.html demo.html app.js sw.js foods.json manifest.webmanifest icon.svg *.png ./
COPY --chown=node:node platform ./platform
COPY --chown=node:node server ./server
COPY --chown=node:node scripts ./scripts
RUN mkdir -p /app/data && chown node:node /app/data
USER node
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000 DATABASE_PATH=/app/data/nutrilume.sqlite
VOLUME ["/app/data"]
EXPOSE 3000
CMD ["node", "server/start.mjs"]
