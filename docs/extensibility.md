How extensible is sha-mu?
=========================

Let's say we want to make a new audio effect node called Delay (*folder* **new file**):

## What file changes are currently needed as of 2019-02-08?
- [ ] *client*
	- **Delay.tsx** (React component)
	- **Delay.less** (CSS)
	- **Delay.ts** (Audio layer class)
	- [ ] SimpleGraphNode.tsx (getComponentByNodeType)
	- [ ] instrument-manager.ts (Audio layer management stuff)
- [ ] *common*
	- [ ] common-redux-types.ts (IClientRoomState)
	- [ ] common-types.ts (ConnectionNodeType)
	- [ ] *redux*
		- **delay-redux.ts** (reducer, action creators, selectors, state types)
		- [ ] create-server-stuff.ts (createServerStuff)
		- [ ] index.ts (module loading order)
		- [ ] local-middleware.ts (deleteAllTheThings, createLocalStuff)
		- [ ] node-types.ts (NodeInfoMap)
		- [ ] room-stores-redux.ts (roomReducers)
- [ ] *server*
	- [ ] server-socket-listeners.ts
		- [√] syncState
			- replaced with `shamuGraphActions.replace(selectShamuGraphState(roomState))` 2019-02-09
		- [ ] onLeaveRoom

### Summary:
- 4 new files
- 10 modified existing files

### Plan
- [ ] Use decorators?
- [ ] make parent reducer shamuNodesReducer?

## Which files should be the only ones to change, ideally?
- *client*
	- **Delay.tsx**
	- **Delay.less**
- *common*
	- *redux*
		- **delay-redux.ts**
