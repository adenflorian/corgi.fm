# Redesign
- [√] title bar on nodes
- [√] put "corgi.fm" in bottom right by version
- [√] chat
- [√] put name in top right
	- [ ] show edit icon to left of name on hover
- [√] put button links in a button with out link icon
- [√] chat input min width
- [√] options
- [√] loading modal
- [√] Connecting...
- [√] keyboard label
- [ ] grid sequencer
- [ ] pan and detune knob arcs should start from center
- [ ] make select have label on left side with darker background

# 0.4.0
- [√] add enable/disable to positions state
	- [√] make disabling do something for every node
		- [√] effects should pass thru
		- [√] instruments shouldn't output anything
		- [√] sequencers shouldnt play notes
		- [√] master volume should mute
		- [√] master clock should not run
		- [√] group seq should not let anything connected play
- [ ] add button to clear chat
- [ ] "show older messages" button
- [√] track selected node
	- [√] ctrl z should send undo to selected node
- [ ] toggle note click audio for sequencers on title bar
- [ ] infinite sequencer
	- [√] click and drag to play all notes
	- [√] don't play other notes when holding shift
	- [√] only play notes if infinite seq selected*****
	- [ ] add a way to insert notes left and right
	- [ ] way to start song from any point in sequencer
	- [ ] design
- [√] fix seq rate knob
	- [√] make rate value string display proper stuff
	- [√] display note length and sequencer length
- [ ] show icon on volume to show it is local only
- [ ] fix up group sequencer
- [ ] welcome screen for new users
	- [ ] welcome button on right side
- [ ] changelog screen
	- [ ] changelog button on right side
- [ ] LFO
- [ ] long notes mixed with short notes

# 0.5.0
- [ ] reverb dry/wet knobs
- [ ] compressor dry/wet knobs
- [ ] show progress bar on reverb when loading new impulse

# Now
- [√] don't delete everything on disconnect
- [√] smooth scroll in steps like google maps
	
# Soon
- [ ] be able to move multiple nodes at once
	- [ ] maybe select multiple nodes at once with shift + click or drawing a selection box?
- [ ] use synesthesia colors
- [ ] switch to jest
- [ ] sync client clocks
- [ ] make submenu for creating grid sequencer with preset sizes
- [ ] deploy script should check if anyone is on the server first
- [ ] chained sequencers should only play if upstream sequencer is playing
- [ ] put sequencer timeline animation as separate setting in options
- [ ] redo on sequencers
- [ ] dont delete player's instrument when they leave if other stuff is plugged into it
- [ ] coarse knob to instruments
- [ ] only enable audio after user acknowledges what they are getting themselves into
- [ ] project wide macro knobs/control panel

# Later
- [ ] Let people record midi from keyboard live, but don't play notes for others until it loops
- [ ] save picture of room in save file
- [ ] make little illustrations for empty stuff, like for when you have no friends or no saves

# Goals
- [ ] be able to recreate certain songs
	- [ ] hot cross buns
	- [ ] claire de lune
	- [ ] Spoiler - Hyper

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
