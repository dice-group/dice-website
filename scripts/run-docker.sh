#!/bin/sh
# Feel free to extend this script
echo "FAQ: https://github.com/dice-group/dice-website/wiki/FAQ"

# Run Docker container (avoids installing all [old] libraries):
cd .. && docker run -it --rm -v $(pwd):/app -p 8000:8000 dicegroup/website-base
