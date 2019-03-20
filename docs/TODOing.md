# Now
- [ ] increase room deletion timeout
	- [ ] and make it so it's actually based on room lifetime instead of a loop
- [ ] put sequencer timeline animation as separate setting in options

# Soon
- [ ] play note when placed in grid sequencer
- [ ] don't change current notes on keyboard when changing octave (at least not by default; something to put in options?)
	- not sure if possible/easy to make this an option
- [ ] allow adding connections from a node with no connections on it already
	- [ ] split up ConnectionView
		- [ ] Connector component
		- [ ] ConnectionLine component
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
