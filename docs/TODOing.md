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
- [ ] menus shouldnt disappear when mouse moves off of it
- [ ] cant exit modal by clicking in between modals
- [ ] add options to disable new animation things

- [ ] **Custom Sampler**
	- morphing the piano sampler into a custom sampler
	- [√] sample pads UI
	- [√] click on pad to play sample
	- [√] change sample colors
	- [√] octave knob to scroll through all 128 samples
	- [ ] right click on pad should not play it
	- [ ] right click pad > select samples...
		- [√] Default samples (built-in samples)
		- [ ] Public samples
		- [ ] Upload...
		- [ ] Your samples
		- [ ] Samples in room
	- [ ] right click pad > clear
	- [ ] allow scrolling thru menu
	- [ ] should be able to focus a pad and use tab and arrow keys to navigate
	- [ ] drag sample onto pad from computer
	- [ ] presets
		- [ ] basic-piano
		- [ ] basic-drums
	- [ ] styling
		- [ ] hover
		- [ ] click
	- [ ] UI to show sample loading
	- Samples Manager
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
