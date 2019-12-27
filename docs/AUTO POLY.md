problems:
- multiple incoming connections with different voice counts
- changing voice count
	- audio connections
	- midi connections
- nodes that require making more instances of non web audio stuff per voice
- cleaning up unneeded voices


classes:
- A
	- MonoNode
	- MonoParam
	- PolyNode
	- PolyParam
- B
	- PugNode
	- PugParam




# scenarios

## oscillator unison

```ts
const osc = new PugOsc()
osc.unison.voiceCount = 5
osc.unison.detune = 9
```

# Mono to Poly & Poly to Mono
Who calls `webAudioNode.connect()`?
I would usually think the source would.
All a target needs to do is change voice count in reaction to a source.

# Auto Poly
If a node has autoPoly enabled, then it inherits the voice count of its sources (max).
If autoPoly is disabled, then source voices will be merged to a single signal.

## Examples

### Oscillator Unison
To use unison on an oscillator, it would have autoPoly disabled, because it will control the voice count based on the unison settings.

# Random
Maybe a PolyPugAudioNode should wrap a PugMonoAudioNode rather than an AudioNode directly.
That way we can have complex voices like unison oscillators.


- web audio nodes (with audio params)
	- can't modify/extend, can only wrap
	- can make custom ones with script processor and audio worklet
	- built in nodes don't support poly out of the box
- pug nodes (with pug params)
	- will support mono/poly for nodes and params
	- wrap web audio nodes/params
	- provides abstract base classes
- corgi modules (with corgi params)
	- use multiple pug nodes/params
	- has input/output ports which wrap pug nodes/params

# Scenarios
- connect mono to mono
- connect poly to poly
- connect mono to poly
- connect poly to mono
- change a mono node to a poly node
- change a poly node to a mono node
- change voice count

# Idea A
Wrap every built in web audio node

I don't want to have to create a new instance of anything to switch between poly and mono
but that means more if statements?

Should only have to use different functions for mono vs poly

