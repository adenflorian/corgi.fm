# corgi.fm
Collaborative Online Real-time Graphical Interface For Music

A "multiplayer DAW"

## Required Software
- node 10.14.1
- yarn
- graphviz (for viewing diagrams in docs folder)

## Secrets setup
Create `secrets.sh` in project root.

```bash
#!/usr/bin/env bash

SSH_HOST=example.com
SSH_USER=notroot

SSH_HOST_TEST=test.example.com
SSH_USER_TEST=notroot
```
