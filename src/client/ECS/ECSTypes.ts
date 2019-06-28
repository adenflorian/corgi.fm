import {List, Set} from 'immutable'
import {
	ECSGraphPositionComponent, ECSLimiterComponent,
	ECSNodeRendererComponent, ECSSequencerComponent,
} from './ECSComponents'

export enum ECSComponentType {
	NodeRenderer = 'NodeRenderer',
	GraphPosition = 'GraphPosition',
	GlobalRenderer = 'GlobalRenderer',
	Sequencer = 'Sequencer',
	AudioOutput = 'AudioOutput',
}

export abstract class ECSSystem {
	public abstract getRequiredComponents(): Set<ECSComponentType>
	public abstract execute(entities: List<ECSEntity>): void
	public onSetActiveRoom = () => {}
}

export abstract class ECSEntity {
	public abstract getComponents(): List<ECSComponentType>
	public getNodeRendererComponent(): ECSNodeRendererComponent | undefined {return undefined}
	public getGlobalRendererComponent(): ECSNodeRendererComponent | undefined {return undefined}
	public getGraphPositionComponent(): ECSGraphPositionComponent | undefined {return undefined}
	public getSequencerComponent(): ECSSequencerComponent | undefined {return undefined}
	public getAudioOutputComponent(): ECSLimiterComponent | undefined {return undefined}
}
