import {List} from 'immutable'
import {ECSGraphPositionComponent, ECSLimiterComponent} from './ECSComponents'
import {ECSComponentType, ECSEntity} from './ECSTypes'

export class ECSAudioOutputEntity extends ECSEntity {
	public constructor(
		private readonly _graphPositionComponent: ECSGraphPositionComponent,
		private readonly _audioOutputComponent: ECSLimiterComponent,
	) {
		super()
	}

	public getComponents(): List<ECSComponentType> {
		return List([
			ECSComponentType.GraphPosition,
			ECSComponentType.AudioOutput,
		])
	}

	public getGraphPositionComponent(): ECSGraphPositionComponent | undefined {
		return this._graphPositionComponent
	}

	public getAudioOutputComponent(): ECSLimiterComponent | undefined {
		return this._audioOutputComponent
	}
}
