# node-galaxyboard
A free &amp; simple nodejs bulletin-board

You should not use Galaxyboard in production.


## Installation / Update

- stop current execution of board
- copy new files to directory
- run the following command, the board database will be updated:

    sh install/install.sh

- start the board. We recommend using "forever":

    node_modules/forever/bin/forever start board.js