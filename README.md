# corgi.fm
Collaborative Online Real-time Graphical Interface For Music

A "multiplayer DAW"

## Required Software
- node 12.16.1
- yarn 1.x.x
- graphviz (for viewing diagrams in docs folder)
- rust (https://rustup.rs/)

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

Create `corgiSecrets.json` in project root.
Used by corgi server at runtime.
See `server-secrets.ts`.

## Server Setup
Run `yarn setup-test-server` or `yarn setup-prod-server`.

### Manual Server Setup Steps
Add AWS secrets: https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-shared.html
See `s3.ts`.

Create and populate `~/corgiSecrets.json`.
See `server-secrets.ts`.

## Audio Worklets
`packages/client/WebAudio/AudioWorklets/Processors` is the folder where audio worklet processor files go.

All files in that folder ending in `.ts` will be treated as a parcel entry point.

See these places for more info:
- `package.json`
- `run-parcel.js`
- `build-parcel.js`
- `.assetWrapper.js`
- `packages/client/WebAudio/AudioWorklets`
