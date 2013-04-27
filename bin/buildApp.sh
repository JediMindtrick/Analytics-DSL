#!/bin/bash
browserify -r ../lib/executionEngine.js -r ../lib/util.js -r ../lib/builder.js > ../web/app.js