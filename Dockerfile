FROM node:16-alpine

WORKDIR /usr/rce-api

COPY package*.json .

RUN npm install

COPY . .

CMD npm start