SCRIPT=$(readlink -f "$0")
SCRIPTPATH=$(dirname "$SCRIPT")
cat $SCRIPTPATH/pid | kill
rm $SCRIPTPATH/pid