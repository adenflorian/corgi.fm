import {Map, Set} from 'immutable'
import {CssColor} from '../../common/shamu-color'
import {ECSCanvasRenderSystem} from './ECSCanvasRenderSystem'
import {ECSComponentType, ECSEntity, ECSSystem} from './ECSTypes'

export class ECSSequencerRenderSystem implements ECSSystem {
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
		const sequencerComp = entity.getSequencerComponent()!
		canvasContext.fillRect(
			sequencerComp.notesDisplayStartX + (sequencerComp.notesDisplayWidth * sequencerComp.ratio),
			0,
			1,
			graphPosition.height,
		)
	}

	public onBatchEnd() {}

	private _getContextForNodeId(nodeId: string) {
		const canvasContext = this._canvasContexts.get(nodeId)

		if (canvasContext) return canvasContext

		const canvasElement = document.getElementById(ECSSequencerRenderSystem.canvasIdPrefix + nodeId) as HTMLCanvasElement

		if (canvasElement) {
			const context = canvasElement.getContext('2d')!
			this._canvasContexts = this._canvasContexts.set(nodeId, context)
			return context
		}

		return null
	}
}
