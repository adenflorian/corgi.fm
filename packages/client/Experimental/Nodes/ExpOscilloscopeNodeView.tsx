import React, {useRef} from 'react'
import {hot} from 'react-hot-loader'
import {CorgiNumberChangedEvent} from '../CorgiEvents'
import {useNumberChangedEvent} from '../hooks/useCorgiEvent'
import {useExpPosition} from '../../react-hooks'
import {useNodeContext} from '../CorgiNode'

interface Props {
	newSampleEvent: CorgiNumberChangedEvent
}

const limit = 256
const dotSize = 1

export const ExpOscilloscopeNodeExtra = hot(module)(React.memo(function _ExpOscilloscopeNodeExtra({
	newSampleEvent,
}: Props) {
	const lastSample = useNumberChangedEvent(newSampleEvent, false)
	const history = useRef<number[]>([])
	history.current.push(lastSample)
	while (history.current.length > limit) {
		history.current.shift()
	}

	return (
		<ExpOscilloscopeNodeExtra2
			samples={history.current}
		/>
	)
}))

interface Props2 {
	readonly samples: readonly number[]
}

export const ExpOscilloscopeNodeExtra2 = (function _ExpOscilloscopeNodeExtra({
	samples,
}: Props2) {
	const nodeContext = useNodeContext()
	const position = useExpPosition(nodeContext.id)

	return (
		<div
			style={{
				display: 'flex',
				justifyContent: 'center',
				width: '100%',
				height: '100%',
				position: 'absolute',
				top: 0,
				left: 0,
			}}
		>
			{/* {history.current.map((sample, i) => {
				return (
					<div
						key={i}
						className="sample"
						style={{
							marginTop: (sample * -100) + 100,
							backgroundColor: 'currentColor',
							width: dotSize,
							height: dotSize,
							borderRadius: dotSize / 2,
						}}
					/>
				)
			})} */}
			<svg
				style={{
					width: '100%',
					height: '100%',
					overflow: 'visible',
				}}
			>
				<polyline
					points={
						samples
							.reduce((result, sample, i) => result + `${(i / (limit - 1)) * (position.width)} ${(sample * -position.height * 0.45) + position.height / 2}, `, '')
							.replace(/, $/, '')
					}
					stroke="currentColor"
					fill="none"
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={position.width / 400}
				/>
			</svg>
		</div>
	)
})
