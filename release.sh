NAME="vaine-widget"
DATE=`date +%m.%d.%y`

zip -rv "versions/$NAME.$DATE.zip" widget -x widget/js/node_modules/\*

