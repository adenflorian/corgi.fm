import {List, Record, Set} from 'immutable'

export enum ECSComponentType {
	NodeRenderer = 'NodeRenderer',
	GraphPosition = 'GraphPosition',
	GlobalRenderer = 'GlobalRenderer',
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
}

interface ECSComponent {}

const makeNodeRendererComp = Record({
	color: 'green',
})

export class ECSNodeRendererComponent extends makeNodeRendererComp implements ECSComponent {}

const makeGlobalRendererComp = Record({
	color: 'red',
})

export class ECSGlobalRendererComponent extends makeGlobalRendererComp implements ECSComponent {}

const makeGraphPosition = Record({
	id: 'dummy',
	x: 0,
	y: 0,
	height: 0,
})

export class ECSGraphPositionComponent extends makeGraphPosition implements ECSComponent {}
