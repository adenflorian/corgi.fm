FROM node:10.14.1

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json ./
COPY yarn.lock ./

RUN yarn

# Bundle app source
COPY . .

RUN yarn build

EXPOSE 3000

CMD [ "yarn", "start-prod-docker" ]
