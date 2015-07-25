SCRIPT=$(readlink -f "$0")
SCRIPTPATH=$(dirname "$SCRIPT")
nodejs $SCRIPTPATH/create_database_json.js
node_modules/.bin/db-migrate up