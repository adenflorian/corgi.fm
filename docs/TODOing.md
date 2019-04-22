# Now
	
# Soon
- [ ] things shouldn't be blurry at zoom 1
- [ ] don't lose focus on chat when sending message, only lose focus on enter if message is empty
- [ ] make submenu for creating grid sequencer with preset sizes
- [ ] allow saving of graph somewhere (server, browser local storage, download and upload)
- [ ] deploy script should check if anyone is on the server first
- [ ] chained sequencers should only play if upstream sequencer is playing
- [ ] increase room deletion timeout
	- [ ] and make it so it's actually based on room lifetime instead of a loop
- [ ] put sequencer timeline animation as separate setting in options
- [ ] play note when placed in grid sequencer

# Later
- [√] try out new fonts (again)
	- https://fonts.google.com/specimen/Questrial
	- https://fonts.google.com/specimen/Didact+Gothic
	- https://fonts.google.com/specimen/Muli
	- current font: https://fonts.google.com/specimen/Roboto
- [ ] move ghost connectors state to its own state so connections memoizations will be more effective
- [ ] support undo of node delete
	- [ ] redux
		- oof, not easy until i finish the major graph redux refactor stuff
		- i don't want to write undo logic for each node
		- maybe do in multi reducer?
			- please no
- [ ] make option for proper vector graphics regarding on zoom levels
- [ ] high level sequencer
	- doesn't control notes, but whole song sections
	- different colored sections
	- colored wires for each section
	- can draw wires from 2 diff sections into same sequencer
- [ ] global mod matrix
- [ ] suggest notes
- [ ] compressor
- VSTs
	- everyone would have to have the same VSTs
	- or record the output of the VST and send to server
	- FOSS VSTs
- is there a limit on an individual chat message
- add option to disable cable highlighting
