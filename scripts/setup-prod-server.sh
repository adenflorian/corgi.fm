#!/usr/bin/env bash

source secrets.sh

ssh ${PROD_USER}@${PROD_HOST} '
    curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash;
    export NVM_DIR="$HOME/.nvm";
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh";  # This loads nvm
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion";  # This loads nvm bash_completion
    nvm install 10.3;
    npm i -g yarn pm2;
'
