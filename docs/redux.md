# Client State
- audio
- clients
- options
- rooms
- websocket
- userInput
- room (see room state below)

# Server State	
- clients
- rooms
- roomStores
	- one room state per room (see room state below)

# Room State
- basicSynthesizers*
- basicSamplers*
- chat
- connections**
- globalClock
- gridSequencers*
- infiniteSequencers*
- members
- positions**
- virtualKeyboards*

\* = a type of shamu node
\*\* = coupled with the shamu graph

# Proposed Shamu Node State and Reducer
- shamuGraph
	- connections
	- positions
	- nodes (collection of node states; each node state can be of a specific type with unique properties)
		- sequencers
			- gridSequencers
			- infiniteSequencers
		- instruments
			- basicSynthesizers
			- basicSamplers
		- effects
			- reverb
		- keyboards
			- virtualKeyboards

- [ ] take a look at how redux-form organizes state with different types of inputs

- the nodes reducer will choose the right reducer to use for each node based off of its type
	
