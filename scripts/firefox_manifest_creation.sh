#!/usr/bin/env bash

STATIC_DIR=./static
ORIGINAL_MANIFEST=$STATIC_DIR/manifest.json

## cp original manifest
echo "making a manifest copy"
cp $ORIGINAL_MANIFEST $STATIC_DIR/firefox_manifest.json
## Add gecko key to the end of json
echo "appending gecko key to fireforx_manifest.json"
sed -i .bkp -e '$ s/}/,\"applications\":{"gecko":{\"id\": \"ryan@unstoppabledomains.com\"}}}/g' static/firefox_manifest.json
echo "cleaning up"
rm -r $STATIC_DIR/firefox_manifest.json.bkp