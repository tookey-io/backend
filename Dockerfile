FROM node:16-alpine

ENV NODE_ENV development

##
# Prepare system dependencies
##

RUN apk add --no-cache bash ca-certificates git python3 libpq-dev && \
    adduser -h /home/app -u 101 -D app

##
# Build app
##

USER root
WORKDIR /app

COPY package.json package-lock.json /app/
RUN npm install --frozen-lockfile

COPY --chown=101:101 . /app/
RUN npm run build && \
    chown 101:101 -R /app && \
    chmod +x /app/bin/*.sh && \
    rm -rf /root/.npm

##
# Prepare for execution
##

USER 101
ENV TS_NODE_TRANSPILE_ONLY=true
ENV PORT=3000

EXPOSE 3000/tcp
HEALTHCHECK --interval=30s CMD ["/app/bin/readiness.sh"]

CMD ["/usr/local/bin/node", "/app/dist/apps/app/main.js"]
