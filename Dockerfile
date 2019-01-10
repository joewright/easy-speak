FROM node:11.6-alpine

WORKDIR /usr/src
ADD ./package.json /usr/src
RUN npm install