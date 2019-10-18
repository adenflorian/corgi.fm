# Experimental

## Test Weekend 1
- [√] create color changed event on corgi node
- [√] uber arc should subscribe to that event to get its color
- [√] extract dumb uber arc component
- [√] make sure mod rail is accurately reflecting gain value
- [√] click and drag on mod rail to change gain
- [√] modRail should be visible when gain is 0
- [√] allow switching between center and offset
	- [√] with alt + shift + click
- [√] clamp mod rails
- [√] get liveValueRail to be accurate
- [√] fix zoomBlock on knob from preventing clicking on knob value
- [√] fix cloning
- [√] setup curve for osc freq
- [√] LFO
- [√] sequencer pitch stuff
	- [√] put note into events
- [ ] different background for experimental
- [ ] KeyboardNode
	- [ ] network it
	- [ ] take computer keyboard input
- [ ] BiquadFilterNode: state is bad, probably due to unstable filter caused by fast parameter automation.
- [ ] fix connector placeholders z index
- [ ] ArpNode
- [ ] implement enable/disable for all nodes
- [ ] prevent clicks when adding/removing connections
- [ ] prevent clicks for enable/disable on all nodes
- [ ] Delay node
- [ ] Reverb node
- [ ] WaveShaper distortion node
- [ ] change room type drop down to a button select thing
- [ ] enable room type selector for test

## Test Weekend 2
- [ ] midi converter upgrades
	- [ ] portamento
		- [ ] rise/fall separate knobs
		- [ ] "always" toggle (see serum)
		- [ ] custom portamento curve (use setValueCurveAtTime?)
		- [ ] "scaled" toggle (see serum)
- [ ] uber knob updates
	- [ ] tweak style of rail when negative gain
	- [ ] add something to show that rail extends past limit
		- [ ] mod rail
		- [ ] live value rail
	- [ ] highlight main knob on hover, including the center
	- [√] fix knob UI when no mod inputs
	- [ ] show source node name, gain, and centering value on hover of mod arc
- [ ] Sequencer upgrades
	- [ ] pitch
	- [ ] velocity
- [ ] add extra gains and wave shapers to param input chain to allow fading between them when switching between center and offset to prevent clicks








# 0.5.0
- [√] fix dropping on connections on something with a lot of connections already
- [√] duplicate nodes
	- [√] basic cloning
	- [√] offset position of clone slightly
	- [√] menu items for
		- [√] cloning with all connections
		- [√] cloning with connections as if it were new
		- [√] cloning with no connections
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
- [√] permissions
	- [√] when you create a room you are owner
	- [√] make server owner when room is empty
	- [√] in room options you can set it so only you can do stuff, or allow other people to do stuff
	- [√] unlock room when server becomes owner
	- [√] restrict all room things on backend except whitelist
	- [√] restrict all room things on front end
		- [√] at css
		- [√] at input events
	- [√] let users create keyboard if they dont have one
- [√] clone node with ctrl + D
- [√] new clone should be selected
- [√] LFO
	- [√] basic synth LFO
	- [√] filter target
	- [√] fix wave value string
- [√] filter type knob for synth
- [√] filter type knob for sampler
- [√] fix knob arc not being inline
- [√] delay node
	- [√] get basic delay node working
	- [√] feedback loop
	- [√] feedback %
- [√] make it so you can only drag the title bar
- [√] make knob drag area bigger
- [√] zoom in and out from mouse position
- [√] allow typing in knob values
	- [√] enforce min/max
- [√] stats database
	- [√] connect to memory db in local
	- [√] connect to real database in test and prod
	- [√] setup db in prod
- [ ] firebase auth
	- [ ] local
		- [√] UI
			- [√] register
				- [√] send verification email
			- [√] login
				- [√] styling
				- [√] reset password
				- [√] with google
				- [√] facebook
				- [ ] twitter
					- have to apply for a dev account
				- [ ] with sound cloud
					- sound cloud not allowing new apps at this time 2019-07-13
			- [√] logout
		- [ ] client
			- [ ] do Accepts headers properly
		- [√] server
			- [√] verify jwt
		- [ ] ToS
			- [√] create html
			- [ ] make it proper
		- [ ] Privacy policy
			- [√] create html
			- [ ] make it proper
		- [ ] open source licenses
	- [ ] test
		- [√] enable sign in methods in firebase console
		- [ ] google sign in stuff
			- [ ] submit consent screen for verification
		- [ ] facebook sign in stuff
	- [ ] prod
		- [√] enable sign in methods in firebase console
		- [ ] google sign in stuff
			- [ ] submit consent screen for verification
		- [ ] facebook sign in stuff
