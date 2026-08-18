# ETAPA 1: Build do React usando o Node
FROM node:18 AS build

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
# Aqui geramos a versão de produção do seu React (confirme se o seu comando é build mesmo)
RUN npm run build 

# ETAPA 2: Servidor Nginx para rodar a aplicação
FROM nginx:alpine

# Remove as configurações padrão do Nginx e copia a sua
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/

# Copia os arquivos gerados no "npm run build" para a pasta que o Nginx vai ler
# Nota: a pasta pode ser /app/build ou /app/dist dependendo de como seu React foi criado (Create React App usa build, Vite usa dist)
COPY --from=build /app/build /usr/share/nginx/html

# Expõe a porta 80 que o Nginx usa internamente
EXPOSE 80

# Inicia o Nginx
CMD ["nginx", "-g", "daemon off;"]