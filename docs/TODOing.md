# Now
- [ ] require user to plug keyboard into sequencer to record
	
# Soon
- [ ] make submenu for creating grid sequencer with preset sizes
- [ ] allow saving of graph somewhere (server, browser local storage, download and upload)
- [ ] deploy script should check if anyone is on the server first
- [ ] chained sequencers should only play if upstream sequencer is playing
- [ ] increase room deletion timeout
	- [ ] and make it so it's actually based on room lifetime instead of a loop
- [ ] put sequencer timeline animation as separate setting in options
- [ ] play note when placed in grid sequencer

# Later
- [ ] move ghost connectors state to its own state so connections memoizations will be more effective
- [ ] support undo of node delete
	- [ ] redux
		- oof, not easy until i finish the major graph redux refactor stuff
		- i dont want to write undo logic for each node
		- maybe do in multi reducer?
			- please no
