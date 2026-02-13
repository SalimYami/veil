# Étape 1 : Construction (Build)
FROM node:20-slim AS build

WORKDIR /app

# Copier les fichiers de configuration pnpm/npm
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Installer les dépendances
RUN npm install

# Copier le code source
COPY . .

# Construire l'application
RUN npm run build

# Étape 2 : Serveur de production (Nginx)
FROM nginx:alpine

# Copier les fichiers construits vers le répertoire Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copier une configuration Nginx personnalisée si nécessaire
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
