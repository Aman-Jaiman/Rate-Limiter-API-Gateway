FROM node:22-alpine



# Set application directory

WORKDIR /app




# Install dependencies first for better Docker caching

COPY package*.json ./


RUN npm ci





# Copy application source code

COPY . .





# Set environment

ENV NODE_ENV=production





# Expose application port

EXPOSE 3001





# Start server

CMD ["npm", "start"]