import {ExpNodeType} from './redux'

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
	height: 280,
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