# Now
- [ ] hook up note-scanner with everything
	- [ ] change sequencer state to whole new stuff
	- [ ] keyboard

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

# Soon
- [ ] allow adding connections from a node with no connections on it already
	- [ ] split up ConnectionView
		- [ ] Connector component
		- [ ] ConnectionLine component
- [ ] fix old view
- [ ] add ability to add nodes
- [ ] new graph state
	- [√] move reducers for the different node types under the shamu graph reducer, but keep them separate
	- [ ] update positions calculations to update positions in new graph state
		- keeping positions state where it is for now, the important thing is the actual node types
	- [ ] change all the old multi things to use new graph state
		- [ ] change selectors to grab from new graph state

# Later
- [ ] look into using an algorithmic reverb
	- https://itnext.io/algorithmic-reverb-and-web-audio-api-e1ccec94621a
- [ ] tone.js
	- [√] master volume
	- [ ] synth
	- [ ] sampler
	- [ ] sequencer data structures
