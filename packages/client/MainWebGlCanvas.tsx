import React, {useRef, useEffect} from 'react'
import {hot} from 'react-hot-loader'
import {WebGlEngine} from './webgl/WebGlEngine'
import {logger} from './client-logger'
import {IClientAppState} from '@corgifm/common/redux'
import {useStore} from 'react-redux'
import {useSingletonContext} from './SingletonContext'
import {BackgroundTerrier} from './webgl/BackgroundTerrier'
import {NodesTerrier} from './webgl/NodesTerrier'
import {ConnectionsTerrier} from './webgl/ConnectionsTerrier'

export const MainWebGlCanvas = hot(module)(React.memo(function _MainWebGlCanvas() {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const store = useStore<IClientAppState>()
	const singletonContext = useSingletonContext()

	useEffect(() => {
		const canvas = canvasRef.current

		if (!canvas) return

		let engine: WebGlEngine

		try {
			engine = new WebGlEngine(canvas)
		} catch (error) {
			return logger.error(`[MainWebGlCanvas] ${error}`)
		}

		const backgroundTerrier = new BackgroundTerrier(engine, canvas, singletonContext)

		const nodesTerrier = new NodesTerrier(engine, canvas, singletonContext)

		const connectionsTerrier = new ConnectionsTerrier(engine, canvas, singletonContext)

		let stop = false

		requestAnimationFrame(mainLoop)

		function mainLoop(time: number) {
			try {
				if (stop || !canvasRef.current) return

				engine.newFramePass(canvasRef.current, canvasRef.current.clientWidth, canvasRef.current.clientHeight)

				const state = store.getState()
				backgroundTerrier.draw(state)
				// connectionsTerrier.draw(state)
				// nodesTerrier.draw(state)

				requestAnimationFrame(mainLoop)
			} catch (error) {
				logger.error('error in [MainWebGlCanvas] mainLoop: ', error)
			}
		}

		return () => {
			stop = true
		}
	}, [])

	return (
		<div
			className="mainWebGlCanvas"
			style={{
				width: '100vw',
				height: '100vh',
				position: 'fixed',
				top: 0,
				left: 0,
			}}
		>
			<canvas
				ref={canvasRef}
				style={{
					width: '100%',
					height: '100%',
				}}
			/>
		</div>
	)
}))
