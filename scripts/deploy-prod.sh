#!/usr/bin/env bash

source secrets.sh

echo host: ${SSH_HOST} user: ${SSH_USER}

tar -czvf built/corgi.fm.tar.gz built

scp built/corgi.fm.tar.gz ${SSH_USER}@${SSH_HOST}:corgi.fm.tar.gz

rm built/corgi.fm.tar.gz

echo 'nvm' | ssh ${SSH_USER}@${SSH_HOST} '
    . ~/.nvm/nvm.sh;
    pm2 stop all;
    rm -r corgi.fm;
    mkdir corgi.fm;
    tar -xzvf corgi.fm.tar.gz --directory corgi.fm;
    cd corgi.fm/built;
    yarn --prod;
    yarn start-prod;
'
