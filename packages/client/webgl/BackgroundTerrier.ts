import * as Immutable from 'immutable'
import {ObjectInfo, getVerticesForRect, UniformUpdater} from './WebGlEngine';
import {passthroughVertexShader, backgroundFragmentShader} from '../glsl/shaders';
import {simpleGlobalClientState} from '../SimpleGlobalClientState';
import {IClientAppState} from '@corgifm/common/redux';
import {Terrier} from './Terrier';

const backgroundVertexPositions = [
	...getVerticesForRect(-1, 1, 2, 2),
]

export class BackgroundTerrier extends Terrier {
	public draw(state: IClientAppState) {
		if (!this._renderPass) return
		this._engine.drawPass(this._renderPass)
	}

	protected _createObjectInfo(): ObjectInfo {
		const {gl} = this._engine

		return {
			vertexPositions: backgroundVertexPositions,
			vertexCount: backgroundVertexPositions.length / 2,
			vertexShader: passthroughVertexShader,
			fragmentShader: backgroundFragmentShader,
			uniformValues: Immutable.Map<UniformUpdater>({
				uMouse: location => gl.uniform2f(location,
					simpleGlobalClientState.lastMousePosition.x, simpleGlobalClientState.lastMousePosition.y),
				uTime: location => gl.uniform1f(location,
					this._engine.current()),
				uZoom: location => gl.uniform1f(location,
					simpleGlobalClientState.zoom),
				uPan: location => gl.uniform2f(location,
					simpleGlobalClientState.pan.x, simpleGlobalClientState.pan.y),
				uResolution: location => gl.uniform2f(location,
					this._canvas.clientWidth, this._canvas.clientHeight),
			}),
			writeToDepthBuffer: false,
		}
	}
}