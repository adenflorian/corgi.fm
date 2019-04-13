# TODO
- [ ] store index of simpleGridSequencer on server for new clients
- [ ] fine grained note start times and lengths
- [ ] midi timeline thing
- [ ] maybe use automerge? https://github.com/automerge/automerge
- [ ] make use of `'` key
- [...] add `+` and `-` for octave
	- [ ] [bug] pressing shift `=` (`+`) increases the octave by 2
- [ ] create way for user to decide whether they want changing virtual keyboard octaves to change currently playing notes or not
- [ ] immer js
- [ ] LFO
- [ ] Automation
- [ ] different filter types
- [ ] arp
- [ ] keyboard keys to adjust synth params
- [ ] make a simple version that's just keyboards, or a single keyboard
- [ ] have a midi library
- [ ] mute audio on join and show popup letting know user that it might be loud
- [ ] let players send hearts and claps and stuff to show that they like what the person is playing
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
- [ ] when someone first joins, show them a list of demos that that can copy into a new room to quickly show people what corgi.fm can do
- [ ] on the borwser warning screen, show why chrome is the only supported browser, like what is missing from firefox
- [ ] use gzip on nginx
	- https://expressjs.com/en/advanced/best-practice-performance.html#use-gzip-compression
	- http://nginx.org/en/docs/http/ngx_http_gzip_module.html
- [ ] instead of calling setMidiNotes all the time to trigger notes, use AudioParam automation to queue up note changes in the future based off of what is in a sequencer
- [ ] make it obvious that master audio output node is local only
	- maybe make a local audio slider that's not a part of the graph
- [ ] add a link to the prod site and vice versa
- [ ] make room option to switch between straight and curved connection lines
- [ ] make slash (/) commands that can be used in chat
- [ ] figure out how to get middleware for room state to work on server store
- [ ] look into mobx
- [ ] warn user if master volume is at or near 0
- [ ] audio rack node
	- a node group that can have multiple nodes stacked on top of eachother with them connecting top down
- [ ] show build datetime in tooltip on version in bottom right
- [ ] twitch makes music
	- stream corgi.fm that listens to commands from twitch chat
- [ ] don't delete users stuff immediately on disconnect, have a grace period or something in case they reconnect quickly
- [ ] notification/flash/toast system for displaying system messages
	- or put these messages in chat like how an MMO does it?
	- like vscode notifications in bottom right
	- some will fade away automatically
	- others require user interaction
- [ ] highlight keys in the current key
- [ ] show message to user if an error is detected (like if console.error was called)

# Optimizations
- [√] use debounce for some network updates like mouse cursors and node positions?

# DevOps
- [ ] figure out how to do `yarn build` without stopping parcel and the server

# Shared Cursors
- [√] make shared cursor not block pointer events
- [√] use relative positioning like the connections so it doesn't have to rerender on scroll
- [√] optimize
	- [√] less updates over network
	- [√] less dispatches
- [ ] interpolate

# Sampler
- [ ] fix missing piano note

# Clean Code
- [√] use `strictNullChecks` typescript config
- [ ] `tslint:all`

# Refactoring
- [ ] new graph state
	- [√] move reducers for the different node types under the shamu graph reducer, but keep them separate
	- [ ] update positions calculations to update positions in new graph state
		- keeping positions state where it is for now, the important thing is the actual node types
	- [ ] change all the old multi things to use new graph state
		- [ ] change selectors to grab from new graph state

# Connections
- [√] brighten the connectors and line when data is going across it
- [√] make them moveable
- [√] fix invisible long line when vertical (kind of fixed by only being curved lines now?)
- [√] make input connector look like a stack cable when multiple inputs
- [√] animate dashed ghost connector
- [√] animate active connections in the direction that data is flowing
- [√] show ghost connector for adding connections when mouse is near, and put it at top of connector stack, don't require shift to be held down
- [√] allow adding connections from a node with no connections on it already
	- [√] split up ConnectionView
		- [√] Connector component
		- [√] ConnectionLine component
- [ ] make it obvious which direction data flows when not playing (without an animation)
- [ ] show move icon on connector on hover
	- now shows grab icon when moving, but hand icon on hover is too big
- [ ] visually differentiate between midi and audio connections (and both)
- [ ] allow temporarily disabling a connection

# Keyboard
- [ ] do something to visualize external midi keyboard notes
- [ ] show icon or something to show which users are using an external midi keyboard
- [ ] don't change current notes on keyboard when changing octave (at least not by default; something to put in options?)
	- not sure if possible/easy to make this an option
- [ ] can you make it when you change the octave it doesn't affect notes from a midi keyboard

# Knob
- [ ] Allow for arc to go both directions
	- like a pan knob, when centered should have no arc, and arc can go left or right from center
- [ ] show value somewhere around label
- [ ] different knob style depending on size (like ableton)
	- small
	- medium
	- large

# References
- https://github.com/grimmdude/MidiPlayerJS/blob/master/src/player.js

# Nodes

## Sequencers
- [ ] limit undo history
- [ ] redo button
- [ ] click and drag midi to ableton from corgi.fm
- [ ] click and drag midi from ableton to corgi.fm
- [ ] click and drag midi files from computer to corgi.fm
- [ ] velocity

