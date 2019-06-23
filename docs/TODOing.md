# Redesign
- [√] title bar on nodes
- [√] put "corgi.fm" in bottom right by version
- [√] chat
- [√] put name in top right
- [√] put button links in a button with out link icon
- [√] chat input min width
- [√] options
- [√] loading modal
- [√] Connecting...
- [√] keyboard label
- [√] grid sequencer

# 0.4.0
- [√] add enable/disable to positions state
	- [√] make disabling do something for every node
		- [√] effects should pass thru
		- [√] instruments shouldn't output anything
		- [√] sequencers shouldnt play notes
		- [√] master volume should mute
		- [√] master clock should not run
		- [√] group seq should not let anything connected play
- [√] track selected node
	- [√] ctrl z should send undo to selected node
- [√] infinite sequencer
	- [√] click and drag to play all notes
	- [√] don't play other notes when holding shift
	- [√] only play notes if infinite seq selected*****
- [√] fix seq rate knob
	- [√] make rate value string display proper stuff
	- [√] display note length and sequencer length
- [√] chat input bottom is taking clicks
- [√] fix up group sequencer
	- [√] fix spacing with multiple connections
	- [√] be able to drag new connector from each port

# 0.5.0
- [√] fix dropping on connections on something with a lot of connections already
- [ ] duplicate nodes
	- [√] basic cloning
	- [√] offset position of clone slightly
	- [ ] menu items for
		- [ ] cloning with all connections
		- [ ] cloning with connections as if it were new
		- [ ] cloning with no connections
- [√] do something about peoples synths deleting when they leave
	- [√] only delete if owner is the only person connected to it
- [√] purge button to delete unused nodes
- [√] prevent people from spamming save buttons (debounce)
- [√] record into grid sequencer
	- [√] scroll to new notes?
- [√] when keyboard is connected to seq, it should always send midi thru to downstream instruments, even when not recording
- [√] placed notes in grid seq should respect pitch knob
- [√] auditioning notes should limit to a half second or so
- [√] you could have it snap to whole numbers for bpm by default but have that allow the decimals - bean
- [√] r key to record
- [ ] permissions
	- [√] when you create a room you are owner
	- [√] make server owner when room is empty
	- [√] in room options you can set it so only you can do stuff, or allow other people to do stuff
	- [√] unlock room when server becomes owner
	- [√] restrict all room things on backend except whitelist
	- [√] restrict all room things on front end
		- [ ] at redux level (not realistic to do this)
		- [√] at css
		- [√] at input events
	- [ ] let users create keyboard if they dont have one
	- [ ] allow changing mode by click room status in top left
	- [ ] give people permission to do stuff (based on client id)
	- [ ] do something about when you refresh and lose ownership
	- [ ] take ownership if you are last member?
- [ ] more prominent message about version being out of date
- [ ] list usernames of room members somewhere
- [ ] metronome
- [ ] solo
- [ ] fix up group sequencer
	- [ ] connected nodes should prefer group sequencer color
	- [ ] maybe show color dots in a corner of node to show what groups it's in?
	- [ ] labels
	- [ ] choose colors
	- [ ] jump to parts of song
	- [ ] click and drag to add things
- [ ] audio still cutting out for people (brinch)
- [ ] infinite sequencer more
	- [ ] add a way to insert notes left and right
	- [ ] way to start song from any point in sequencer
	- [ ] design
- [ ] delay node
- [ ] toggle note click audio for sequencers on title bar
- [ ] LFO
- [ ] welcome screen for new users
	- [ ] welcome button on right side
- [ ] changelog screen
	- [ ] changelog button on right side
- [ ] add button to clear chat
- [ ] "show older messages" button
- [ ] show icon on volume to show it is local only
- [ ] long notes mixed with short notes
- [ ] pan and detune knob arcs should start from center
- [ ] make select have label on left side with darker background
- [ ] show edit icon to left of name on hover in top right
- [ ] dragging something to edge of screen should pan for you
- [ ] put bottom right info in own component outside chat stuff so you can click without activating chat
- [ ] reverb dry/wet knobs
- [ ] compressor dry/wet knobs
- [ ] show progress bar on reverb when loading new impulse
- [ ] display musical key in sequencer title bar
- [ ] background looking bad when zooming out
- [ ] display error message when save fails
- [ ] error reporting
- [ ] disabling keyboard
- [ ] make it so you can only drag the title bar
- [ ] allow typing in knob values
- [ ] fix order of node menu
- [ ] drum sampler?
- [ ] give feedback when saving to browser
- [ ] disable save button until something changes?

# 0.6.0
- [ ] FM synth
- [ ] master mixer
- [ ] add colored icons on node add menu

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
- [ ] control stuff with external midi knobs

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
