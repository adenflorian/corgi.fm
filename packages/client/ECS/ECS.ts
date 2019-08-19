import {List} from 'immutable'
import {Store} from 'redux'
import {ConnectionNodeType, isSequencerNodeType} from '@corgifm/common/common-types'
import {
	AppOptions, IClientAppState, MASTER_AUDIO_OUTPUT_TARGET_ID, selectAllPositions,
	selectGroupSequencer, selectOption, selectPosition, selectSequencer, selectSequencerIsPlaying, findNodeInfo,
} from '@corgifm/common/redux'
import {limiterRenderSystemConstants} from '../client-constants'
import {getSequencersSchedulerInfo} from '../note-scanner'
import {ECSAudioOutputEntity} from './ECSAudioOutputEntity'
import {ECSCanvasRenderSystem} from './ECSCanvasRenderSystem'
import {
	ECSGraphPositionComponent, ECSLimiterComponent, ECSSequencerComponent,
} from './ECSComponents'
import {ECSLimiterRenderSystem} from './ECSLimiterRenderSystem'
import {ECSSequencerEntity} from './ECSSequencerEntity'
import {ECSSequencerRenderSystem} from './ECSSequencerRenderSystem'
import {ECSEntity, ECSSystem} from './ECSTypes'

let _store: Store<IClientAppState>
let _systems: List<ECSSystem>
let _entities: List<ECSEntity>
let audioOutputEntities = List()

export function getECSLoop(store: Store<IClientAppState>, masterLimiter: DynamicsCompressorNode) {
	_store = store

	_systems = List<ECSSystem>([
		new ECSCanvasRenderSystem(),
		new ECSSequencerRenderSystem(),
		new ECSLimiterRenderSystem(),
	])

	_entities = List<ECSEntity>()

	audioOutputEntities = List([
		new ECSAudioOutputEntity(
			new ECSGraphPositionComponent({
				id: MASTER_AUDIO_OUTPUT_TARGET_ID,
			}),
			new ECSLimiterComponent({
				limiter: masterLimiter,
				canvasId: limiterRenderSystemConstants.id,
				valueId: limiterRenderSystemConstants.valueId,
			}),
		),
	])

	return {
		ecsLoop,
		onSetActiveRoom: () => _systems.forEach(x => x.onSetActiveRoom()),
	}
}

function ecsLoop() {
	const state = _store.getState()
	const roomState = state.room

	if (selectOption(state, AppOptions.graphicsECS) !== true) return

	// Populate entities
	// TODO Don't do every frame
	_entities = selectAllPositions(roomState)
		.filter(x => isSequencerNodeType(x.targetType) || x.targetType === ConnectionNodeType.groupSequencer)
		.map(position => ({
			position,
			sequencer: isSequencerNodeType(position.targetType)
			? selectSequencer(roomState, position.id)
			: selectGroupSequencer(roomState, position.id),
			nodeInfo: findNodeInfo(position.targetType),
		}))
		.map(({position, sequencer, nodeInfo}) => new ECSSequencerEntity(
			new ECSGraphPositionComponent({
				id: sequencer.id,
				x: 0,
				y: 0,
				height: position.height,
			}),
			new ECSSequencerComponent({
				notesDisplayStartX: nodeInfo.notesDisplayStartX,
				notesDisplayWidth: nodeInfo.notesDisplayWidth,
				ratio: getSequencersSchedulerInfo()
					.get(sequencer.id, {loopRatio: 0})
					.loopRatio * sequencer.zoom.x,
				isPlaying: isSequencerNodeType(sequencer.type)
					? selectSequencerIsPlaying(state.room, sequencer.id) && selectPosition(state.room, sequencer.id).enabled
					: true,
			}),
		))
		.toList()
		.concat(audioOutputEntities)

	// iterate through _systems, and pass valid entities to them
	_systems.forEach(system => {
		const entitiesForSystem = _entities.filter(x => entityHasComponentsRequiredBySystem(x, system))
		system.execute(entitiesForSystem)
	})
}

function entityHasComponentsRequiredBySystem(entity: ECSEntity, system: ECSSystem) {
	return !system.getRequiredComponents().some(reqComp => {
		return !entity.getComponents().includes(reqComp)
	})
}
