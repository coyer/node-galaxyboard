SCRIPT=$(readlink -f "$0")
SCRIPTPATH=$(dirname "$SCRIPT")
if [ -f ./pid ]; then
    echo "Board already running. If not delete ./pid file in nodeboard/commands";
else
    nodejs $SCRIPTPATH/../board.js &
    echo $! > $SCRIPTPATH/pid
fi