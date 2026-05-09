# Stage 1: Build the React application
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve the application using Node.js (with proxy)
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
# Install only production dependencies
RUN npm install --only=production
# Copy the build output from the build stage
COPY --from=build /app/dist ./dist
# Copy the server script
COPY server.js .
EXPOSE 8080
# Run the node server
CMD ["node", "server.js"]
