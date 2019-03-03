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
}

export const KnobView: React.FC<IKnobViewProps> = React.memo(props => {
	const {handleMouseDown, percentage, adjustedPercentage, label, readOnly = false, markColor = 'gray'} = props

	return (
		<div
			className={`knob ${readOnly ? 'readOnly' : ''}`}
		>
			<div
				className="actualKnobContainer"
				style={{
					width: props.size,
					height: props.size,
				}}
			>
				<svg className="arc colorize" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"
					style={{
						position: 'absolute',
						overflow: 'visible',
						transform: `rotate(90deg)`,
					}}
				>
					<circle cx="50%" cy="50%" r="64%"
						fill="none" stroke={CssColor.panelGrayLight} strokeWidth="2"
						strokeDasharray={`0 50% ${percentage * 300}% 100000`} strokeDashoffset="1"
					/>
					<circle cx="50%" cy="50%" r="64%"
						fill="none" stroke="currentColor" strokeWidth="2"
						strokeDasharray={`0 50% ${adjustedPercentage * 300}% 100000`} strokeDashoffset="1"
					/>
				</svg>
				<div className="knobShadow" />
				<div
					className="actualKnob"
					style={{
						transform: `rotate(${_getRotation(percentage)}deg)`,
					}}
					onMouseDown={handleMouseDown}
				>
					<div className="mark" style={{backgroundColor: markColor}}></div>
				</div>
			</div>
			<div className="knobLabel unselectable">{label}</div>
		</div>
	)
})

KnobView.defaultProps = {
	size: 32,
}

function _getRotation(normalizedInput: number): number {
	const minDegrees = 220
	const maxDegrees = 500
	const rangeDegrees = maxDegrees - minDegrees
	const amountOfDegreesToApply = rangeDegrees * normalizedInput
	return minDegrees + amountOfDegreesToApply
}
