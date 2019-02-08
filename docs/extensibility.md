How extensible is sha-mu?
=========================

Let's say we want to make a new audio effect node called Delay (*folder* **new file**):

## What file changes are currently needed as of 2019-02-08?
- *client*
	- **Delay.tsx** (React component)
	- **Delay.less** (CSS)
	- **Delay.ts** (Audio layer class)
	- SimpleGraphNode.tsx (getComponentByNodeType)
	- instrument-manager.ts (Audio layer management stuff)
- *common*
	- common-redux-types.ts (IClientRoomState)
	- common-types.ts (ConnectionNodeType)
	- *redux*
		- create-server-stuff.ts (createServerStuff)
		- **delay-redux.ts** (reducer, action creators, selectors, state types)
		- index.ts (module loading order)
		- local-middleware.ts (deleteAllTheThings, createLocalStuff)
		- node-types.ts (NodeInfoMap)
		- room-stores-redux.ts (roomReducers)
- *server*
	- server-socket-listeners.ts (syncState)

### Summary:
- 4 new files
- 10 modified existing files

### Plan
- [ ] Use decorators?

## Which files should be the only ones to change, ideally?
- *client*
	- **Delay.tsx**
	- **Delay.less**
- *common*
	- *redux*
		- **delay-redux.ts**
