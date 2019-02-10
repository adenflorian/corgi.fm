# Now
- [ ] reverb
	- [√] make it connected to audio output at server create stuff
	- [√] remove reverb from master
	- [ ] make it sound good

# Soon
- [ ] add ability to add nodes
- [ ] allow adding connections from a node with no connections on it already
- [ ] new graph state
	- [√] move reducers for the different node types under the shamu graph reducer, but keep them separate
	- [ ] update positions calculations to update positions in new graph state
		- keeping positions state where it is for now, the important thing is the actual node types
	- [ ] change all the old multi things to use new graph state
		- [ ] change selectors to grab from new graph state
