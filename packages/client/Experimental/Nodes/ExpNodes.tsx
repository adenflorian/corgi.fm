import {ExpNodeType} from '@corgifm/common/redux'
import {CorgiNodeConstructor} from '../CorgiNode'
import {OscillatorExpNode} from './ExpOscillatorNode'
import {LowFrequencyOscillatorExpNode} from './ExpLowFrequencyOscillatorNode'
import {DummyNode} from './DummyNode'
import {FilterNode} from './FilterNode'
import {AudioOutputExpNode} from './AudioOutputExpNode'
import {ExpGainNode} from './ExpGainNode'
import {ExpPanNode} from './ExpPanNode'
import {EnvelopeNode} from './EnvelopeNode'
import {SequencerNode} from './SequencerNode'
import {ConstantExpNode} from './ExpConstantNode'
import {MidiConverterNode} from './MidiConverterNode'
import {KeyboardNode} from './KeyboardNode'
import {DistortionExpNode} from './DistortionExpNode'
import {ManualPolyphonicMidiConverterNode} from './ManualPolyphonicMidiConverterNode'
import {GroupNode} from './GroupNode'
import {GroupInputNode} from './GroupInputNode'
import {GroupOutputNode} from './GroupOutputNode'
import {MidiRandomNode} from './MidiRandomNode'
import {MidiPitchNode} from './MidiPitchNode'
import {ExpOscilloscopeNode} from './ExpOscilloscopeNode'
import {AutomaticPolyphonicMidiConverterNode} from './AutomaticPolyphonicMidiConverterNode'
import {PolyphonicGroupNode} from './PolyphonicGroupNode'
import {PolyphonicGroupInputNode} from './PolyphonicGroupInputNode'
import {PolyphonicGroupOutputNode} from './PolyphonicGroupOutputNode'
import {ExpPolyTestNode} from './ExpPolyTestNode'

// Is there a way to use class decorators to create this map at runtime?
export const typeClassMap: {readonly [key in ExpNodeType]: CorgiNodeConstructor} = {
	oscillator: OscillatorExpNode,
	dummy: DummyNode,
	filter: FilterNode,
	audioOutput: AudioOutputExpNode,
	gain: ExpGainNode,
	pan: ExpPanNode,
	envelope: EnvelopeNode,
	sequencer: SequencerNode,
	constant: ConstantExpNode,
	lowFrequencyOscillator: LowFrequencyOscillatorExpNode,
	midiConverter: MidiConverterNode,
	manualPolyphonicMidiConverter: ManualPolyphonicMidiConverterNode,
	automaticPolyphonicMidiConverter: AutomaticPolyphonicMidiConverterNode,
	keyboard: KeyboardNode,
	distortion: DistortionExpNode,
	group: GroupNode,
	groupInput: GroupInputNode,
	groupOutput: GroupOutputNode,
	midiRandom: MidiRandomNode,
	midiPitch: MidiPitchNode,
	oscilloscope: ExpOscilloscopeNode,
	polyphonicGroup: PolyphonicGroupNode,
	polyphonicGroupInput: PolyphonicGroupInputNode,
	polyphonicGroupOutput: PolyphonicGroupOutputNode,
	polyTest: ExpPolyTestNode,
}
