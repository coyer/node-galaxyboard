SCRIPT=$(readlink -f "$0")
SCRIPTPATH=$(dirname "$SCRIPT")
if [ -f ./pid ]; then
    nodejs $SCRIPTPATH/../board.js &
    echo $! > $SCRIPTPATH/pid
else
    echo "Board already running. If not delete ./pid file in nodeboard/commands";
fi