# Menggunakan Node.js versi 18 sebagai base image
FROM node:18-alpine

# Set working directory di dalam container
WORKDIR /app

# Copy package.json dan package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy semua file project ke container
COPY . .

# Expose port yang digunakan aplikasi
EXPOSE 3001

# Command untuk menjalankan aplikasi
CMD ["npm", "start"]
