import {List, Set} from 'immutable'
import {ECSGraphPositionComponent, ECSNodeRendererComponent, ECSSequencerComponent} from './ECSComponents'

export enum ECSComponentType {
	NodeRenderer = 'NodeRenderer',
	GraphPosition = 'GraphPosition',
	GlobalRenderer = 'GlobalRenderer',
	Sequencer = 'Sequencer',
}

export interface ECSSystem {
	getRequiredComponents(): Set<ECSComponentType>
	onBatchStart(): void
	execute(entity: ECSEntity): void
	onBatchEnd(): void
}

export abstract class ECSEntity {
	public abstract getComponents(): List<ECSComponentType>
	public getNodeRendererComponent(): ECSNodeRendererComponent | undefined {return undefined}
	public getGlobalRendererComponent(): ECSNodeRendererComponent | undefined {return undefined}
	public getGraphPositionComponent(): ECSGraphPositionComponent | undefined {return undefined}
	public getSequencerComponent(): ECSSequencerComponent | undefined {return undefined}
}
