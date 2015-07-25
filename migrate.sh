#!/usr/bin/env bash
.paasprovider/node/bin/node install/install.js
.paasprovider/node/bin/node node_modules/.bin/db-migrate up