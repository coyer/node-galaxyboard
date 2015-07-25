SCRIPT=$(readlink -f "$0")
SCRIPTPATH=$(dirname "$SCRIPT")
nodejs $SCRIPTPATH/create_database_json.js
nodejs $SCRIPTPATH/../node_modules/.bin/db-migrate up