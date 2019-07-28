# corgi.fm
Collaborative Online Real-time Graphical Interface For Music

A "multiplayer DAW"

## Required Software
- node 10.14.1
- yarn
- graphviz (for viewing diagrams in docs folder)

## Local Development
Add `127.0.0.1 local.corgi.fm` to your `hosts` file for local development.

```bash
yarn
yarn start
```

Then open `local.corgi.fm` in a browser.

## Secrets setup
Create `secrets.sh` in project root.
Used by server setup and deploy scripts.

```bash
#!/usr/bin/env bash

SSH_HOST=example.com
SSH_USER=notroot

SSH_HOST_TEST=test.example.com
SSH_USER_TEST=notroot
```

## Server Setup
Run `yarn setup-test-server` or `yarn setup-prod-server`.
