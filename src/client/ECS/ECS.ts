import {List} from 'immutable'
import {Store} from 'redux'
import {ConnectionNodeType, isSequencerNodeType} from '../../common/common-types'
import {IClientAppState, selectAllPositions, selectAllSequencers, selectSequencer} from '../../common/redux'
import {ECSCanvasRenderSystem} from './ECSCanvasRenderSystem'
import {ECSGraphPositionComponent, ECSNodeRendererComponent, ECSSequencerComponent} from './ECSComponents'
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
	const roomState = _store.getState().room

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
				ratio: ((performance.now() / 5000) % 1),
				isPlaying: sequencer.isPlaying,
			}),
		))
		.toList()

	// iterate through components, pass them to systems
	_systems.forEach(system => {
		system.onBatchStart()
		_entities.filter(x => entityHasComponentsRequiredBySystem(x, system))
			.forEach(entity => {
				system.execute(entity)
			})
	})
}

function entityHasComponentsRequiredBySystem(entity: ECSEntity, system: ECSSystem) {
	return !system.getRequiredComponents().some(reqComp => {
		return !entity.getComponents().includes(reqComp)
	})
}
