# Use the official Node.js image as the base image, specifying the Node.js version
FROM node:8.11.3

# Install npm 6.1.0 globally
RUN npm install -g npm@6.1.0

# Set the working directory
WORKDIR /app

EXPOSE 3000
# Keep the container running indefinitely
CMD ["tail", "-f", "/dev/null"]