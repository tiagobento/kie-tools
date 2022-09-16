#!/bin/bash

rm -rf dist
mkdir dist
docker run --rm -v $(pwd):/src -u $(id -u):$(id -g) \
    emscripten/emsdk emcc src/fsMain.c -o dist/fsMain.js -lidbfs.js --post-js post.js -sEXPORTED_RUNTIME_METHODS=['FS'] -Oz
