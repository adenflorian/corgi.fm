import React, {useRef} from 'react'
import {hot} from 'react-hot-loader'
import {CorgiNumberChangedEvent} from '../CorgiEvents'
import {useNumberChangedEvent} from '../hooks/useCorgiEvent'

interface Props {
	newSampleEvent: CorgiNumberChangedEvent
}

const limit = 256
const dotSize = 1

export const ExpOscilloscopeNodeExtra = hot(module)(React.memo(function _ExpOscilloscopeNodeExtra({
	newSampleEvent,
}: Props) {
	const lastSample = useNumberChangedEvent(newSampleEvent)
	const history = useRef<number[]>([])
	history.current.push(lastSample)
	while (history.current.length > limit) {
		history.current.shift()
	}

	return (
		<div style={{display: 'flex', justifyContent: 'center'}}>
			{history.current.map((sample, i) => {
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
			})}
		</div>
	)
}))
