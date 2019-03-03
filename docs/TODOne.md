
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

