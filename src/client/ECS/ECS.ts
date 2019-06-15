import {List} from 'immutable'
import {Store} from 'redux'
import {ConnectionNodeType, isSequencerNodeType} from '../../common/common-types'
import {
	AppOptions, IClientAppState, selectAllPositions, selectGroupSequencer,
	selectOption, selectSequencer, selectSequencerIsPlaying,
} from '../../common/redux'
import {getSequencersSchedulerInfo} from '../note-scanner'
import {ECSCanvasRenderSystem} from './ECSCanvasRenderSystem'
import {
	ECSGraphPositionComponent, ECSNodeRendererComponent, ECSSequencerComponent,
} from './ECSComponents'
import {ECSSequencerEntity} from './ECSSequencerEntity'
import {ECSSequencerRenderSystem} from './ECSSequencerRenderSystem'
import {ECSEntity, ECSSystem} from './ECSTypes'

let _store: Store<IClientAppState>
let _systems: List<ECSSystem>
let _entities: List<ECSEntity>

export function getECSLoop(store: Store<IClientAppState>) {
	_store = store

	_systems = List<ECSSystem>([
		new ECSCanvasRenderSystem(),
		new ECSSequencerRenderSystem(),
	])

	_entities = List<ECSEntity>()

	return {
		ecsLoop,
		onSetActiveRoom: () => _systems.forEach(x => x.onSetActiveRoom()),
	}
}

function ecsLoop() {
	const state = _store.getState()
	const roomState = state.room

	if (selectOption(state, AppOptions.graphics_ECS) !== true) return

	// Populate entities
	// TODO Don't do every frame
	_entities = selectAllPositions(roomState)
		.filter(x => isSequencerNodeType(x.targetType) || x.targetType === ConnectionNodeType.groupSequencer)
		.map(x => isSequencerNodeType(x.targetType)
			? selectSequencer(roomState, x.id)
			: selectGroupSequencer(roomState, x.id),
		)
		.map(sequencer => new ECSSequencerEntity(
			new ECSNodeRendererComponent({
				color: 'green',
			}),
			new ECSGraphPositionComponent({
				id: sequencer.id,
				x: 0,
				y: 0,
				height: sequencer.height,
			}),
			new ECSSequencerComponent({
				notesDisplayStartX: sequencer.notesDisplayStartX,
				notesDisplayWidth: sequencer.notesDisplayWidth,
				ratio: getSequencersSchedulerInfo()
					.get(sequencer.id, {loopRatio: 0})
					.loopRatio,
				isPlaying: isSequencerNodeType(sequencer.type)
					? selectSequencerIsPlaying(state.room, sequencer.id)
					: true,
			}),
		))
		.toList()

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
