import React from 'react'
import {CssColor} from '@corgifm/common/shamu-color'

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
			>
				<g transform="rotate(90, 16, 16)">
					<circle
						cx="50%"
						cy="50%"
						r="64%"
						fill="none"
						stroke={CssColor.panelGrayLight}
						strokeWidth="1"
						strokeDasharray={`0 50% ${1 * 308.2}% 100000`}
						strokeDashoffset="1"
					/>
					<circle
						cx="50%"
						cy="50%"
						r="64%"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeDasharray={`0 50% ${percentage * 308.2}% 100000`}
						strokeDashoffset="1"
					/>
				</g>
				<circle
					cx="50%"
					cy="6.25%"
					r="6.25%"
					fill="currentColor"
					stroke="none"
					transform={`rotate(${_getRotation(percentage)}, 16, 16)`}
				/>
			</svg>
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
