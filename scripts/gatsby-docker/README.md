The Dockerfile in this directory is used as basis to run the develop build of or webpage. To create the image, run the following commands within this directory:
```
docker build -t dicegroup/website-base:n14-g4.24.8-1 .
docker tag dicegroup/website-base:n14-g4.24.8-1 dicegroup/website-base:latest
```
The version tag is a combination of the Node version, the gatsby version and the image version.
