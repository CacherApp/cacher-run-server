#/bin/bash

rm -rf dist/*
tsc
cp -r ./src/config/ ./dist/config
