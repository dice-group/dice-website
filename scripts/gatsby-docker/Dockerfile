FROM node:14-bullseye

VOLUME /app

RUN npm install -g --unsafe-perm gatsby@4.24.8

CMD cd /app/scripts && npm install && npm run lint && gatsby develop -H 0.0.0.0
