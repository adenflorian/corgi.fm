import React, {useRef, useLayoutEffect, useMemo} from 'react'
import {useNodeContext} from '../../CorgiNode'
import {ExpBetterSequencerNode} from './ExpBetterSequencerNode'
import {CssColor} from '@corgifm/common/shamu-color'
import {simpleGlobalClientState} from '../../../SimpleGlobalClientState'
import {clamp} from '@corgifm/common/common-utils'

interface Props {
	readonly visibleHeight: number
	readonly visibleWidth: number
	readonly columnWidth: number
	readonly panPixelsX: number
}

const barWidth = 1

export const ExpBetterTimeMarker = ({
	visibleHeight, visibleWidth, columnWidth, panPixelsX,
}: Props) => {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const nodeContext = useNodeContext() as ExpBetterSequencerNode
	const info = useRef({visibleHeight, visibleWidth, columnWidth, panPixelsX})
	info.current = {visibleHeight, visibleWidth, columnWidth, panPixelsX}

	useLayoutEffect(() => {
		let stop = false

		requestAnimationFrame(animate)

		function animate() {
			const {visibleHeight, visibleWidth, columnWidth, panPixelsX} = info.current

			if (stop) return

			const canvas = canvasRef.current!
			const context = canvas.getContext('2d', {alpha: true})!

			context.clearRect(0, 0, visibleWidth + 2, visibleHeight + 2)
			context.fillStyle = CssColor.defaultGray
			context.fillRect(
				(nodeContext.currentClipPositionBeats * columnWidth) - panPixelsX,
				// 2,
				0,
				clamp(barWidth / simpleGlobalClientState.zoom, 1, 99),
				visibleHeight
			)

			requestAnimationFrame(animate)
		}

		return () => {
			stop = true
		}
	}, [])

	return (
		<div
			className="expBetterTimeMarker"
			style={{
				position: 'absolute',
				top: 0,
				pointerEvents: 'none',
			}}
		>
			{useMemo(() =>
				<canvas
					ref={canvasRef}
					width={visibleWidth + 2}
					height={visibleHeight + 2}
					style={{
						marginTop: -1,
						marginLeft: -1,
						// imageRendering: 'pixelated',
					}}
				/>
				, [visibleWidth, visibleHeight]
			)}
		</div>
	)
}