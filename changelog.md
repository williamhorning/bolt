# changelog

## 0.4.10

- remove /utils dependencies
- make it easier to add more plugins
- use `docker compose` in docs instead of `docker-compose`
- clean up other things

## 0.4.9

- backport various fixes

## 0.4.8

- fix Revolt replies

## 0.4.7

- actually fix DB issues

## 0.4.6

- try fixing DB issues

## 0.4.5

- fix DB handling that broke beta bridges... and caused discord to decide to reset our token in prod, oops

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