- [ ] welcome modal
	- [√] change username
	- [ ] create account/login
	- [ ] tutorial
	- [√] newsletter
	- [√] discord
	- [√] patreon
	- [ ] news
	- [ ] recent projects
	- [ ] what would you like to do?
		- [√] new room
		- [√] load room
		- [√] join current room
		- [√] lobby
		- [ ] join friend
	- [ ] adjust volume
- [√] koa
	- [√] before
		- [√] tests
	- [√] migrate
		- [√] cors
- [√] move test api stuff to own file
- [ ] do stuff with accounts system
	- [√] save username
		- [√] on register
		- [√] load on login
		- [√] when change name (debounced)
	- [ ] user color
		- [ ] save on register
		- [ ] save when change color
		- [ ] load on login
	- [ ] save room
	- [ ] load room
	- [ ] friends
	- [ ] upload samples
	- [ ] referral system
	- [ ] sharing room saves
	- [ ] restrict rooms to email verified users
	- [ ] direct messages
	- [ ] avatars
	- [ ] profile
	- [ ] link to patreon account
	- [ ] link to discord
- [√] fix noise wave getting stuck
- [√] DeprecationWarning: collection.update is deprecated. Use updateOne, updateMany, or bulkWrite instead.
- [√] remove samples from the build
- [√] `Uncaught (in promise) [DEFAULT]: Firebase: Firebase App named '[DEFAULT]' already exists (app/duplicate-app).`
- [√] BUG: deleting saves is broken
- [√] address sentry logs (2019-08-05)
- [√] performance pass (2019-08-04)
- [√] BUG: Fix save files from before custom sampler
	- [√] visually
	- [√] samplers aren't playing the piano notes
- [√] BUG: if you save a limited room, when loading it, fakeClient becomes the owner and you can't do anything
	- [√] make it so when you load a room, you become owner
- [√] BUG: errors when switching rooms with debug visual enabled
- [√] blur new room button after click
- [√] system message when saving a room
- [ ] look into if we can not call `next(action)` for middleware actions
- [ ] cant exit modal by clicking in between modals
- [ ] put redux clients in a Map

- [√] add options to disable new animation things
- [ ] menus shouldnt disappear when mouse moves off of it
	- [ ] requires PR for `react-context`
- [ ] pass corgi client version on all api requests
	- [ ] put on uploaded samples

- [ ] **Custom Sampler**
	- morphing the piano sampler into a custom sampler
	- [√] sample pads UI
	- [√] click on pad to play sample
	- [√] change sample colors
	- [√] octave knob to scroll through all 128 samples
	- [√] right click on pad should not play it
	- [√] scrolling thru octaves shouldn't trigger animation
	- [ ] change create server stuff to create a drum sampler
	- [ ] right click pad > select samples...
		- [√] Default samples (built-in samples)
		- [ ] Public samples
		- [ ] Upload...
			- click upload
			- show file browser
			- select file
			- request signed URL from server
			- upload to signed URL
				- how will corgi server know if upload was successful?
				- from corgi server upload to space is free bandwidth, so maybe simpler to upload to corgi?
		- [ ] Your samples
			- menu should show all of your uploaded samples
				- list from corgi DB or DO?
		- [ ] Samples in room
	- [ ] right click pad > clear
	- [ ] allow scrolling thru menu
	- [ ] should be able to focus a pad and use tab and arrow keys to navigate
	- [ ] drag sample onto pad from computer
	- [ ] styling
		- [√] hover
		- [√] click
		- [ ] pad should stay lit while holding down note
	- [√] UI to show sample loading
	- [ ] presets
		- [ ] basic-piano
		- [ ] basic-drums
	- **Uploading Samples**
		- [√] try to decode sample before uploading
		- [√] clip sample name in pad label
		- [ ] drag and drop
			- [√] UI to show that you must be logged in
				- [√] system message
				- [√] sample label on hover
		- [ ] enforce user upload cap
			- [√] server
			- [ ] front end
				- [√] UI
				- [ ] check if it goes over cap before uploading
		- [ ] enforce global upload cap
			- [ ] server
			- [ ] UI
		- [ ] sample renaming
	- **Samples Manager**
		- [√] don't fetch same sample twice
		- [√] fix weird issue with double fetching when going really fast
		- [√] pre-load samples based on what is in redux
			- [√] on room enter (shamu graph replace state)
			- [√] when pad sample is changed (SET_SAMPLE)
			- [√] when instrument is added
			- [√] maybe only log warning if sample isn't even requested yet
		- [ ] clear unused samples when low on space
			- [ ] track sample sizes
			- [ ] track unused samples with time last used
			- [ ] clear samples before loading new sample if over threshold
			- [ ] clear samples after loading new sample if over threshold
			- [ ] display this info to the user somehow
		- [√] samples manager middleware?
		- [√] if `getSample` gets called and sample isn't loaded, then that's an error?

