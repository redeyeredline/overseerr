FROM node:20-alpine AS BUILD_IMAGE

WORKDIR /app

ARG TARGETPLATFORM
ENV TARGETPLATFORM=${TARGETPLATFORM:-linux/amd64}

RUN \
  case "${TARGETPLATFORM}" in \
  'linux/arm64' | 'linux/arm/v7') \
  apk update && \
  apk add --no-cache python3 py3-setuptools make g++ gcc libc6-compat bash && \
  yarn global add node-gyp \
  ;; \
  esac

COPY package.json yarn.lock ./
RUN CYPRESS_INSTALL_BINARY=0 yarn install --frozen-lockfile --network-timeout 1000000

COPY . ./

ARG COMMIT_TAG=local
ENV COMMIT_TAG=${COMMIT_TAG}

RUN yarn build

# remove development dependencies
RUN yarn install --production --ignore-scripts --prefer-offline

RUN rm -rf src server .next/cache

RUN touch config/DOCKER

# Ensure commitTag is always set to "local" for custom builds to prevent update checks
RUN echo '{"commitTag": "local"}' > committag.json


FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache tzdata tini && rm -rf /tmp/*

# copy from build image
COPY --from=BUILD_IMAGE /app ./

# Copy and set up entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT [ "/sbin/tini", "--", "/docker-entrypoint.sh" ]
CMD [ "yarn", "start" ]

EXPOSE 5055
