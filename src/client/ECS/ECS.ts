import {List} from 'immutable'
import {Store} from 'redux'
import {IClientAppState, selectAllPositions} from '../../common/redux'
import {ECSCanvasRenderSystem} from './ECSCanvasRenderSystem'
import {ECSGraphNodeRenderSystem} from './ECSGraphNodeRenderSystem'
import {ECSSimpleGraphNodeEntity} from './ECSSimpleGraphNodeEntity'
import {ECSEntity, ECSGraphPositionComponent, ECSNodeRendererComponent, ECSSystem} from './ECSTypes'

let _store: Store<IClientAppState>

let _systems = List<ECSSystem>()
let _entities = List<ECSEntity>()

_systems = _systems.concat([
	new ECSCanvasRenderSystem(),
	new ECSGraphNodeRenderSystem(),
])

export function getECSLoop(store: Store<IClientAppState>) {
	_store = store

	return ecsLoop
}

function ecsLoop() {

	_entities = selectAllPositions(_store.getState().room)
		.map(position => new ECSSimpleGraphNodeEntity(
			new ECSNodeRendererComponent({color: 'green'}),
			new ECSGraphPositionComponent({
				id: position.id,
				x: (((Date.now() / 1000) % 1) * 100),
				y: 0,
				height: position.height,
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
