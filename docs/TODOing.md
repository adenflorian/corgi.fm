# Now
- [ ] convolution reverb
	- [√] make it connected to audio output at server create stuff
	- [√] remove reverb from master
	- [√] troubleshoot perf issues
		- Reverb buildImpulse keeps running
			- because I'm setting the time value every update
				- [√] stop that
	- [√] make it sound good
		- ~~when time is changed, it rebuilds some reverb data~~
			- this is how a convolver reverb works
	- [√] make ui better
	- [√] make it get organized in create server stuff
	- [√] make everything go through the reverb before audio output

# Soon
- [ ] add ability to add nodes
- [ ] allow adding connections from a node with no connections on it already
- [ ] new graph state
	- [√] move reducers for the different node types under the shamu graph reducer, but keep them separate
	- [ ] update positions calculations to update positions in new graph state
		- keeping positions state where it is for now, the important thing is the actual node types
	- [ ] change all the old multi things to use new graph state
		- [ ] change selectors to grab from new graph state

# Later
- [ ] look into using an algorithmic reverb
	- https://itnext.io/algorithmic-reverb-and-web-audio-api-e1ccec94621a
