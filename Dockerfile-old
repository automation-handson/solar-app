# Stage 1: Build and Test
FROM node:22 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .

# Stage 2: Production Image
FROM node:22
WORKDIR /app
COPY --from=build /app .


ENV MONGO_URI=uriPlaceholder
ENV MONGO_USERNAME=usernamePlaceholder
ENV MONGO_PASSWORD=passwordPlaceholder

EXPOSE 3000

CMD ["npm", "start"]