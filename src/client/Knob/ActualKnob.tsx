import React from 'react'
import {CssColor} from '../../common/shamu-color'

interface Props {
	percentage: number
}

export const ActualKnob = React.memo(function _ActualKnob(props: Props) {
	const {percentage} = props

	const size = 32

	return (
		<div
			className="actualKnobContainer"
			style={{
				width: size,
				height: size,
			}}
		>
			<svg
				className="arc colorize"
				width="100%"
				height="100%"
				xmlns="http://www.w3.org/2000/svg"
				style={{
					position: 'absolute',
					overflow: 'visible',
					transform: `rotate(90deg)`,
					strokeLinecap: 'round',
				}}
			>
				<circle
					cx="50%"
					cy="50%"
					r="64%"
					fill="none"
					stroke={CssColor.panelGrayLight}
					strokeWidth="3"
					strokeDasharray={`0 50% ${1 * 308.2}% 100000`}
					strokeDashoffset="1"
				/>
				<circle
					cx="50%"
					cy="50%"
					r="64%"
					fill="none"
					stroke="currentColor"
					strokeWidth="3"
					strokeDasharray={`0 50% ${percentage * 308.2}% 100000`}
					strokeDashoffset="1"
				/>
			</svg>
			<div
				className="actualKnob"
				style={{
					transform: `rotate(${_getRotation(percentage)}deg)`,
				}}
			>
				<div className="mark" style={{backgroundColor: 'currentColor', borderRadius: 2}} />
			</div>
		</div>
	)
})

function _getRotation(normalizedInput: number): number {
	const minDegrees = 220
	const maxDegrees = 500
	const rangeDegrees = maxDegrees - minDegrees
	const amountOfDegreesToApply = rangeDegrees * normalizedInput
	return minDegrees + amountOfDegreesToApply
}
