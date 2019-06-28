import {List} from 'immutable'
import {ECSAudioOutputComponent, ECSGraphPositionComponent} from './ECSComponents'
import {ECSComponentType, ECSEntity} from './ECSTypes'

export class ECSAudioOutputEntity extends ECSEntity {
	constructor(
		private readonly _graphPositionComponent: ECSGraphPositionComponent,
		private readonly _audioOutputComponent: ECSAudioOutputComponent,
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

	public getAudioOutputComponent(): ECSAudioOutputComponent | undefined {
		return this._audioOutputComponent
	}
}
