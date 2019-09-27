# EXPERIMENTAL

## low level nodes
- audio sources (uses clock, no inputs, outputs audio)
	- oscillator
- audio effects (uses clock, audio in, audio out)
	- filter
	- pan
	- gain
- modulation sources (uses clock, trigger in, CV out)
	- envelope generator
	- LFO
- midi sources (uses clock, no inputs, outputs MIDI)
	- sequencer
- midi effects (uses clock?, MIDI in, MIDI out)
	- pitch
	- random
- other
	- polyphonic MIDI to CV converter? (MIDI in, trigger & CV out)


# TODO
- [√] NodeManager
- [√] CorgiNode
- [ ] redux
	- [...] nodes reducer
		- [ ] add/delete/replaceAll
		- [ ] changeNodeParam
- [ ] display knobs for params
- [ ] delete connections
