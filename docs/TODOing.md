# Now
- [ ] allow deleting nodes
	- how?
		- delete button on node
		- [√] delete menu option when right clicking a node
			- [√] don't show delete option if not deletable
			- [√] sub menu hell
		- move to trash can
	- confirmation?
		- modal
		- long click
		- click and drag slider
	- [ ] support undo of node delete
		- [ ] redux
			- oof, not easy until i finish the major graph redux refactor stuff
			- i dont want to write undo logic for each node
			- maybe do in multi reducer?
				- please no

# Soon
- [ ] deploy script should check if anyone is on the server first
- [ ] move ghost connectors state to its own state so connections memoizations will be more effective
- [ ] chained sequencers should only play if upstream sequencer is playing
- [ ] efficient mode in options not saving

- [ ] increase room deletion timeout
	- [ ] and make it so it's actually based on room lifetime instead of a loop
- [ ] put sequencer timeline animation as separate setting in options
- [ ] play note when placed in grid sequencer

# Later
