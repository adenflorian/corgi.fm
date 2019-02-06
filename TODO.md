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
- [...] add `+` and `-` for octave
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
- [√] op1 arp sequencer thing
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
- [ ] note velocity from external midi keyboard
- [ ] program velocity into sequencer
- [ ] download an open source font
- [ ] Define purpose/goals/mission of this app
	- collaboration
	- learning?
- [ ] build object oriented prototype
	- Unity?
- [ ] global midi export button
- [ ] look into making an audio node that is a sequencer
- [ ] keep track of what object is selected and route keyboard commands like ctrl + z to the selected object
- [ ] resolve // TODOs
- [ ] show different stuff at different zoom levels
	- at small zoom show small music intrument parts
	- at big zoom level show big music things
- [ ] make webgl visualization bg that reacts to that music
- [ ] use discord for chat somehow?
- [ ] make instruments that run around the screen
	- nyan cat
- [ ] try to use decorators on action types to generate a giant combined action type
- [ ] when someone first joins, show them a list of demos that that can copy into a new room to quickly show people what shamu can do
- [ ] on the borwser warning screen, show why chrome is the only supported browser, like what is missing from firefox
- [ ] use gzip on nginx
	- https://expressjs.com/en/advanced/best-practice-performance.html#use-gzip-compression
	- http://nginx.org/en/docs/http/ngx_http_gzip_module.html
- [ ] instead of calling setMidiNotes all the time to trigger notes, use AudioParam automation to queue up note changes in the future based off of what is in a sequencer
- [ ] make it obvious that master audio output node is local only
	- maybe make a local audio slider that's not a part of the graph

# Shared Cursors
- [ ] make shared cursor not block pointer events
- [ ] use relative positioning like the connections so it doesn't have to rerender on scroll
- [ ] optimize
	- [ ] less updates over network
	- [ ] less dispatches
- [ ] interpolate

# Sampler
- [ ] fix missing piano note

# Clean Code
- [√] use `strictNullChecks` typescript config
- [ ] `tslint:all`

# Connections
- [ ] make it obvious which direction data flows
- [√] brighten the connectors and line when data is going across it
- [ ] make them moveable
- [ ] fix invisible long line when vertical
- [ ] make input connector look like a stack cable when multiple inputs

## Adding/Changing/Removing Connections
should anything allow multiple incoming connections?
- yes, instruments will union the incoming notes together
	- for an audio node it would need a mixer node or something

if you click and drag the output side of a connection, it moves it
if you click and drag from the input side of a connection and starts a new connection

- [√] allow multiple inputs and multiple outputs

possible starting points:
- deleting connections
- moving output side of connection
- creating new connections from the output of a node

## Updating web audio graph
when i break the connection from an instrument to the audio output i want sound to stop
i want the instrument to disconnect from w/e audio node it is connected to

- [√] give instruments a disconnect and connect function

connections middleware?
when a connection source or target is changed, or is a new connection or a connection was deleted
if the source or target of the connection was changed, (or new or deleted conection)
	then call the necessary functions on the instruments involved to update the web audio graph
	
instrument manager?

what are the types of nodes that have an audio graph component?
- intruments
- audio output
- future
	- effects
	- audio inputs (microphone, external instruments)

how to tell what to connect to what in the instrument manager?

make Instrument implement the AudioNode interface?
	pass through stuff to the underlying audio node

make it so intsrument doesnt take a destination at construction
instead all connections must be done my the instrument manager
instrument manager already handles all creation and destruction of instruments
- [√] when an instrument gets created, look to see if it has an outgoing connection
- [√] see if connection is connected to anything
- [√] see if connection target is an audio node thing?
- [√] if it is, use the targets input audio node as the output audio node for the new instrument

# Keyboard
- [ ] do something to visualize external midi keyboard notes
- [ ] show icon or something to show which users are using an external midi keyboard

# Knob
- [ ] Allow for arc to go both directions
	- like a pan knob, when centered should have no arc, and arc can go left or right from center

# Sequencers
- [ ] limit undo history
- [ ] redo button
- [ ] click and drag midi to ableton from shamu
- [ ] click and drag midi from ableton to shamu
- [ ] click and drag midi files from computer to shamu

## GridSequencer
- [ ] make size adjustable
	- use react-draggable
	- drop down with size options?
- [√] global play button
- [ ] input notes from keyboard
- [ ] allow using scroll wheel

### GridSequencer Scroll Bar
- [ ] make slider stay with mouse 1:1
- [√] mini map

## Infinite Sequencer
- [ ] click and drag notes left and right to change order, up and down to change note
- [√] find better way to clear notes
- [ ] fix recording and playing at same time
	- what is this problem?
- [√] undo button
- [√] record button should be red when recording

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

# Global Clock
- [ ] clicking play should reset global index to 0
- [ ] stop it when nothing is playing

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

# SimpleGraph
- [ ] move last touched node to highest z index
	- who should keep track of the last touched node?
	- react draggable?
	- redux?
		- positions?
	- should this be networked?
		- preferably
			- that means redux
	- [√] positions redux
		- [√] lastTouchedId
	- to make sure that the zindex order renders the same on everyones computer,
		we need to make sure that things are rendered in order
		sort by id in selector? or in reducer?
	- maybe use an ordered map?
		- ordered map won't work, need a sorted map
			- https://github.com/facebook/immutable-js/issues/88
	- [√] sort by id in reducer
	- [√] when a position is updated, mark it as last touched
	- [ ] maybe store zIndex on each position state?
		- will automatically get synced to server
		- allows for more complex ordering
	- [ ] mark as last touched immediately after clicking on node
- [√] support trackpad zoom and pan
- [ ] add buttons on side of screen for zoom and pan and show keyboard shortcuts when hovering over icon
- [ ] make zoom and pan affect mouse cursors
- [ ] use position system to render mouse cursors
	- [ ] use transform translat and will-change
- [ ] different icon for drag handle so people don't think it's a menu

# Bugs
- [√] shift click note not showing on other clients
- [√] long usernames mess up the keyboard
- [√] long usernames mess up the chat input
- [ ] sequencer doesn't always play when joining room with a playing sequencer
- [√] can't click chat on short window
- [ ] review chrome autoplay fix
	- https://developers.google.com/web/updates/2017/09/autoplay-policy-changes#webaudio
- [√] instrument keeps playing afer owner leaves

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
- [...] feedback button
	- added link to the discord

# Ballad
- [ ] login system
- [ ] permission system
- [...] new sequencers
- [ ] new instruments
	- [...] sampler
- [ ] more keyboard features
- [ ] show list of room members
- [ ] send hearts and claps and stuff
- [...] export midi
- [ ] import midi
- [...] Docker?
- [ ] pick final product name
- [ ] get domain
