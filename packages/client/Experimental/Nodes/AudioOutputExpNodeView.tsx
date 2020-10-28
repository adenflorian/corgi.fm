import React, {useLayoutEffect, useRef} from 'react'
import {hot} from 'react-hot-loader'
import {useNodeContext} from '../CorgiNode'
import {CssColor} from '@corgifm/common/shamu-color'
import {AudioOutputExpNode} from './AudioOutputExpNode'
import {stripIndents} from 'common-tags'
import {limiterRenderSystemConstants} from '../../client-constants'

export function getExpAudioOutputView() {
	return <ExpAudioOutputView />
}

interface Props {
}

const {width, height} = limiterRenderSystemConstants
const maxReduction = 10
// const warningThreshold = 2
const maxReductionFirstBar = maxReduction / 2
const maxFirstBarHeight = height / 2
const maxSecondBarHeight = maxFirstBarHeight

export const ExpAudioOutputView = hot(module)(React.memo(function _ExpAudioOutputView({
}: Props) {
	const nodeContext = useNodeContext() as AudioOutputExpNode
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const valueElementRef = useRef<HTMLSpanElement>(null)

	useLayoutEffect(() => {
		let stop = false

		requestAnimationFrame(animate)

		function animate() {
			if (stop) return

			const canvas = canvasRef.current!
			const context = canvas.getContext('2d', {alpha: true})!

			context.fillStyle = CssColor.panelGrayLight

			context.fillRect(0, 0, width, height)

			context.fillStyle = CssColor.orange

			const limiter = nodeContext.singletonContext.getMasterLimiter()!

			const reduction = limiter
				? -limiter.reduction
				: 0

			context.fillRect(
				0,
				0,
				width,
				Math.min(maxFirstBarHeight, (reduction / maxReductionFirstBar) * maxFirstBarHeight),
			)

			const reductionPastWarning = reduction - maxReductionFirstBar

			if (reductionPastWarning > 0) {
				context.fillStyle = CssColor.red

				context.fillRect(
					0,
					maxFirstBarHeight,
					width,
					Math.min(maxSecondBarHeight, (reductionPastWarning / maxReductionFirstBar) * maxSecondBarHeight),
				)
			}

			const valueElement = valueElementRef.current!

			const reductionValueString = (-reduction).toFixed(1)

			if (valueElement.textContent !== reductionValueString) {
				valueElement.textContent = reductionValueString.replace(/-0.0/, '0.0')
			}

			requestAnimationFrame(animate)
		}

		return () => {
			stop = true
		}
	}, [])

	return (
		<div>
			<div
				className="limiterDisplay knob"
				style={{
					width: 64,
					height: 88,
					justifyContent: 'end',
					margin: 'auto',
				}}
				title={stripIndents`Show how much the master limiter is reducing the audio
						Usually you don't want to see any red`}
			>
				<div className="knobLabel">Limiter</div>
				<canvas
					ref={canvasRef}
					width={width}
					height={height}
					style={{
						marginTop: 6,
					}}
				/>
				<div className="value knobValue" style={{bottom: -2}}>
					<span ref={valueElementRef} >0.0</span>
					<span> dB</span>
				</div>
			</div>
		</div>
	)
}))
