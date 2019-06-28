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
	size: number
	tooltip: string
	value: number | string | boolean
	valueString?: (value: number) => string
}

export const KnobView = React.memo(function _KnobView(props: IKnobViewProps) {
	const {
		handleMouseDown, percentage, size = 32, valueString,
		label, value, readOnly = false, tooltip,
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
			<ActualKnob percentage={percentage} size={size} />
			<KnobValue value={value} valueString={valueString} />
		</div>
	)
})
