# EXPERIMENTAL

## Goals
- model after real world modular synth setup
- OOP
- performance by bypassing react-redux
- build everything with building blocks

## low level nodes
- audio sources (uses clock, no inputs, outputs audio)
	- [√] oscillator
- audio destinations (only inputs)
	- [√] audio output
	- [ ] audio analyser?
- audio effects (uses clock, audio in, audio out)
	- [√] filter
	- [√] pan
	- [√] gain
- modulation sources (uses clock, trigger in, CV out)
	- [ ] envelope generator
	- [ ] LFO
- midi sources (uses clock, no inputs, outputs MIDI)
	- [ ] sequencer
- midi effects (uses clock?, MIDI in, MIDI out)
	- [ ] pitch
	- [ ] random
- other
	- [ ] polyphonic MIDI to CV converter? (MIDI in, trigger & CV out)


# The Node System
you got nodes
nodes are connected with connections
1 or more nodes and connections make up a graph

graphs are made up of nodes and connections between those nodes
nodes can be windows into other graphs
a graph can be a single node with some specific settings
a graph can be a handful of nodes that have no connections between them

## Graph
### Properties
- id
- name
- type? (nodePreset | )

## Node
### Properties
- id
- name
- graphId (groupId)
- type (oscillator | gain | filter | ...)

## Connection
### Properties
- id
- graphId (groupId)
- type (audio | midi)
- sourceId
- sourceType
- sourcePortId
- target...

# TODO
- [√] NodeManager
- [√] CorgiNode
- [√] redux
	- [√] nodes reducer
		- [√] add/delete/replaceAll
		- [√] changeAudioParam
- [√] display knobs for params
	- [√] audio params
- [√] groups
- [ ] linked groups
- [ ] polyphony
	- [√] ManualPolyphonicMidiConverter
	- [ ] AutomaticPolyphonicMidiConverter


# Envelope
- inputs
	- gate/trigger
	- attack
	- decay
	- sustain (could be controlled by CV, just a gain node basically)
	- release
- outputs
	- main CV to control a gain or something (audio)
- internal
	- envelopeGain: internal gain for scheduling the actual envelope on
	- sustainGain: sustain gain node?
	- outputGain: output gain node fo enable/disable


what's a simple node that would just output a gate signal at a set rate?
a clock?

what's a simple node that could take in a gate signal?
an LFO?

gate can be just an audio signal, that only outputs 2 values, 0 or 1


gate input on envelope needs to be faked
it is basically note on/off

a gate output could be audio or fake/digital

- [ ] knobs
	- [ ] attack
	- [ ] decay
	- [ ] release

what to call the other param types...
- custom params
- digital params

single number value
typed string value (enum)
boolean
midi events

midi events is pretty special

for the other single value types, should we wrap those into a single param type, like CustomParam?
the point of this new param is to hold a single value, that's not stored in the web audio api

web audio api does have other non audio params like booleans and enums


# Param Types
- [√] Audio Params (Use WAAPI AudioParam interface)
- [ ] Other Web Audio Params (Stored in Web Audio objects/nodes)
- [ ] Custom Single Value Params (Stored in the CorgiNode/redux)
- [ ] Midi Events (Stored in the CorgiNode/redux)




- inputs
	- audio (raw | param)
	- gate
- params
	- audio
	- custom number
	- enum
	- boolean
- outputs
	- audio
	- gate
