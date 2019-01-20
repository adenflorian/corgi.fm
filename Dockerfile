FROM node:10.14.1

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json ./
COPY yarn.lock ./

RUN yarn --prod
RUN yarn global add pm2

# Bundle app source
COPY built .

EXPOSE 3000

CMD [ "yarn", "start-prod-docker" ]
