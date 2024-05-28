#!/bin/bash

# compile stylesheet
echo -n "Compiling CSS... "
cd css
rm -f mobile.css
cat base.css skeleton.css layout.css habitat-font.css main.css leaflet.css leaflet.fullscreen.css skewt.css > mobile.tmp
java -jar "../tools/yuicompressor-2.4.8.jar" --type=css mobile.tmp > mobile.css
rm -f mobile.tmp
cd ..
echo "Done!"

#compile javascript
echo -n "Compiling JavaScript... "
cd js
rm -f mobile.js init_plot.js
# precompiled libs
cat jquery* >> mobile.js

VERSION="`git rev-parse --short HEAD`"

BUILD_DATE="`date -u +%Y-%m-%dT%H:%M:%SZ`"

# compile the rest
java -jar "../tools/yuicompressor-2.4.8.jar" --type=js --disable-optimizations --nomunge iscroll.js >> mobile.js
java -jar "../tools/yuicompressor-2.4.8.jar" --type=js --disable-optimizations --nomunge chasecar.lib.js | sed "s/{VER}/$VERSION/" >> mobile.js
java -jar "../tools/yuicompressor-2.4.8.jar" --type=js --disable-optimizations --nomunge tracker.js >> mobile.js
java -jar "../tools/yuicompressor-2.4.8.jar" --type=js --disable-optimizations --nomunge localtracker.js >> mobile.js
java -jar "../tools/yuicompressor-2.4.8.jar" --type=js --disable-optimizations --nomunge app.js | sed "s/{VER}/$VERSION/" | sed "s/{BUILD_DATE}/$BUILD_DATE/" >> mobile.js
java -jar "../tools/yuicompressor-2.4.8.jar" --type=js --disable-optimizations --nomunge colour-map.js >> mobile.js
java -jar "../tools/yuicompressor-2.4.8.jar" --type=js --disable-optimizations --nomunge xdata.js >> mobile.js
java -jar "../tools/yuicompressor-2.4.8.jar" --type=js --disable-optimizations --nomunge station.js >> mobile.js
java -jar "../tools/yuicompressor-2.4.8.jar" --type=js --disable-optimizations --nomunge format.js >> mobile.js

#compile plot lib and config
java -jar "../tools/yuicompressor-2.4.8.jar" --type=js --disable-optimizations --nomunge _jquery.flot.js >> init_plot.js
java -jar "../tools/yuicompressor-2.4.8.jar" --type=js --disable-optimizations --nomunge plot_config.js >> init_plot.js

# create version check file
echo "{\"build_date\": \"$BUILD_DATE\", \"version\": \"$VERSION\", \"refresh\": 86400}" > version.json

cd ..
echo "Done!"

# cache fixes
sed -i'' "s/{VER}/$VERSION/" index.html
sed -i'' "s/{VER}/$VERSION/" service-worker.js

echo "Done!"

echo "Build version: $VERSION Build date: $BUILD_DATE"
