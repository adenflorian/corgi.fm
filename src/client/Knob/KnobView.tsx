import * as React from 'react'
import {CssColor} from '../../common/shamu-color'
import './Knob.less'

interface IKnobViewProps {
	label: string
	percentage: number
	adjustedPercentage: number
	readOnly?: boolean
	markColor?: string
	handleMouseDown: (e: React.MouseEvent) => any
	size: number
	tooltip: string
	value: number | string
	valueString?: (value: number) => string
}

export const KnobView = React.memo(function _KnobView(props: IKnobViewProps) {
	const {
		handleMouseDown, percentage, adjustedPercentage, size = 32, valueString,
		label, value, readOnly = false, markColor = 'gray', tooltip,
	} = props

	const displayValue = typeof value === 'number'
		? valueString
			? valueString(value)
			: value.toFixed(2)
		: value

	return (
		<div
			className={`knob ${readOnly ? 'readOnly' : ''}`}
			style={{
				width: 64,
				height: 88,
			}}
		>
			<div className="knobLabel unselectable">{label}</div>
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
					{/* <circle cx="50%" cy="50%" r="64%"
						fill="none" stroke={CssColor.panelGrayLight} strokeWidth="3"
						strokeDasharray={`0 50% ${percentage * 300}% 100000`} strokeDashoffset="1"
					/> */}
					<circle cx="50%" cy="50%" r="64%"
						fill="none" stroke={CssColor.panelGrayLight} strokeWidth="3"
						strokeDasharray={`0 50% ${1 * 300}% 100000`} strokeDashoffset="1"
					/>
					<circle cx="50%" cy="50%" r="64%"
						fill="none" stroke="currentColor" strokeWidth="3"
						strokeDasharray={`0 50% ${percentage * 300}% 100000`} strokeDashoffset="1"
					/>
				</svg>
				{/* <div className="knobShadow" /> */}
				<div
					className="actualKnob"
					style={{
						transform: `rotate(${_getRotation(percentage)}deg)`,
					}}
					onMouseDown={handleMouseDown}
					title={tooltip + '\n' + 'ctrl + click to reset'}
				>
					<div className="mark" style={{backgroundColor: 'currentColor', borderRadius: 2}}></div>
				</div>
			</div>
			{/* <div className="valueBox">{displayValue}</div> */}
			<div className="knobValue unselectable">{displayValue}</div>
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
