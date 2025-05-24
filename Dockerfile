# Stage 1: Build and Test
FROM node:18-alpine3.17 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --production
COPY . .

# Stage 2: Production Image
FROM node:18-alpine3.17
WORKDIR /app
COPY --from=build /app .


# ENV MONGO_URI=uriPlaceholder # will be overridden by kubernetes secret


EXPOSE 3000
USER node
CMD ["npm", "start"]