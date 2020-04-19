export type ExpNodeType = typeof expNodeTypes[number]

export const GroupExpNodeType = 'group'

export type GroupType = typeof GroupExpNodeType

export const expNodeTypes = [
	'betterSequencer', 'sequencer',
	'oscillator', 'sampler', 'basicSynth',
	'filter', 'gain', 'pan', 'distortion', 'waveShaper', 'convolutionReverb',
	'lowFrequencyOscillator', 'envelope', 'constant',
	'midiRandom', 'midiPitch',
	'midiConverter', 'manualPolyphonicMidiConverter', 'automaticPolyphonicMidiConverter',
	'midiGate', 'midiPulse', 'midiMatch', 'midiMessage',
	'oscilloscope', 'polyTest', 'note', 'dummy', 'audioOutput', 'keyboard',
	GroupExpNodeType,
	'groupInput', 'groupOutput',
] as const

const defaultExpNodeInfo = {
	width: 300,
	height: 220,
}

type ExpNodeInfo = Readonly<typeof defaultExpNodeInfo>

const expNodeInfos = new Map<ExpNodeType, ExpNodeInfo>()

expNodeInfos.set('betterSequencer', {
	width: 800,
	height: 800,
})

expNodeInfos.set('oscillator', {
	width: 200,
	height: 340,
})

expNodeInfos.set('filter', {
	width: 320,
	height: 320,
})

expNodeInfos.set('midiPitch', {
	width: 160,
	height: 160,
})

expNodeInfos.set('midiRandom', {
	width: 160,
	height: 160,
})

expNodeInfos.set('keyboard', {
	width: 460,
	height: 260,
})

expNodeInfos.set('basicSynth', {
	width: 600,
	height: 660,
})

expNodeInfos.set('waveShaper', {
	width: 160,
	height: 120,
})

expNodeInfos.set('midiGate', {
	width: 160,
	height: 120,
})

expNodeInfos.set('midiPulse', {
	width: 160,
	height: 120,
})

expNodeInfos.set('midiMatch', {
	width: 240,
	height: 100,
})

expNodeInfos.set('midiMessage', {
	width: 240,
	height: 120,
})

expNodeInfos.set('sampler', {
	width: 200,
	height: 500,
})

expNodeInfos.set('gain', {
	width: 160,
	height: 200,
})

expNodeInfos.set('envelope', {
	width: 340,
	height: 340,
})

expNodeInfos.set('automaticPolyphonicMidiConverter', {
	width: 200,
	height: 200,
})

expNodeInfos.set('manualPolyphonicMidiConverter', {
	width: 200,
	height: 300,
})

expNodeInfos.set('midiConverter', {
	width: 200,
	height: 220,
})

expNodeInfos.set('sequencer', {
	width: 160,
	height: 180,
})

expNodeInfos.set('audioOutput', {
	width: 160,
	height: 100,
})

expNodeInfos.set('pan', {
	width: 160,
	height: 160,
})

expNodeInfos.set('constant', {
	width: 160,
	height: 160,
})

expNodeInfos.set('lowFrequencyOscillator', {
	width: 280,
	height: 280,
})

export function getExpNodeInfo(type: ExpNodeType): ExpNodeInfo {
	return expNodeInfos.get(type) || defaultExpNodeInfo
}

export interface NodeCategoryTree extends ReadonlyMap<string, NodeCategory> {}

export interface NodeCategory {
	readonly name: string
	readonly types: ReadonlySet<ExpNodeType>
	readonly hidden?: boolean
}

export const nodeCategoryTree: NodeCategoryTree = new Map([
	['sequencers', {
		name: 'Sequencers',
		types: new Set([
			'betterSequencer', 'sequencer',
		]),
	}],
	['instruments', {
		name: 'Instruments',
		types: new Set([
			'oscillator', 'sampler', 'basicSynth',
		]),
	}],
	['audioEffects', {
		name: 'Audio Effects',
		types: new Set([
			'filter', 'gain', 'pan', 'distortion', 'waveShaper', 'convolutionReverb',
		]),
	}],
	['modulators', {
		name: 'Modulators',
		types: new Set([
			'lowFrequencyOscillator', 'envelope', 'constant',
		]),
	}],
	['midiEffects', {
		name: 'Midi Effects',
		types: new Set([
			'midiRandom', 'midiPitch',
		]),
	}],
	['midiConverters', {
		name: 'Midi Converters',
		types: new Set([
			'midiConverter', 'manualPolyphonicMidiConverter', 'automaticPolyphonicMidiConverter',
		]),
	}],
	['midiLogic', {
		name: 'Midi Logic',
		types: new Set([
			'midiGate', 'midiPulse', 'midiMatch', 'midiMessage',
		]),
	}],
	['other', {
		name: 'Other',
		types: new Set([
			GroupExpNodeType,
			'oscilloscope', 'polyTest', 'note', 'dummy', 'audioOutput', 'keyboard',
		]),
	}],
	['hidden', {
		name: 'Hidden',
		types: new Set([
			'groupInput', 'groupOutput',
		]),
		hidden: true,
	}],
])

let foo = new Set(expNodeTypes.slice())

{
	[...nodeCategoryTree.values()].forEach(value => {
		value.types.forEach(x => foo.delete(x))
	})
}

if (foo.size > 0) {
	throw new Error(`nodeCategoryTree is missing the following ${foo.size} types: ` + JSON.stringify([...foo.values()]))
}
