import {List, Map, Record, Set} from 'immutable'
import {Store} from 'redux'
import {IClientAppState, selectAllPositions} from '../../common/redux'
import {CssColor} from '../../common/shamu-color'

let _store: Store<IClientAppState>

enum ECSComponentType {
	NodeRenderer = 'NodeRenderer',
	GraphPosition = 'GraphPosition',
	GlobalRenderer = 'GlobalRenderer',
}

interface ECSSystem {
	getRequiredComponents(): Set<ECSComponentType>
	onBatchStart(): void
	execute(entity: ECSEntity): void
	onBatchEnd(): void
}

export class ECSCanvasRenderSystem implements ECSSystem {
	public static canvasSize = 2048

	private _canvasContext: CanvasRenderingContext2D | undefined

	public getRequiredComponents(): Set<ECSComponentType> {
		return Set([
			ECSComponentType.GlobalRenderer,
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
		this._canvasContext.fillStyle = entity.getGlobalRendererComponent()!.color
		this._canvasContext.fillRect(
			100 + (ECSCanvasRenderSystem.canvasSize / 2),
			100 + (ECSCanvasRenderSystem.canvasSize / 2),
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

export class ECSGraphNodeRenderSystem implements ECSSystem {
	public static readonly canvasIdPrefix = 'ECSCanvasRenderSystemCanvas-node-'

	private _canvasContexts = Map<string, CanvasRenderingContext2D>()

	public getRequiredComponents(): Set<ECSComponentType> {
		return Set([
			ECSComponentType.NodeRenderer,
			ECSComponentType.GraphPosition,
		])
	}

	public onBatchStart() {}

	public execute(entity: ECSEntity): void {
		const nodeId = entity.getGraphPositionComponent()!.id

		const canvasContext = this._getContextForNodeId(nodeId)

		if (!canvasContext) return

		canvasContext.clearRect(0, 0, ECSCanvasRenderSystem.canvasSize, ECSCanvasRenderSystem.canvasSize)

		canvasContext.fillStyle = CssColor.defaultGray
		const graphPosition = entity.getGraphPositionComponent()!
		canvasContext.fillRect(
			graphPosition.x,
			0,
			1,
			graphPosition.height,
		)
	}

	public onBatchEnd() {}

	private _getContextForNodeId(nodeId: string) {
		const canvasContext = this._canvasContexts.get(nodeId)

		if (canvasContext) return canvasContext

		const canvasElement = document.getElementById(ECSGraphNodeRenderSystem.canvasIdPrefix + nodeId) as HTMLCanvasElement

		if (canvasElement) {
			const context = canvasElement.getContext('2d')!
			this._canvasContexts = this._canvasContexts.set(nodeId, context)
			return context
		}

		return null
	}
}

abstract class ECSEntity {
	public abstract getComponents(): List<ECSComponentType>
	public getNodeRendererComponent(): ECSNodeRendererComponent | undefined {return undefined}
	public getGlobalRendererComponent(): ECSNodeRendererComponent | undefined {return undefined}
	public getGraphPositionComponent(): ECSGraphPositionComponent | undefined {return undefined}
}

class ECSSimpleGraphNodeEntity extends ECSEntity {
	constructor(
		private readonly _rendererComponent: ECSNodeRendererComponent,
		private readonly _graphPositionComponent: ECSGraphPositionComponent,
	) {
		super()
	}

	public getComponents(): List<ECSComponentType> {
		return List([
			ECSComponentType.NodeRenderer,
			ECSComponentType.GraphPosition,
		])
	}

	public getNodeRendererComponent(): ECSNodeRendererComponent | undefined {
		return this._rendererComponent
	}

	public getGraphPositionComponent(): ECSGraphPositionComponent | undefined {
		return this._graphPositionComponent
	}
}

interface ECSComponent {}

const makeNodeRendererComp = Record({
	color: 'green',
})

class ECSNodeRendererComponent extends makeNodeRendererComp implements ECSComponent {}

const makeGlobalRendererComp = Record({
	color: 'red',
})

class ECSGlobalRendererComponent extends makeGlobalRendererComp implements ECSComponent {}

const makeGraphPosition = Record({
	id: 'dummy',
	x: 0,
	y: 0,
	height: 0,
})

class ECSGraphPositionComponent extends makeGraphPosition implements ECSComponent {}

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