- [√] need to strip undo history of better sequencer when saving
- [√] save room as file broken when room save is too big
- [√] timeline not respecting node width on BS
- [ ] !!! switching osc on synth while playing notes makes it louder
- [ ] add checkbox to toggle chat being in front or back (brinch)
- [ ] audio dying after listening to song for long enough
	- [ ] refactor audio stuff to reuse oscillators and gain nodes, etc.

**PERFORMANCE**
- [ ] make things better when lots of nodes on screen
	- [ ] panning
	- [ ] zooming
	- [ ] moving a node
	- [ ] changing a knob
	- [ ] playing keyboard
- [ ] metrics
	- [ ] rendering
		- [ ] hit test
			- filter, position(abs/fix/rel)
		- [ ] update layer tree
	- [ ] javascript
		- [ ] react
		- [ ] redux
		- [ ] garbage creation/collection
- [ ] general action items
	- [ ] avoid use `filter` css property
	- [ ] avoid use of `position: relative/absolute/fixed`
	- [ ] use `contain: strict` in more places
	- [ ] avoid use of `overflow: hidden`
	- [ ] avoid use of `transform/translate/rotate/scale`
- tips
	- use negative margins
	- use svg transform over css transform
- node specific
	- [√] sampler
	- [√] synth
	- [√] keyboard
	- [√] infinite seq
	- [√] grid seq
	- [√] group seq
	- [√] BS
	- [-] connections
	- [ ] ECS
	- [ ] canvases
		- [ ] master limiter canvas
	- [ ] note scanner
	- [ ] graph node/panel/header
	- [ ] chat
	- [ ] FPS in top div
	- [ ] Zoom text in top div
	- [ ] knob
		- [ ] fix clicking on knob value
		- [ ] fix slob knob changing
	- [ ] make custom debouncing solution that runs on RAF
	- [ ] moving vertical scroll bar on grid sequencer
	- [ ] resizing node on left and top sides
	- [ ] pan/zoom using piano notes sidebar on BS

**SVG**
- [ ] BS
	- [ ] notes
		- [ ] BUG: note resizer mid and right dont always have 100% height
	- [ ] side notes
	- [ ] rows
	- [ ] columns

# Room Types
- [ ] better room button with modal
	- [ ] room name
	- [ ] room type
- [ ] room types
	- [ ] main
	- [ ] experimental modular rewrite
	- [ ] game
	- [ ] drawing

