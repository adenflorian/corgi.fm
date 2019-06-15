# Now
- [ ] polish group sequencer
	
# Soon
- [ ] sync client clocks
- [ ] make submenu for creating grid sequencer with preset sizes
- [ ] deploy script should check if anyone is on the server first
- [ ] chained sequencers should only play if upstream sequencer is playing
- [ ] put sequencer timeline animation as separate setting in options
- [ ] redo on sequencers
- [ ] dont delete player's instrument when they leave if other stuff is plugged into it
- [ ] coarse knob to instruments
- [ ] only enable audio after user acknowledges what they are getting themselves into
- [ ] don't delete everything on disconnect

## Saving
why?
to be able to work on a song over multiple sessions
to be able to load from a template?

how?
- [√] localstorage
- [√] save as file
- [ ] save to server

how to load?
- [√] from local storage
- [ ] from file upload
- [ ] from server

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
- [ ] suggest notes (?)
- [√] compressor
- VSTs
	- everyone would have to have the same VSTs
	- or record the output of the VST and send to server
	- FOSS VSTs
- is there a limit on an individual chat message
- add option to disable cable highlighting
