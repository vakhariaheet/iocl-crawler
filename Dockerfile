# Use the official Playwright Docker image
FROM mcr.microsoft.com/playwright:v1.49.0-jammy 

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install the dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
RUN npm run build

# Set the command to run the script
CMD ["node", "dist/src/main.js"]