# Now
- [√] don't lose focus on chat when sending message, only lose focus on enter if message is empty
- [√] play note when placed in grid sequencer
- [√] things shouldn't be blurry at zoom 1
- [√] increase room deletion timeout
	- [√] and make it so it's actually based on room lifetime instead of a loop
- [√] make option for proper vector graphics regarding on zoom levels
- [√] try out new fonts (again)
	- https://fonts.google.com/specimen/Questrial
	- https://fonts.google.com/specimen/Didact+Gothic
	- https://fonts.google.com/specimen/Muli
	- current font: https://fonts.google.com/specimen/Roboto
- [...] high level sequencer (Group Sequencer)
	- doesn't control notes, but whole song sections
	- different colored sections
	- colored wires for each section
	- can draw wires from 2 diff sections into same sequencer
- [√] fix saving and loading
	- [√] ramp problem
		- [√] use class constructors when deserializing
	- [√] fix node size issues
- [√] save app version in save object
	
# Soon
- [ ] make submenu for creating grid sequencer with preset sizes
- [ ] allow saving of graph somewhere (server, browser local storage, download and upload)
- [ ] deploy script should check if anyone is on the server first
- [ ] chained sequencers should only play if upstream sequencer is playing
- [ ] put sequencer timeline animation as separate setting in options
- [ ] redo on sequencers

when placing not in seq , use gate to determine how long placed note should play
note length knob on sequencers

gate - note length
note length - 

dont delete players instrument if other stuff is plugged into it

maybe put handle on left side?

dont connect keyboards to master clock

coarse knob to instruments


## Saving

saving

why?
to be able to work on a song over multiple sessions
to be able to load from a template?

how?
- localstorage
- save as file
- save to server

how to load?
- from local storage
- from file upload
- from server

which is easiest?
- local storage, then saving as file

problems introduced with saving:
- saves wont be compatible with newer versions
  - only a problem when saved locally
  - if on server i can control upgrading them when needed
  
do i need to be able to support older version?
- either by having an upgrade path for old project files
- or older versions of client/server
  - could do if i had an offline client

# Later
- [ ] move ghost connectors state to its own state so connections memoizations will be more effective
- [ ] support undo of node delete
	- [ ] redux
		- oof, not easy until i finish the major graph redux refactor stuff
		- i don't want to write undo logic for each node
		- maybe do in multi reducer?
			- please no
- [ ] global mod matrix
- [ ] suggest notes
- [ ] compressor
- VSTs
	- everyone would have to have the same VSTs
	- or record the output of the VST and send to server
	- FOSS VSTs
- is there a limit on an individual chat message
- add option to disable cable highlighting
