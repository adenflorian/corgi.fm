import {List, Map, Set} from 'immutable'
import {CssColor} from '@corgifm/common/shamu-color'
import {limiterRenderSystemConstants} from '../client-constants'
import {ECSComponentType, ECSEntity, ECSSystem} from './ECSTypes'

const {width, height} = limiterRenderSystemConstants
const maxReduction = 10
const warningThreshold = 2
const maxReductionFirstBar = maxReduction / 2
const maxFirstBarHeight = height / 2
const maxSecondBarHeight = maxFirstBarHeight

export class ECSLimiterRenderSystem extends ECSSystem {
	private _canvasContexts = Map<string, CanvasRenderingContext2D>()
	private _valueElements = Map<string, HTMLDivElement>()

	public getRequiredComponents(): Set<ECSComponentType> {
		return Set([
			ECSComponentType.GraphPosition,
			ECSComponentType.AudioOutput,
		])
	}

	public onSetActiveRoom = () => {
		this._canvasContexts = this._canvasContexts.clear()
		this._valueElements = this._valueElements.clear()
	}

	public execute(entities: List<ECSEntity>): void {
		entities.forEach(this.processEntity)
	}

	private readonly processEntity = (entity: ECSEntity) => {
		const {canvasId, valueId, limiter} = entity.getAudioOutputComponent()!

		const canvasContext = this._getContextForNodeId(canvasId)

		if (!canvasContext) return

		canvasContext.fillStyle = CssColor.panelGrayLight

		canvasContext.fillRect(0, 0, width, height)

		canvasContext.fillStyle = CssColor.orange

		const reduction = limiter
			? -limiter.reduction
			: 0

		canvasContext.fillRect(
			0,
			0,
			width,
			Math.min(maxFirstBarHeight, (reduction / maxReductionFirstBar) * maxFirstBarHeight),
		)

		const reductionPastWarning = reduction - maxReductionFirstBar

		if (reductionPastWarning > 0) {
			canvasContext.fillStyle = CssColor.red

			canvasContext.fillRect(
				0,
				maxFirstBarHeight,
				width,
				Math.min(maxSecondBarHeight, (reductionPastWarning / maxReductionFirstBar) * maxSecondBarHeight),
			)
		}

		const valueElement = this._getValueElement(valueId)

		if (!valueElement) return

		const reductionValueString = (-reduction).toFixed(1)

		if (valueElement.textContent === reductionValueString) return

		valueElement.textContent = reductionValueString.replace(/-0.0/, '0.0')
	}

	private _getContextForNodeId(canvasId: string) {
		const canvasContext = this._canvasContexts.get(canvasId)

		if (canvasContext) return canvasContext

		const canvasElement = document.getElementById(canvasId) as HTMLCanvasElement

		if (canvasElement) {
			const context = canvasElement.getContext('2d')!
			this._canvasContexts = this._canvasContexts.set(canvasId, context)
			return context
		}

		return null
	}

	private _getValueElement(valueId: string) {
		let valueElement = this._valueElements.get(valueId)

		if (valueElement) return valueElement

		valueElement = document.getElementById(valueId) as HTMLDivElement

		if (valueElement) {
			this._valueElements = this._valueElements.set(valueId, valueElement)
			return valueElement
		}

		return null
	}
}
