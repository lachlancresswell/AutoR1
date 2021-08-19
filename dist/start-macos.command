CURDIR=`dirname "$0"`
APP='/autor1'
ARG=" $CURDIR"
$CURDIR$APP$ARG
rtn=$?
read -p "Press enter to continue."
exit $rtn