# Use official lightweight Node.js image
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /usr/src/app

# Copy package configurations
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application files (app directory contains our Express backend & frontend)
COPY app ./app

# Expose port
EXPOSE 3000

# Set environment variable
ENV NODE_ENV=production
ENV PORT=3000

# Run the backend server
CMD ["node", "app/server.js"]
