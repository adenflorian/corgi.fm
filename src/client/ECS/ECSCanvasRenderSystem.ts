import {List, Set} from 'immutable'
import {ECSComponentType, ECSEntity, ECSSystem} from './ECSTypes'

export class ECSCanvasRenderSystem implements ECSSystem {
	public static canvasSize = 2048

	private _canvasContext: CanvasRenderingContext2D | undefined

	public getRequiredComponents(): Set<ECSComponentType> {
		return Set([
			ECSComponentType.GlobalRenderer,
		])
	}

	public execute(entities: List<ECSEntity>): void {
		if (entities.count() === 0) return

		if (!this._canvasContext) {
			this._updateContext()
		}

		if (!this._canvasContext) return

		this._canvasContext.clearRect(0, 0, ECSCanvasRenderSystem.canvasSize, ECSCanvasRenderSystem.canvasSize)

		entities.forEach(this._processEntity)
	}

	private _processEntity(entity: ECSEntity) {
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

	private _updateContext() {
		const canvasElement = document.getElementById('ECSCanvasRenderSystemCanvas') as HTMLCanvasElement
		if (canvasElement) {
			this._canvasContext = canvasElement.getContext('2d')!
		}
	}
}
