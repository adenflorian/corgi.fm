import {List, Record} from 'immutable'
import {Store} from 'redux'
import {IClientAppState, selectAllPositions} from '../../common/redux'

let _store: Store<IClientAppState>

enum ECSComponentType {
	Renderer,
	GraphPosition,
}

interface ECSSystem {
	getRequiredComponents(): List<ECSComponentType>
	onBatchStart(): void
	execute(entity: ECSEntity): void
	onBatchEnd(): void
}

export class ECSCanvasRenderSystem implements ECSSystem {
	public static canvasSize = 2048

	private _canvasContext: CanvasRenderingContext2D | undefined

	public getRequiredComponents(): List<ECSComponentType> {
		return List([
			ECSComponentType.Renderer,
			ECSComponentType.GraphPosition,
		])
	}

	public onBatchStart() {
		if (!this._canvasContext) {
			this._updateContext()
		}
		if (!this._canvasContext) return
		this._canvasContext.clearRect(0, 0, ECSCanvasRenderSystem.canvasSize, ECSCanvasRenderSystem.canvasSize)
	}

	public execute(entity: ECSEntity): void {
		if (!this._canvasContext) return

		// this._canvasContext.fillStyle = 'green'
		// this._canvasContext.fillRect(10, 10, 150, 100)
		this._canvasContext.fillStyle = entity.getRendererComponent()!.color
		this._canvasContext.fillRect(
			entity.getGraphPositionComponent()!.x + (ECSCanvasRenderSystem.canvasSize / 2),
			entity.getGraphPositionComponent()!.y + (ECSCanvasRenderSystem.canvasSize / 2),
			100,
			100,
		)
	}

	public onBatchEnd() {

	}

	private _updateContext() {
		const canvasElement = document.getElementById('ECSCanvasRenderSystemCanvas') as HTMLCanvasElement
		if (canvasElement) {
			this._canvasContext = canvasElement.getContext('2d')!
		}
	}
}

abstract class ECSEntity {
	public abstract getComponents(): List<ECSComponentType>
	public getRendererComponent(): ECSRendererComponent | undefined {return undefined}
	public getGraphPositionComponent(): ECSGraphPositionComponent | undefined {return undefined}
}

class ECSSimpleGraphNodeEntity extends ECSEntity {
	constructor(
		private readonly _rendererComponent: ECSRendererComponent,
		private readonly _graphPositionComponent: ECSGraphPositionComponent,
	) {
		super()
	}

	public getComponents(): List<ECSComponentType> {
		return List([
			ECSComponentType.Renderer,
			ECSComponentType.GraphPosition,
		])
	}

	public getRendererComponent(): ECSRendererComponent | undefined {
		return this._rendererComponent
	}

	public getGraphPositionComponent(): ECSGraphPositionComponent | undefined {
		return this._graphPositionComponent
	}
}

interface ECSComponent {}

const makeRendererComp = Record({
	color: 'red',
})

class ECSRendererComponent extends makeRendererComp implements ECSComponent {

}

const makeGraphPosition = Record({
	x: 0,
	y: 0,
})

class ECSGraphPositionComponent extends makeGraphPosition implements ECSComponent {
}

let _systems = List<ECSSystem>()
let _entities = List<ECSEntity>()

_systems = _systems.push(new ECSCanvasRenderSystem())

_entities = List([new ECSSimpleGraphNodeEntity(
	new ECSRendererComponent({color: 'red'}),
	new ECSGraphPositionComponent({x: 200, y: 900}),
)])

// Need to add and remove entities based on shamu graph state

export function getECSLoop(store: Store<IClientAppState>) {
	_store = store

	return ecsLoop
}

function ecsLoop() {

	_entities = selectAllPositions(_store.getState().room)
		.map(position => new ECSSimpleGraphNodeEntity(
			new ECSRendererComponent({color: 'red'}),
			new ECSGraphPositionComponent({x: (Math.sin(Date.now() / 1000) * 100) + position.x, y: position.y}),
		)).toList()

	// _entities = List([new ECSSimpleGraphNodeEntity(
	// 	new ECSRendererComponent({color: 'red'}),
	// 	new ECSGraphPositionComponent({x: (Math.sin(Date.now() / 1000) * 100) + 200, y: 900}),
	// )])

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
