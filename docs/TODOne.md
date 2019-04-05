- [√] allow deleting nodes
	- how?
		- delete button on node
		- [√] delete menu option when right clicking a node
			- [√] don't show delete option if not deletable
			- [√] sub menu hell
		- move to trash can
	- confirmation?
		- modal
		- long click
		- click and drag slider
- [√] external midi notes should always highlight keys
- [√] add cookies banner thing for GDPR
- [√] right click menu to add nodes
- [√] sequencers should only play if connected to a playing master clock, even if indirectly
- [√] make board bigger
- [√] disable long click menu (w/o breaking it for touch screens) (not sure if broke touchscreens, need to test)
- [√] change ctrl + click for deleting notes in grid seq to shift click
- [√] allow alt click drag to create notes in grid seq
- [√] GET /api/users/count

## Updating web audio graph
when i break the connection from an instrument to the audio output i want sound to stop
i want the instrument to disconnect from w/e audio node it is connected to

- [√] give instruments a disconnect and connect function

connections middleware?
when a connection source or target is changed, or is a new connection or a connection was deleted
if the source or target of the connection was changed, (or new or deleted connection)
	then call the necessary functions on the instruments involved to update the web audio graph
	
instrument manager?

what are the types of nodes that have an audio graph component?
- instruments
- audio output
- future
	- effects
	- audio inputs (microphone, external instruments)

how to tell what to connect to what in the instrument manager?

make Instrument implement the AudioNode interface?
	pass through stuff to the underlying audio node

make it so instrument doesn't take a destination at construction
instead all connections must be done my the instrument manager
instrument manager already handles all creation and destruction of instruments
- [√] when an instrument gets created, look to see if it has an outgoing connection
- [√] see if connection is connected to anything
- [√] see if connection target is an audio node thing?
- [√] if it is, use the targets input audio node as the output audio node for the new instrument

- [√] make an ECS system for real time stuff
	- real time loop that reads redux state, or some other state, and renders stuff to canvases and what not
	- have a component for rendering to a canvas, one for DOM, text, audio even, etc.
- [√] allow panning by clicking and dragging background
- [√] add low graphics setting
- [√] remove read ahead knob
- [√] maybe unpress all key when app loses focus
- [√] hook up note-scanner with everything
	- [√] change sequencer state to whole new stuff
	- [√] respect sequencer isPlaying
	- [√] get sampler to support scheduled notes
	- [√] prevent multiple oscillators/voices on same instrument from playing same note at same time, including releasing
	- [√] make option for displaying note scheduler visual debug thing
		- [√] make option
		- places to toggle:
			- [√] synth view tsx
			- [√] in the visual tsx file
	- [√] get stuff working again
		- [√] keyboard
			- [√] computer keyboard
			- [√] mouse
				- this is a bit tricky
				- need logic in local middleware, but that logic is currently only for local user
			- [√] midi keyboard
			- [√] check performance
		- [√] make note-scanner use note length from event
		- [√] stopping a specific sequencer should immediately cancel scheduled notes from that sequencer
		- [√] fix ctrl space
		- [√] sequencer animations
			- css animation
				- cons
					- little control
					- hard to keep perfectly in sync
				- pros
					- simple?
					- little code
				- notes
					- who should render it?
						- the sequencer?
							- annoying to redo on all new sequencers
							- don't have to since it's absolutely positioned
						- something else?
			- javascript/canvas
				- haven't done this yet
			- javascript/svg
				- have done, but its sloppy
			- [√] ECS
				- could take a while to get started
				- [√] remove all but one RAF loop
				- [√] render a square at each node position
				- [√] one canvas per graph node
				- [√] squares should be in front of nodes
				- [√] line should only cover notes area
				- [√] only sequencers
				- [√] only when playing
				- [√] go with song
				- [√] merge ecs with scan room toggle thing
		- [√] infinite seq loop length
		- [√] release all notes on stop
		- [√] stopping song shouldn't release notes being played by user
		- what does ableton do when you stop and there is a note with a really long release
			- it just keeps on releasing, even when you hit play again
			- but you can adjust release of note that are already releasing, in serum at least
		- [√] get noise osc on synth working with schedules
		- [√] make instrument params affect currently playing notes
			- [√] pan
			- [√] filter
			- [√] detune
			- [√] osc type
				- [√] normal
				- [√] noise
	- [√] animate active connections in the direction that data is flowing
- [√] put limits on virtual keyboard octave
- [√] add gain knob on instruments
- [√] show version and "pre-alpha" in bottom right
	- [√] make red if client out of date
	- [√] clicking on it when version mismatch reloads
	- [√] tooltip
- [√] prevent multiple oscillators/voices on same instrument from playing same note at same time, including releasing
	- i have all the info i need to be able to do this right?
		- note start times
		- well, when a note is played i dont know when it will end until its release is scheduled
			- do i need to know?
	- what should happen when a note is scheduled?
		- option A
			- check for any scheduled notes playing same note that will overlap
				- if any, then, don't schedule? or schedule it in a way that doesn't overlap?
		- option B (ableton style)
			- check for any scheduled notes playing same note that will overlap
				- if any
					- if new note starts before existing note
	- what will deal with conflicts?
		- note scheduler?
			- i dont think it can, its just a pure function, need state for this?
			- the scheduler can only predict what the instrument has scheduled
		- the instrument?
			- probably
			- it will need to keep track of all scheduled notes
			- [√] make instrument keep track of all scheduled notes/events/voices
				- [√] move AudioNodeWrapper to new file
	- BUG sometimes two note ons will schedule, but only one note off
		- with current system, this will end in a stuck note
		- once i implement the ableton system thing, this shouldnt be a problem, because it will only allow 1 at a time for same note
	- what does ableton do?
		- if two tracks play same note at same time, only one will play
		- if a note is already playing, and a new note from different tracks start to play same note, old note is just stopped and new note starts attack
		- what about with the user playing a note while a track is playing
			- same thing, when a note is triggered, if an existing note is playing it is canceled and new note starts with attack
			- also, when user releases key, ti will trigger release of currently playing note, regardless of who started the note
	- what does tone.js do?
		- i dont have an easy way to test this, but i think tone.js will just play whatever you tell it to
