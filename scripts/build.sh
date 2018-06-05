#!/usr/bin/env bash

rm -r dist

mkdir dist
mkdir dist/src
mkdir dist/src/client
mkdir dist/src/server

cp src/client/* dist/src/client
cp src/server/* dist/src/server
cp package.json yarn.lock dist
