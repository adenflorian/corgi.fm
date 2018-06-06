#!/usr/bin/env bash

source secrets.sh

echo host: ${PROD_HOST} user: ${PROD_USER}

tar -czvf built/shamu.tar.gz built

scp built/shamu.tar.gz ${PROD_USER}@${PROD_HOST}:shamu.tar.gz

rm built/shamu.tar.gz

echo 'nvm' | ssh ${PROD_USER}@${PROD_HOST} '
    . ~/.nvm/nvm.sh;
    pm2 stop all;
    rm -r shamu;
    mkdir shamu;
    tar -xzvf shamu.tar.gz --directory shamu;
    cd shamu/built;
    yarn;
    yarn start-prod;
'