### GridSequencer
- [ ] make size adjustable
	- use react-draggable
	- drop down with size options?
- [√] global play button
- [ ] input notes from keyboard
- [ ] allow using scroll wheel

#### GridSequencer Scroll Bar
- [ ] make slider stay with mouse 1:1
- [√] mini map

### Infinite Sequencer
- [ ] click and drag notes left and right to change order, up and down to change note
- [√] find better way to clear notes
- [ ] fix recording and playing at same time
	- what is this problem?
	- when recording, it records notes from all users at same time
	- [ ] need to make it only record from specific users
		- maybe require users to plug their keyboard into the sequencer?
- [√] undo button
- [√] record button should be red when recording
- [√] backspace to undo note while recording

### Future Sequencers
- [ ] full featured piano roll midi editor like ableton
- [ ] something that randomly generates notes
- [ ] scriptable? like you program it with text
- [ ] cthulu

## Instruments
- [...] ADSR
	- [√] A
	- [ ] D
	- [ ] S
	- [√] R
- [ ] velocity
- [ ] portamento

### BasicSynthesizer
- [√] voices still round robin, instead it should pick voices that aren't playing

### BasicSampler

### Future Instruments
- [ ] drum rack
- [ ] wavetable synth

## Audio Effects
- [ ] delay
- [ ] filter
- [ ] distortion
- [ ] compressor
	- OTT
- [ ] look into using an algorithmic reverb
	- https://itnext.io/algorithmic-reverb-and-web-audio-api-e1ccec94621a
- [ ] code node
	- audio worklet

## Midi Effects
- [ ] ARP
- [ ] random
- [ ] pitch
- [ ] code node
	- function that takes in midi events and outputs midi events, like a middleware func

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

# Efficient Mode
- [ ] notify user to lower graphics if low FPS

# Global Clock
- [√] clicking play should reset global index to 0
- [√] stop it when nothing is playing
- [ ] make downstream nodes actually depend on the connection from the master clock

# Newsletter

# Chat
- [ ] delete old chat messages
- [√] Hit enter to focus chat
- [ ] play sound when new message?
- [√] make new messages start at full opacity then fade to whatever the normal opacity is
- [√] make chat bottom bar always in front?

# Username
- when change name, should we change the name in old chat messages?
- [√] update name in bottom left on blur of name input
- [√] save name in local storage and us on re-entry

# SimpleGraph
- [√] move last touched node to highest z index
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
	- [√] maybe store zIndex on each position state?
		- will automatically get synced to server
		- allows for more complex ordering
	- [√] mark as last touched immediately after clicking on node
- [√] support trackpad zoom and pan
- [ ] add buttons on side of screen for zoom and pan and show keyboard shortcuts when hovering over icon
- [√] different icon for drag handle so people don't think it's a menu
- [ ] auto organize button
- [√] center master clock node vertically in create server stuff
- [ ] allow moving multiple nodes at once (like blender or unit shader graph?)

# Note Scanner
- [ ] master clock play button animation
- [ ] handle conflicting note lengths scenarios
	- low priority
	- scenario A
		- steps
			- 2 sequencers going to same synth
			- 1 note in each, same note, same start, but different length
		- expected
			- only the shorter note should be played, every time (ableton way)
	- scenario B
		- 2 sequencers going to same synth
		- seq A [== ===  ]
		- seq B [==== == ]
		- exp   [== = =  ] (ableton)
		- act   varies
- [ ] make instrument params affect currently playing notes
	- [ ] attack
		- [ ] chrome bug preventing impl
		- how?
		- cancelAndHold?
		- how to know when to adjust?
		- [√] applyEnvelope function
	- [ ] release
		- [ ] chrome bug preventing impl
- [ ] rate knob on infinite sequencer
	- removed for now, not sure how to implement

# Discord Feedback
- [ ] For some sequencers, it plays the note when you place it. I'd like this, anyone else? (EliTheCoder)
- [ ] you should make it so when you change the waveform it doesn't make it quieter (Huday)
	- i need to change the gain knob to have some headroom
	- so u can turn it up for quiet waves
	- ill compare it to serum as well
- [ ] maybe make so if you press backspace when hovering over a knob, it resets it to its default state (EliTheCoder)
- [ ] mute button next to audio output

# Bugs
- [√] shift click note not showing on other clients
- [√] long usernames mess up the keyboard
- [√] long usernames mess up the chat input
- [ ] sequencer doesn't always play when joining room with a playing sequencer
- [√] can't click chat on short window
- [ ] review chrome autoplay fix
	- https://developers.google.com/web/updates/2017/09/autoplay-policy-changes#webaudio
- [√] instrument keeps playing afer owner leaves
- [√] stop drag ghost connector running middleware func on all clients
- [√] when adding a new connector, one ghost connector is in wrong place

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
- [√] options view
- [√] better pointer
- [...] favicon (better icon?)
- [√] feedback button
	- added link to the discord
- [ ] tooltips for all the things
- [ ] help button
- [ ] figure out donations
- [ ] prepare answer to questions or a FAQ
	- [ ] monetization?
	- [ ] open source?
	- [ ] roadmap?
- [ ] show user where their keyboard is when the join a room
- [√] pick final product name
- [√] get domain

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
