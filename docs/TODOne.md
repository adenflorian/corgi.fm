

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

