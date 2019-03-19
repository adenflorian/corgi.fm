import {ECSComponentType, ECSEntity, ECSGraphPositionComponent, ECSNodeRendererComponent} from './ECSTypes'

import {List} from 'immutable'

export class ECSSimpleGraphNodeEntity extends ECSEntity {
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
