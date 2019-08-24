import {Map, OrderedMap, List, Set} from 'immutable'
import {SavedRoom, SequencerStateBase, ShamuGraphState, betterSequencersReducer, gridSequencersReducer, infiniteSequencersReducer, shamuGraphReducer, globalClockReducer, roomSettingsReducer, connectionsReducer, IPositions, IConnection, BasicSamplerState, basicSamplersReducer, IBasicSamplersState, basicSamplerReducer} from './redux'
import {MidiClip, MidiClipEvent, MidiClipEvents, makeMidiClipEvent, MidiClipEventV1, MidiClipV1, makeMidiClip} from './midi-types'
import {Samples, makeSamples, Sample, dummySample} from './common-samples-stuff';

export function transformLoadedSave(save: Partial<SavedRoom>): SavedRoom {
	return [save]
		.map(bar)
		.pop()!
}

function bar(save: Partial<SavedRoom>): SavedRoom {

	return {
		...save,
		positions: enableNodesMaybe(Map(save.positions || [])),
		connections: save.connections || connectionsReducer(undefined, {} as any).connections,
		globalClock: save.globalClock || globalClockReducer(undefined, {} as any),
		room: save.room || '?',
		roomSettings: save.roomSettings || roomSettingsReducer(undefined, {} as any),
		saveClientVersion: save.saveClientVersion || '?',
		saveDateTime: save.saveDateTime || '?',
		saveServerVersion: save.saveServerVersion || '?',
		shamuGraph: convertShamuGraph(save.shamuGraph || {}),
	}
}

function enableNodesMaybe(positions: IPositions): IPositions {
	const _positions = Map(positions || [])

	if (_positions.some(position => position.enabled === undefined)) {
		return _positions.map(x => ({...x, enabled: true}))
	} else {
		return _positions
	}
}

function convertShamuGraph(shamuGraph: Partial<ShamuGraphState>): ShamuGraphState {
	return {
		nodes: convertShamuGraphNodes(shamuGraph.nodes || {}),
		edges: shamuGraph.edges || Map<string, IConnection>(),
	}
}

function convertShamuGraphNodes(nodes: Partial<ShamuGraphState['nodes']>): ShamuGraphState['nodes'] {
	return {
		...shamuGraphReducer(undefined, {} as any).nodes,
		...nodes,
		basicSamplers: convertBasicSamplers(nodes.basicSamplers || basicSamplersReducer(undefined, {} as any)),
		betterSequencers: convertSequencers(nodes.betterSequencers || betterSequencersReducer(undefined, {} as any)),
		gridSequencers: convertSequencers(nodes.gridSequencers || gridSequencersReducer(undefined, {} as any)),
		infiniteSequencers: convertSequencers(nodes.infiniteSequencers || infiniteSequencersReducer(undefined, {} as any)),
	}
}

function convertBasicSamplers(samplers: IBasicSamplersState): IBasicSamplersState {
	return {
		...samplers,
		things: Map(samplers.things).map(convertBasicSampler).toObject(),
	}
}

function convertBasicSampler(sampler: Partial<BasicSamplerState>): BasicSamplerState {
	return {
		...new BasicSamplerState(sampler.ownerId!),
		...sampler,
		samples: convertSamples(sampler.samples || makeSamples()),
	}
}

function convertSamples(samples: Samples): Samples {
	return Map(samples).map(convertSample)
}

function convertSample(sample: Partial<Sample>): Sample {
	return {
		...dummySample,
		...sample,
		path: convertSamplePath(sample.path || (sample as any).filePath || undefined),
	}
}

function convertSamplePath(path?: string): string {
	if (path === undefined) return dummySample.path

	if (path.startsWith('basic-piano/')) {
		return path.replace('basic-piano/', 'static/samplers/basic-piano/')
	}

	if (path.startsWith('basic-drums/')) {
		return path.replace('basic-drums/', 'static/samplers/basic-drums/')
	}

	return path
}

function convertSequencers<
	T extends {things: {[key: string]: U}},
	U extends SequencerStateBase
>(sequencer: T): T {
	return {
		...sequencer,
		things: Map(sequencer.things).map(convertSequencer).toObject(),
	}
}

function convertSequencer<T extends SequencerStateBase>(sequencer: T): T {
	return {
		...sequencer,
		midiClip: convertMidiClip(sequencer.midiClip),
	}
}

function convertMidiClip(midiClip: MidiClip | MidiClipV1): MidiClip {
	// if midi clips are not version 2, convert
	if (midiClip.version === '2') return midiClip

	return {
		...makeMidiClip(),
		...midiClip,
		events: convertListEventsToV2(List(midiClip.events)),
		version: '2',
	}
}

function convertListEventsToV2(events: List<MidiClipEventV1>): OrderedMap<Id, MidiClipEvent> {
	return events.reduce((result, event) => {
		const newEvent = makeMidiClipEvent({
			durationBeats: event.durationBeats,
			note: Set(event.notes).first(-1),
			startBeat: event.startBeat,
		})
		return result.set(newEvent.id, newEvent)
	}, OrderedMap<Id, MidiClipEvent>())
}
