#!/usr/bin/env bash

# https://zaiste.net/a_few_ways_to_execute_commands_remotely_using_ssh/

source secrets.sh

echo host: ${SSH_HOST_TEST} user: ${SSH_USER_TEST}

tar -czvf built/corgi.fm.tar.gz built

scp built/corgi.fm.tar.gz ${SSH_USER_TEST}@${SSH_HOST_TEST}:corgi.fm.tar.gz

rm built/corgi.fm.tar.gz

echo 'nvm' | ssh ${SSH_USER_TEST}@${SSH_HOST_TEST} '
    . ~/.nvm/nvm.sh;
    nvm install 10.14.1;
    nvm use 10.14.1;
    npm i -g yarn pm2;
    pm2 delete all;
    rm -r corgi.fm;
    mkdir corgi.fm;
    tar -xzvf corgi.fm.tar.gz --directory corgi.fm;
    cd corgi.fm/built;
    yarn;
    yarn bootstrap;
    yarn start-test;
'
