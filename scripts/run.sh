#!/bin/sh
# Feel free to extend this script
echo "FAQ: https://github.com/dice-group/dice-website/wiki/FAQ"
# If you manage to configure gatsby to work with the old packages locally, you can still use:
# gatsby develop

# For most people, using a Docker container to avoid installing all the old libraries might be better:
cd .. && docker run -it --rm -v $(pwd):/app -p 8000:8000 dicegroup/website-base
