import React, {useMemo} from 'react'
import {hot} from 'react-hot-loader'
import {useNumberChangedEvent, useObjectChangedEvent} from '../hooks/useCorgiEvent'
import {useExpPosition} from '../../react-hooks'
import {useNodeContext} from '../CorgiNode'
import {CssColor} from '@corgifm/common/shamu-color'
import {SamplerExpNode} from './ExpSamplerNode'
import {clamp} from '@corgifm/common/common-utils'

export function getExpSamplerNodeView() {
	return <ExpSamplerNodeView />
}

interface Props {
}

const limit = 512
const dotSize = 1
const svgHeight = 200

function sample(buffer: Float32Array, samples: number, start: number, end: number) {
	const startSample = Math.floor(buffer.length * start)
	const endSample = Math.floor(buffer.length * end)
	const bufferSectionLength = endSample - startSample
	// const result = new Array(Math.round(samples))

	// for (let i = 0; i < samples; i++) {
	// 	const n = Math.round((buffer.length / samples) * i)
	// 	const n2 = clamp(Math.round((buffer.length / samples) * (i + 1)), 0, buffer.length)
	// 	const sectionLength = n2 - n
	// 	let sum = 0
	// 	for (let j = n; j < n2; j++) {
	// 		sum += Math.abs(buffer[j])
	// 	}
	// 	const avg = sum / sectionLength
	// 	result[i] = avg
	// }

	// for (let i = 0; i < samples; i++) {
	// 	const n = Math.round((buffer.length / samples) * i)
	// 	const n2 = clamp(Math.round((buffer.length / samples) * (i + 1)), 0, buffer.length)
	// 	const sectionLength = n2 - n
	// 	let maxAbs = 0
	// 	let maxActual = 0
	// 	for (let j = n; j < n2; j++) {
	// 		const sample = buffer[j]
	// 		if (Math.abs(sample) > maxAbs) {
	// 			maxAbs = Math.abs(sample)
	// 			maxActual = sample
	// 		}
	// 	}
	// 	result[i] = maxActual
	// }

	// let flag = false

	// for (let i = 0; i < samples; i++) {
	// 	const n = Math.round((buffer.length / samples) * i)
	// 	const n2 = clamp(Math.round((buffer.length / samples) * (i + 1)), 0, buffer.length)
	// 	let maxActual = 0
	// 	for (let j = n; j < n2; j++) {
	// 		const sample = buffer[j]
	// 		if (flag) {
	// 			if (sample > maxActual) {
	// 				maxActual = sample
	// 			}
	// 		} else {
	// 			if (sample < maxActual) {
	// 				maxActual = sample
	// 			}
	// 		}
	// 		flag = !flag
	// 	}
	// 	result[i] = maxActual
	// }

	const result = new Array(Math.round(samples * 2))

	for (let i = 0; i < samples; i += 2) {
		const n = Math.round((bufferSectionLength / samples) * i) + startSample
		const n2 = clamp(Math.round(((bufferSectionLength / samples) * (i + 1)) + startSample), 0, bufferSectionLength + startSample)
		let min = 1
		let max = -1
		for (let j = n; j < n2; j++) {
			const sample = buffer[j]
			if (sample < min) {
				min = sample
			}
			if (sample > max) {
				max = sample
			}
		}
		result[i] = min
		result[i + 1] = max
	}

	return result
}

export const ExpSamplerNodeView = hot(module)(React.memo(function _ExpSamplerNodeView({
}: Props) {
	const nodeContext = useNodeContext() as SamplerExpNode
	const position = useExpPosition(nodeContext.id)
	const buffer = useObjectChangedEvent(nodeContext.bufferData)
	const start = useNumberChangedEvent(nodeContext.loopStart.onChange)
	const end = useNumberChangedEvent(nodeContext.loopEnd.onChange)

	// console.log({beatCursor, eventsBeatLength, eventsWidth, innerBeatCursor, innerBeatCursor2})

	// const points = useMemo(() => {
	// 	const sampled = sample(buffer, position.width)
	// 	console.log(sampled)
	// 	return sampled
	// 		.reduce((result, sample, i) =>
	// 			result +
	// 			`
	// 					${(i / (sampled.length - 1)) * (position.width)}${' '}
	// 					${((((clamp(sample, -1, 1) + 1) / 2) * -svgHeight) + svgHeight)}
	// 				, `, '')
	// 		.replace(/, $/, '')
	// }, [position.width, buffer])

	const points = useMemo(() => {
		const sampled = sample(buffer, position.width, start / 60, end / 60)
		// console.log(sampled)
		return sampled
			.reduce((result, sample, i) =>
				result +
				`
					${(Math.floor(i / 2) / ((sampled.length / 4) - 1)) * (position.width)}${' '}
					${((((clamp(sample, -1, 1) + 1) / 2) * -svgHeight) + svgHeight)}
				, `, '')
			.replace(/, $/, '')
	}, [position.width, buffer, start, end])

	return (
		<div
			style={{
				// color: CssColor.defaultGray,
				fontSize: 14,
				fontFamily: 'Ubuntu',
			}}
		>
			<svg
				style={{
					width: '100%',
					height: svgHeight + 'px',
					overflow: 'visible',
				}}
			>
				{/* <defs>
					<linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
						<stop offset="0%" style={{stopColor: 'hsl(0,0,100)', stopOpacity: 1}} />
						<stop offset="100%" style={{stopColor: 'hsl(0,0,0)', stopOpacity: 1}} />
					</linearGradient>
				</defs> */}
				<polyline
					// fill="url(#grad1)"
					points={points}
					// points="0 0, 1 1, 2 2, 10 10, 20 20, 30 30"
					stroke={'currentcolor'}
					opacity={1}
					fill={'none'}
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
				/>
			</svg>
		</div>
	)
}))
