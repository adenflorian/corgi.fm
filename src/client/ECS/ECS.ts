import {List} from 'immutable'
import {Store} from 'redux'
import {isSequencerNodeType} from '../../common/common-types'
import {
	AppOptions, IClientAppState, selectAllPositions, selectOption, selectSequencer,
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

let _systems = List<ECSSystem>()
let _entities = List<ECSEntity>()

_systems = _systems.concat([
	new ECSCanvasRenderSystem(),
	new ECSSequencerRenderSystem(),
])

export function getECSLoop(store: Store<IClientAppState>) {
	_store = store

	return ecsLoop
}

function ecsLoop() {
	const state = _store.getState()
	const roomState = state.room

	if (selectOption(state, AppOptions.enableEfficientMode)) return

	// Populate entities
	// TODO Don't do every frame
	_entities = selectAllPositions(roomState)
		.filter(x => isSequencerNodeType(x.targetType))
		.map(x => selectSequencer(roomState, x.id))
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
				isPlaying: sequencer.isPlaying,
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
