import {List} from 'immutable'
import {ECSGraphPositionComponent, ECSSequencerComponent} from './ECSComponents'
import {ECSComponentType, ECSEntity} from './ECSTypes'

export class ECSSequencerEntity extends ECSEntity {
	public constructor(
		private readonly _graphPositionComponent: ECSGraphPositionComponent,
		private readonly _sequencerComponent: ECSSequencerComponent,
	) {
		super()
	}

	public getComponents(): List<ECSComponentType> {
		return List([
			ECSComponentType.NodeRenderer,
			ECSComponentType.GraphPosition,
			ECSComponentType.Sequencer,
		])
	}

	public getGraphPositionComponent(): ECSGraphPositionComponent | undefined {
		return this._graphPositionComponent
	}

	public getSequencerComponent(): ECSSequencerComponent | undefined {
		return this._sequencerComponent
	}
}