- [ ] get stuff working again
	- [...] keyboard
		- i want lowest latency possible for live keyboard playing
		- i also want the keyboard notes to union with the sequencers or other keyboards
			- this is hard, because the user playing the keyboard needs to be instant
				but the other sequencers are scheduling notes
		- first step?
			- if notes aren't getting combined some how, then things can get loud
			- not having super low latency is a deal breaker, so lets start there
		- where does the user input start from?
			- mouse
			- keyboard
				- input-events.ts
				- LOCAL_MIDI_KEY_PRESS
				- listen for action dispatch?
					- if we do, we need to listen for it in middleware
				- what are we even going to do with the key press?
					- directly schedule notes to the connected instruments?
				- what info do we need?
					- what key was pressed
					- virtual keyboard state (octave)
					- access to instruments
						- instrument-manager
						- could pass a ref to a middleware creator
						- or use getAllInstruments?
					- connections state (or a selector)
				- **do in local-middleware**
				- why am i not storing instrument refs in store?
				- [√] PROBLEM
					- the way i schedule releases wont work with keyboard?
						- does it even work with multiple sequencers going to same instrument?
					- i think the wrong notes might end up getting released
				- will be able to test this stuff better with a better sequencer
					- or change keyboard to use scheduler
				- [√] OCTAVE PROBLEM
					- switching octave while holding note
					- how did old system do it?
						- it releases old note and starts new one with newly triggered envelope
				- why not just use old system for keyboards only?
					- this works, but still has issue of playing two oscillators at same freq
				- how to prevent 2 oscillators playing same freq at same time
					- only allow one midi input (bad)
					- use old system (bad?)
				- Scenario: A
					- steps
						- two keyboards routed to same synth
						- hold C4 on first keyboard
						- hold C4 on 2nd keyboard
						- shouldnt hear anything different
						- release note on 2nd keyboard
						- shouldnt hear anything different
					- works on old system
				- maybe make it required to know the release time when someone schedules
					- that way notes wont get stuck on
					- things can extend a release but only by a certain amount
					- like a heartbeat
					- this shouldnt be necessary tho right?

in old setup
i iterate thru the instruments
select notes from sources and union them together


in new system
i start from a clock (RAF)
maybe i could iterate thru each instrument
grab events from sources
union
run through note-scheduler
then schedule?


in a real mod synth setup
that was sending midi from two sources into a poly synth
and you sent the same note at same time
what would you expect to happen?
one note or two notes being played?
can i test this in ableton?
- yes
- in ableton, it unions the midi so you would only hear one note
- but only if exact same time
- and of course, most poly synths only allow a voice to play one freq at a time
- or more, only one voice at a freq at a time


when to union?
preferably after running thru the note scheduler


each tick
run all sequencers events thru scheduler

then for each instrument

union events from the input sequencers and schedule them
- [√] use OscillatorNode.detune
	- https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode/detune
- [√] fix connectors not lighting up
- 2019-02-13 - 2019-02-15
- [√] highlight connector on mouseover
	- [√] make ghost connector look like normal connector
- 2019-02-12
	- [√] fix ghost connection to be curved
	- [√] make zoom and pan affect mouse cursors
		- [√] use position system to render mouse cursors
			- [√] use transform translate and will-change
- 2019-02-09 - 2019-02-10
	- [√] convolution reverb (initial impl)
		- [√] make it connected to audio output at server create stuff
		- [√] remove reverb from master
		- [√] troubleshoot perf issues
			- Reverb buildImpulse keeps running
				- because I'm setting the time value every update
					- [√] stop that
		- [√] make it sound good
			- ~~when time is changed, it rebuilds some reverb data~~
				- this is how a convolver reverb works
		- [√] make ui better
		- [√] make it get organized in create server stuff
		- [√] make everything go through the reverb before audio output
	- [√] fix multiple audio outputs
		- [√] allow multiple audio outputs
		- [√] properly disconnect things when a node already has multiple outbound connections
	- [√] 'Maximum call stack size exceeded' issue again with looped connections
		- sampler -> reverb -> same sampler


- [√] download an open source font (Roboto)
- [√] disallow browsers that aren't chrome
- [√] op1 arp sequencer thing
- [√] noise wave type
	- https://noisehack.com/generate-noise-web-audio-api
- [√] triangle wave
- [√] track mouse pointers
- [√] maybe use requestAnimationFrame()
- [√] persist keyboard state on server, and don't store notes and octaves on clients
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
- [√] need way to bypass virtual keyboard
- [√] don't unnecessarily change osc freq when diff notes are set
- [√] make it so you have to click on keyboard first for the hold and play to work
- [√] visual for instrument
- [√] visual for master volume amp thing
