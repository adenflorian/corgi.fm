import {Record} from 'immutable'

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
	id: 'dummy' as Id,
	x: 0,
	y: 0,
	height: 0,
})
export class ECSGraphPositionComponent extends makeGraphPosition implements ECSComponent {}

const makeSequencerComp = Record({
	notesDisplayStartX: 0,
	notesDisplayWidth: 0,
	ratio: 0,
	isPlaying: false,
})
export class ECSSequencerComponent extends makeSequencerComp implements ECSComponent {}

const makeLimiterComp = Record({
	limiter: null as DynamicsCompressorNode | null,
	canvasId: '',
	valueId: '',
})
export class ECSLimiterComponent extends makeLimiterComp implements ECSComponent {}
