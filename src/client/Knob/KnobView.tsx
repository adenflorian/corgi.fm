import * as React from 'react'
import {ActualKnob} from './ActualKnob'
import './Knob.less'
import {KnobValue} from './KnobValue'

interface IKnobViewProps {
	label: string
	percentage: number
	adjustedPercentage: number
	readOnly?: boolean
	markColor?: string
	handleMouseDown: (e: React.MouseEvent) => any
	tooltip: string
	value: number | string | boolean
	valueString?: (value: number) => string
	onValueChange?: (value: number) => void
	max?: number
	min?: number
}

export const KnobView = React.memo(function _KnobView(props: IKnobViewProps) {
	const {
		handleMouseDown, percentage, valueString, onValueChange,
		label, value, readOnly = false, tooltip, min, max,
	} = props

	return (
		<div
			className={`knob ${readOnly ? 'readOnly' : ''}`}
			style={{
				width: 64,
				height: 88,
			}}
			title={tooltip + '\n' + 'Ctrl + click or Cmd + click to reset'}
			onMouseDown={handleMouseDown}
		>
			<div className="knobLabel unselectable">{label}</div>
			<ActualKnob percentage={percentage} />
			<KnobValue value={value} valueString={valueString} onValueChange={onValueChange} min={min} max={max} />
		</div>
	)
})
