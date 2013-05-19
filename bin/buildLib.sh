#!/bin/bash
browserify -r ../lib/operations.js -r ../lib/executionEngine.js -r ../lib/util.js -r ../lib/builder.js > ../web/lib.js