# Use Node.js v20 as base image
FROM node:20-alpine

# Install required dependencies for mediasoup
RUN apk add --no-cache python3 make g++ linux-headers

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]