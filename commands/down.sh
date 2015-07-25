SCRIPT=$(readlink -f "$0")
SCRIPTPATH=$(dirname "$SCRIPT")
kill $(cat $SCRIPTPATH/pid)
rm $SCRIPTPATH/pid