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
- [√] maybe use requestAnimationFrame()
- [ ] make use of `'` key
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
- [ ] mute audio on join and show popup letting know user that it might be loud
- [ ] let players send hearts and claps and stuff to show that they like what the person is playing
- [ ] what do about firefox
- [ ] offline mode
- [ ] simple mode
- [ ] make usable on mobile
- [ ] show loading icon on startup

# Connections
- [ ] make it obvious which direction data flows
- [ ] brighten the connectors and line when data is going across it
- [ ] make them moveable

# Keyboard
- [ ] do something to visualize external midi keyboard notes

# Knob
- [ ] Allow for arc to go both directions
	- like a pan knob, when centered should have no arc, and arc can go left or right from center

# Track
- [ ] make size adjustable
	- drop down with size options?
- [ ] global play button

## Track Scroll Bar
- [ ] make slider stay with mouse 1:1
- [√] mini map

# References
- https://github.com/grimmdude/MidiPlayerJS/blob/master/src/player.js

# BasicInstrument
- [√] voices still round robin, instead it should pick voices that aren't playing

# Rooms
- [√] switch rooms
- [√] create rooms
- [√] lobby
- [√] put user in new room when they click new room button
- [√] BUG: If user is holding down a note key when they change rooms the notes keep playing and you cant stop it
- [√] handle user joining a room that doesn't exist
- [√] delete empty rooms every 5 seconds
- [ ] *choose name for room at creation
- [ ] *join room by url
- [ ] *better UX
- [ ] rename existing rooms
- [ ] room ownership
- [ ] create more rooms automatically when lobby is full
- [ ] observers (users who can join room but not play)
	- permissions system

# Chat
- [ ] delete old chat messages
- [√] Hit enter to focus chat
- [ ] play sound when new message?
- [ ] make new messages start at full opacity then fade to whatever the normal opacity is

# Username
- when change name, should we change the name in old chat messages?
- [√] update name in bottom left on blur of name input
- [√] save name in local storage and us on re-entry

# Bugs
- [ ] shift click note not showing on other clients
- [√] long usernames mess up the keyboard
- [ ] long usernames mess up the chat input

# Adagio
- [...] UI layout
- [...] rooms
- [...] chat
- [ ] analytics
- [ ] newsletter (a way for users to sign up to get future updates)
- [...] let user change name
- [ ] https
- [ ] options view
- [ ] better pointer

# Ballad
- [ ] login system
- [ ] permission system
- [ ] new sequencers
- [ ] new instruments
- [ ] more keyboard features
- [ ] show list of room members
- [ ] send hearts and claps and stuff
