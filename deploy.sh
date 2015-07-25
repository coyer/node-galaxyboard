#!/usr/bin/env sh
cat ./known_hosts > ~/.ssh/known_hosts
cat ~/.ssh/known_hosts
eval `ssh-agent -s`
ssh-add ./id_rsa
ssh galaxyboard@euve58546.serverprofi24.de -p 55123 'sh ~/galaxyboard/commands/down.sh'
rsync -avze 'ssh -p 55123' ./ galaxyboard@euve58546.serverprofi24.de:galaxyboard
ssh galaxyboard@euve58546.serverprofi24.de -p 55123 'sh ~/galaxyboard/commands/migrate.sh'
ssh galaxyboard@euve58546.serverprofi24.de -p 55123 'sh ~/galaxyboard/commands/up.sh'