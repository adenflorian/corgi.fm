#!/usr/bin/env bash

yarn version --patch

source secrets.sh

echo host: ${SSH_HOST} user: ${SSH_USER}

tar -czvf built/shamu.tar.gz built

scp built/shamu.tar.gz ${SSH_USER}@${SSH_HOST}:shamu.tar.gz

rm built/shamu.tar.gz

echo 'nvm' | ssh ${SSH_USER}@${SSH_HOST} '
    . ~/.nvm/nvm.sh;
    pm2 stop all;
    rm -r shamu;
    mkdir shamu;
    tar -xzvf shamu.tar.gz --directory shamu;
    cd shamu/built;
    yarn --prod;
    yarn start-prod;
'