**Refactor Node State**
- [ ] id (already in position state, but might need to stay on node state as well) (staying for now)
- [√] ownerId (move to position state or remove if not used) (moved)
- [√] color (already in position state but not used) (moved)
- [ ] type (already in position state, but node type is used in some places) (staying for now)
- [√] name (move to position state or remove if not used) (removed)
- [√] enabled (removed from node state, was already on position state, and it wasn't used from node state)

**BUGS**
- [ ] grid sequencer timeline going too far right
- [ ] connector placeholders aren't using z-index of parent node

**Better Sequencer**
- [√] scroll up and down with mouse wheel
- [√] hoz zoom with ctrl + scroll
- [√] double click to add note
- [√] drag box around notes to select
- [√] dont use transform scale on rows
- [√] make ECS obey panX
- [ ] when moving group of notes with arrow keys, don't let them bunch up against bounds
- [ ] resizing shouldn't zoom
- [√] drag ends of notes to resize
- [√] pan with middle mouse
	- [ ] change cursor to grabby hand
- [ ] disable notes with 0 key
- [√] box select while holding shift should flip selected notes like ableton
- [ ] change global pan to require middle clicking on background?
- [√] click and drag notes around
- [√] ctrl + d to duplicate notes
	- [ ] use range selection to determine new note start point, like ableton
- [ ] make double click better
- [√] show notes on left side
	- [ ] play note when clicked
		- [ ] only release onMouseUp?
- [√] fix shift box select
- [ ] follow mode where it auto scrolls as song plays
	- [ ] use request animation frame in an effect
- [√] don't save every undo when click drag resizing
- [√] remove note border when small
- [ ] when selected changes in any way, remove overlapped notes and stuff, like ableton
- [√] mouse note resize/move snapping
	- [ ] dynamic column sizes
	- [ ] snap to bars and to increments
- [ ] add more/less vertical bars depending on zoomX
- [ ] right click to cancel/end operation
	- [ ] box select
	- [ ] note move
	- [ ] note resize
- [ ] note resize and move need to snap to smallestNoteLength increments when alt
- [√] when clicking single note with multiple selected, deselect others if mouse hasn't moved enough
- [ ] require modifier key to scroll in better sequencer
- [ ] allow copy pasting notes
	- [ ] between better sequencers
- [√] ctrl + click and drag to duplicate
- [ ] dont delete note on dbl click if shift held down
- [ ] move time bar with arrow keys if no note selected
- [ ] ctrl + space, hold ctrl and click somewhere else, then press space, it takes to presses of space to place from new spot
	- can't repro anymore
- [ ] start playing when space bar is lifted, if user hold space, then play note, start playing with that note
	- similar to starting recordings on OP-1

**Chrome 77 - Envelope Rewrite**
- [ ] address TODOs
- [ ] able to change envelope while note is playing
- [ ] fixed number of voices
- [ ] reuse all nodes (oscillator/gain/pan/filter)

- [ ] make velocity affect keyboard note visual
- [ ] put node version in package json so nvm can use it
- [ ] don't show connect keyboard menu item if keyboard is already connected
- [ ] when you control click on a node header, the selected node(s) becomes connected
- [ ] filter resonance
- [ ] make piano roll notes light up on grid seq when connected keyboard is playing those notes
- [ ] select sample then knobs on right are for that sample
- [ ] mimic hardware samplers like the volca sample
- [ ] button to toggle HUD
- [ ] box select to move or delete multiple things at once
- [ ] way to clear samples from sampler
- [ ] put SVG's on CDN
- [ ] double click node to collapse
- [ ] instead of smooth timeline animation, show a moving dot or blinking dot
- [ ] velocity
- [ ] create sampler menu should let you pick from empty/piano/drum kit
- [ ] show download progress on pad
- [ ] have separate radio selector on pads to select
- [ ] dont select pad just by clicking on it
- [√] make button on nodes to quickly connect your keyboard to it
	- [√] shift + click header or right click and select "connect keyboard"
- [ ] view hotkeys, home goes to start of chain and end goes to end
- [ ] selection group hotkeys
- [ ] RTS DAW
	- [ ] order nodes to move around
	- [ ] have to build new nodes at factories
	- [ ] harvest resources

- [ ] snap nodes to grid
	- [ ] snap nodes together
	- [ ] when moving a node that is snapped to other nodes, move all of them together

https://hal.archives-ouvertes.fr/hal-01304889v1
https://npm.taobao.org/package/@ircam/sync
https://github.com/collective-soundworks

- [ ] turn off overflow for svg (mainly connection svg's)
- [ ] make connector placeholders a child of the node so they dont have to update whenever parent position changes
- [ ] ask the user's experience level
- [ ] ask what the user wants to use corgi for
- [ ] feedback thru sentry
- [ ] change shared pointer to show user is dragging a file
- [ ] change shared pointer to show user is typing
- [ ] change shared pointer to show user is in a modal
- [ ] System messages should open stuff when clicked
	- [ ] messages about needing to be logged in should open login modal
- [ ] allow dismissing system chat messages
- [ ] `Store<IClientAppState>` -> `ClientStore`
- [ ] show note name when hovering on notes in sequencers
- [ ] notes on left of grid seq should play on click
- [ ] empty column on right side of infinite seq to add new notes
- [ ] note names on left side of infinite seq
- [ ] remind people to close DAW to have external midi work
- [ ] stop using socket ID as client ID
- [ ] add some graphics settings to welcome menu
- [ ] when stripping undos for saving, only strip every 10 or so undo states or something
- [ ] setup to use tslint and eslint side by side
- [ ] http://op-101.blogspot.com/2011/09/string-description.html
- [ ] checkbox to hide welcome on start
- [ ] fix G7 and Gb7 samples
- [ ] !fix security issue where anyone can dispatch any custom action to all other clients
- [ ] fix mouse over hold down with alt on grid seq
- [√] setup local.corgi.fm in hosts file so CORS will work maybe with the CDN
- [√] fix chrome cache cors issue (maybe by making a different cdn for each env?)
- [ ] lock down audio node params min/max at instrument level
- [ ] refactor
	- [√] cleanup up express app code
	- [√] look into using `~` for parcel typescript resolution (using lerna now with yarn workspaces)
	- [√] look into generating new react components and redux reducers (use vscode snippets)
	- [√] use `useCallback()` hook
	- [√] lint, disallow dispatch prop
	- [√] eslint_d
	- [ ] change Button to extends button props
	- [ ] redux starter kit
- [√] eslint rule to require awaiting promises
- [ ] look at https://github.com/typestack/routing-controllers
- [ ] look at https://github.com/typestack/socket-controllers
- [ ] disallow visual connection to be made if it causes a feedback loop
- [ ] need visual to show that feedback loops are not possible
- [ ] test on android
- [ ] filter envelope
- [ ] fix loading old saves
- [ ] https://github.com/TrillCyborg/fullstack
- [ ] https://github.com/accounts-js/accounts
- [ ] button on sequencer to plugin keyboard
- [ ] pan to center when making new room or changing rooms
- [ ] more prominent message about version being out of date
- [ ] tap tempo
- [ ] list usernames of room members somewhere
- [ ] metronome
- [ ] solo
	- [ ] disable all audio nodes except for:
		- [ ] soloed nodes
		- [ ] any downstream nodes from soloed nodes
- [ ] fix up group sequencer
	- [ ] connector placements aren't perfect
	- [ ] connected nodes should prefer group sequencer color
	- [ ] maybe show color dots in a corner of node to show what groups it's in?
	- [ ] labels
	- [ ] choose colors
	- [ ] jump to parts of song
	- [ ] click and drag to add things
- [ ] audio still cutting out for people (brinch)
	- If you're using Chrome canary, you can open up the WebAudio inspector in the dev console to examine audio load and callback timing.
	- Or use chrome://tracing to get a trace of the audio processing.
- [ ] infinite sequencer more
	- [ ] add a way to insert notes left and right
	- [ ] way to start song from any point in sequencer
	- [ ] design
- [ ] toggle note click audio for sequencers on title bar
- [ ] welcome screen for new users
	- [ ] welcome button on right side
	- [ ] change name
	- [ ] change volume
	- [ ] enable sound
	- [ ] choose lobby or new room
- [ ] changelog screen
	- [ ] changelog button on right side
- [ ] add button to clear chat
- [ ] "show older messages" button
- [ ] connect new nodes to nearest nodes?
- [ ] show icon on volume to show it is local only
- [ ] long notes mixed with short notes
- [ ] pan and detune knob arcs should start from center
- [ ] make select have label on left side with darker background
- [ ] show edit icon to left of name on hover in top right
- [ ] dragging something to edge of screen should pan for you
- [√] reverb dry/wet knobs
- [ ] compressor dry/wet knobs
- [ ] background looking bad when zooming out
- [ ] display error message when save fails
- [ ] error reporting
- [ ] disabling keyboard
- [ ] fix order of node menu
- [ ] drum sampler?
- [ ] give feedback when saving to browser
- [ ] schedule groups of notes all at same time, so that we can determine the entire envelope ahead of time and avoid using cancelAndHoldAtTime

padenot [4:47 AM]
You need to add 1 and divide by two the signal coming out of the LFO, so it is between 0 and 1. You can do that with a ConstantSource, and a gain
It's just following the values of the sine, really, but you can adjust as you see fit, those values are added to the value of the parameter you connect to, so you can, for example, have the cutoff of a filter oscillate around a central frequency
Yes, https://mmckegg.github.io/web-audio-school/, exercise 13 is exactly what you need


# Basic Sampler -> Custom Sampler
- [ ] UI
- [ ] Redux
	- [√] refactor basic sampler redux
	- [ ] samples data
- [ ] Web Audio Layer
- [ ] Networking


# 0.6.0
- [ ] change cursor to vertical arrows when dragging knob
- [ ] animate things when being changed from over the network
	- [ ] knobs
	- [ ] node positions
	- [ ] connections
- [ ] https://github.com/pelotom/runtypes
- [ ] https://github.com/hmil/rest.ts
- [ ] built in synth for keyboard
- [ ] change clients redux so every client only knows about clients in the same room
- [ ] https://github.com/TheLarkInn/Front-End-Checklist
- [ ] https://developers.google.com/web/progressive-web-apps/checklist
- [ ] https://12factor.net/
- [ ] https://github.com/koajs/compress
- [ ] refactor / clean code
	- [ ] convert all components to function components with hooks
	- [ ] remove connect() and shamuConnect()
	- [ ] use `useCallback()` hook everywhere
	- [ ] husky pre-commit
	- [ ] lint, react function components should be arrow functions
		- so that when you import them it won't add the parens
- [ ] do CORS correctly, only allow corgi.fm origin
- [ ] allow typing in knob values
	- [ ] make value look as similar to display value as possible
	- [ ] make use of the existing value string functions
- [ ] delay node
	- [ ] feedback filter
	- [ ] ping pong delay
	- [ ] bpm synced time knob
	- [ ] separate left and right
- [ ] LFO
	- [ ] pitch target
	- [ ] re-trigger
- [ ] permissions
	- [ ] allow changing mode by click room status in top left
	- [ ] give people permission to do stuff (based on client id)
	- [ ] do something about when you refresh and lose ownership
	- [ ] take ownership if you are last member?
- [ ] if user plays mary had a little lamb, the lick, or megalovania, do something
- [ ] if user programs a sequence that references an existing song, do something
- [ ] allow replacing nodes in place to keep connections
- [ ] put bottom right info in own component outside chat stuff so you can click without activating chat
- [ ] show progress bar on reverb when loading new impulse
- [ ] disable save button until something changes?
- [ ] display musical key in sequencer title bar
- [ ] FM synth
- [ ] master mixer
- [ ] add colored icons on node add menu
- [ ] positional audio
- [ ] chorus
- [ ] phaser
- [ ] flanger
- [ ] distortion
- [ ] desktop notifications for chat
- [ ] allow setting bookmarks on knobs (like setting what the preferred value or range is)
- [ ] right click add node menu, new node should go at right click position, not the left click position

# 0.7.0
- [ ] quick connection mode
	- [ ] or hold ctr and drag from node title bar to draw connection
- [ ] karma system
- [ ] user status icons



# Ideas
- https://github.com/danigb/soundfont-player
- https://github.com/gleitz/midi-js-soundfonts
- https://github.com/colinbdclark/sf2-parser

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
- [ ] different node UI at different zoom levels
- [ ] ability to make nodes smaller/larger zoom levels

# Goals
- [ ] be able to recreate certain songs
	- [ ] hot cross buns
	- [ ] claire de lune
	- [ ] Spoiler - Hyper

# Before Public Alpha
- [ ] database backups/replication
- [ ] host database on own box
- [ ] host websocket server on own box
- [ ] ToS
- [ ] privacy policy

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

# Events
- like discord challenges
	- musical telephone
	- exquisite corpse

# Built in games
- musical tetris
	- the blocks are midi clips or samples
