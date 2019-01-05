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
- [ ] store index of simpleGridSequencer on server for new clients
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
	- [ ] [bug] pressing shift `=` (`+`) increases the octave by 2
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
- [√] disallow browsers that aren't chrome
- [ ] offline mode
- [ ] simple mode
- [ ] make usable on mobile
- [ ] show loading icon on startup
- [ ] show badge on test server with warning
- [ ] extend the range of the keyboard by one which will map to the `'` key
- [ ] flash action
	- send messages to users to be displayed on their screens
- [ ] setup dotenv files
	- https://parceljs.org/env.html
- [ ] bot that checks main functionality on the app 24/7 and alert devs if issues arise
- [ ] make desktop version using electron
	- so chrome auto updating can't break the whole app
- [ ] turn off audio after 30 minutes and show dialog asking if user is still there
- [ ] velocity
- [ ] download an open source font
- [ ] Define purpose/goals/mission of this app
	- collaboration
	- learning?
- [ ] build object oriented prototype
	- Unity?

# Sampler
- [ ] presentation
- [ ] redux
- [ ] networking

# Clean Code
- [√] use `strictNullChecks` typescript config
- [ ] `tslint:all`

# Connections
- [ ] make it obvious which direction data flows
- [ ] brighten the connectors and line when data is going across it
- [ ] make them moveable

# Keyboard
- [ ] do something to visualize external midi keyboard notes

# Knob
- [ ] Allow for arc to go both directions
	- like a pan knob, when centered should have no arc, and arc can go left or right from center

# GridSequencer
- [ ] make size adjustable
	- drop down with size options?
- [ ] global play button
- [ ] click and drag midi to ableton from shamu
- [ ] input notes from keyboard

## GridSequencer Scroll Bar
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
- [√] *join room by url
- [ ] *better UX
- [ ] rename existing rooms
- [ ] room ownership
- [ ] create more lobbies automatically when lobby is full
- [ ] observers (users who can join room but not play)
	- permissions system
- [ ] limit number of rooms?
- [ ] assign a room a color
- [ ] room types
	- [ ] single keyboard
	- [ ] advanced
	- etc.
- [ ] show member count for each room in room selector

# Newsletter
- [ ] put a back button on the newsletter page?

# Chat
- [ ] delete old chat messages
- [√] Hit enter to focus chat
- [ ] play sound when new message?
- [ ] make new messages start at full opacity then fade to whatever the normal opacity is
- [ ] make chat bottom bar always in front?

# Username
- when change name, should we change the name in old chat messages?
- [√] update name in bottom left on blur of name input
- [√] save name in local storage and us on re-entry

# Bugs
- [√] shift click note not showing on other clients
- [√] long usernames mess up the keyboard
- [√] long usernames mess up the chat input
- [ ] can't use scroll wheel in sequencer
- [ ] sequencer doesn't always play when joining room with a playing sequencer
- [√] can't click chat on short window
- [ ] review chrome autoplay fix
	- https://developers.google.com/web/updates/2017/09/autoplay-policy-changes#webaudio
- [ ] instrument keeps playing afer owner leaves

# Warnings
- [ ] [Violation] 'readystatechange' handler took 727ms - polling-xhr.js:242
	- something in socket.io is taking 727ms
	- haven't seen an issue reported about it yet
- [ ] [Violation] 'setTimeout' handler took 706ms (x2) - build-impulse.js:37
	- from `soundbank-reverb`
	- setting the convolver buffer can take up to ~700ms
	- using promises didn't help
	- using a single reverb didn't help
	- also related to how the sound stops for a split second after loading
- [ ] [Violation] Forced reflow while executing JavaScript took 79ms
	- https://stackoverflow.com/questions/41218507/violation-long-running-javascript-task-took-xx-ms
	- causes:
		- AutosizeInput `react-input-autosize`
		- something in `<ConnectionsContainer />`

# Adagio
- [...] UI layout
- [...] rooms
- [...] chat
- [...] analytics (needs more testing and more events)
- [√] newsletter (a way for users to sign up to get future updates)
- [...] let user change name (need better UX design)
- [√] https
- [...] options view
- [...] better pointer
- [...] favicon (better icon?)
- [ ] feedback button

# Ballad
- [ ] login system
- [ ] permission system
- [ ] new sequencers
- [ ] new instruments
	- [...] sampler
- [ ] more keyboard features
- [ ] show list of room members
- [ ] send hearts and claps and stuff
- [...] export midi
- [ ] import midi
- [ ] Docker?
- [ ] pick final product name
- [ ] get domain
