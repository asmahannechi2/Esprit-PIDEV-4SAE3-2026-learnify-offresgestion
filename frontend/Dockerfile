# Etape 1 : Build de l'application Angular
FROM node:20-alpine as build-step
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etape 2 : Serveur Nginx pour servir le contenu statique
FROM nginx:alpine
COPY --from=build-step /app/dist/learnhub/browser /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
