# Now
- [√] fix multiple audio outputs
- [ ] 'Maximum call stack size exceeded' issue again with looped connections
	- sampler -> reverb -> same sampler

# Soon
- [ ] allow adding connections from a node with no connections on it already
- [ ] add ability to add nodes
- [ ] new graph state
	- [√] move reducers for the different node types under the shamu graph reducer, but keep them separate
	- [ ] update positions calculations to update positions in new graph state
		- keeping positions state where it is for now, the important thing is the actual node types
	- [ ] change all the old multi things to use new graph state
		- [ ] change selectors to grab from new graph state

# Later
- [ ] look into using an algorithmic reverb
	- https://itnext.io/algorithmic-reverb-and-web-audio-api-e1ccec94621a
