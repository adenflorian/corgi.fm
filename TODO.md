# TODO
- [√] only left click to play note
- [√] put z and x markings for octave
- [√] don't show keyboard letters on the track or remote keyboards
- [√] made virtual keyboard keys clickable
- [√] only unpress note when mouse moves out if left mouse button is down
- [√] use shift to hold down keys when clicking keyboard
- [√] figure out how to share code between client and server
- [√] four note track, only one possible note and length
- [√] allow two different notes at once
- [√] setup redux for server
- [√] have server keep track of play status
- [ ] store index of simpleTrack on server for new clients
- [√] need way to bypass virtual keyboard
- [ ] fine grained note start times and lengths
- [√] don't unnecessarily change osc freq when diff notes are set
- [√] make it so you have to click on keyboard first for the hold and play to work
- [√] visual for instrument
- [√] visual for master volume amp thing
- [ ] midi timeline thing
- [ ] maybe use automerge? https://github.com/automerge/automerge
- [ ] options view
- [√] maybe use requestAnimationFrame()
- [ ] make use of `'` and `[` keys
- [ ] add `+` and `-` for octave
- [√] persist keyboard state on server, and don't store notes and octaves on clients
- [ ] TONE.js
- [ ] immer js
- [...] ADSR
	- [√] A
	- [ ] D
	- [ ] S
	- [√] R
- [√] track mouse pointers
- [ ] LFO
- [ ] Automation
- [√] triangle wave
- [ ] different filter types
- [ ] arp
- [ ] keyboard keys to adjust synth params
- [√] noise wave type
	- https://noisehack.com/generate-noise-web-audio-api
- [ ] LFO
- [ ] make a simple version that's just keyboards, or a single keyboard
- [ ] op1 arp sequencer thing
- [ ] have a midi library

# Keyboard
- [ ] do something to visualize external midi keyboard notes

# Knob
- [ ] Allow for arc to go both directions
	- like a pan knob, when centered should have no arc, and arc can go left or right from center

# Track
- [ ] make size adjustable
	- drop down with size options?

## Track Scroll Bar
- [ ] make slider stay with mouse 1:1
- [√] mini map

# References
- https://github.com/grimmdude/MidiPlayerJS/blob/master/src/player.js


Scenario: User opens shamu


switch rooms
create rooms
default room?
single default room or make more automatically?
