import {RenderPass, ObjectInfo, WebGlEngine} from './WebGlEngine';
import {logger} from '../client-logger';
import {IClientAppState} from '@corgifm/common/redux';
import {SingletonContextImpl} from '../SingletonContext';

export abstract class Terrier {
	protected readonly _renderPass: RenderPass | null = null

	public constructor(
		protected readonly _engine: WebGlEngine,
		protected readonly _canvas: HTMLCanvasElement,
		protected readonly _singletonContext: SingletonContextImpl,
	) {
		const objectInfo = this._createObjectInfo()
		this._renderPass = this._engine.createPass(objectInfo)
		logger.warn('render pass null', {engine: this._engine, objectInfo})
	}

	public abstract draw(state: IClientAppState): void

	protected abstract _createObjectInfo(): ObjectInfo
}