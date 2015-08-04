SCRIPT=$(readlink -f "$0")
SCRIPTPATH=$(dirname "$SCRIPT")
nodejs $SCRIPTPATH/prepare_migration.js
nodejs $SCRIPTPATH/../node_modules/.bin/db-migrate up