# Changelog

## 0.5.4

- update docker example
- rename license file
- update docs and /x links
- update legal stuff
- move site stuff to williamhorning/williamhorning
- bump versions

## 0.4.13

- add tool-versions file
- remove prettier config
- update license year and docs links
- switch over to bridgev1
- clean up bridge code
- update command stuff
- backport platform code
- fix docker-compose file

## 0.5.3

- bump dependency versions
- bump deno version
- fix bug in bolt-guilded
- fix some typing errors

## 0.5.2

- update the bridging commands to match 0.4.x in style
- redo the command system
- implement role colors for revolt
- discord subcommands
- fix bridge creation
- refactor core
- bump dependency versions
- implement embed-bridge migration
- fix discord intents
- bump dependency versions
- bump deno version

## 0.5.1

- bump dependency versions

## 0.5.0

- that whole rewrite thing

## 0.4.9

- backport some fixes from 0.5.0

## 0.4.8

- fix Revolt replies

## 0.4.7

- actually fix DB issues

## 0.4.6

- try fixing DB issues

## 0.4.5

- fix DB handling that broke beta bridges... and caused discord to decide to
  reset our token in prod, oops

## 0.4.4

- fix `!bolt bridge status` command DB lookup
- fix beta bridge system edit support
- docs changes

## 0.4.3

- actualy fix webhook issue

## 0.4.2

- try new webhook creation method for guilded

## 0.4.1

- fix bug

## 0.4.0

- slash commands

## 0.3.1

- Move bridge-specific stuff out of `/index.js`
- Rename `/bridge/legacyBridge.js` to `/bridge/legacyBridgeSend.js`
- Edit bridge documentation to emphasise the word `NOT`
- Fix Guilded username issue, hopefully
- Fix Guilded embed issue, hopefully
- Fix `/docker.compose.yml`

## 0.3.0

- Reimplement the command handler (look at `/commands/index.js`)
- Implement `!bolt ping` command
- Implement docs
- Move most utilities out of other files into `/utils.js`
- Fix Revolt embed mapping
- Implement versioning

## 0.2.0 and below

Check out the commit log for this info, sorry
