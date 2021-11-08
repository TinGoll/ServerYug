FROM node:16-alpine3.14
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3131
CMD [ "node", "index.js" ]
