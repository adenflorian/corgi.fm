import {stripIndents} from 'common-tags'
import React from 'react'
import {SignalRange} from '@corgifm/common/common-types'
import {ParamInputChainReact} from '../Experimental/ExpPorts'
import {ActualKnob} from './ActualKnob'
import './Knob.less'
import {ActualUberKnob} from './ActualUberKnob'

interface Props {
	label: string
	percentage: number
	readOnly?: boolean
	markColor?: string
	handleMouseDown: (e: React.MouseEvent) => any
	tooltip: string
	children: React.ReactNode
	canEdit: boolean
	isMouseDown: boolean
	chains?: readonly ParamInputChainReact[]
	color?: string
	range: SignalRange
}

export const ExpKnobView = React.memo(function _KnobView(props: Props) {
	const {
		handleMouseDown, percentage, canEdit, isMouseDown, color,
		label, readOnly = false, tooltip, children, chains = [], range,
	} = props

	return (
		<div
			className={`knob ${readOnly ? 'readOnly' : ''} isMouseDown-${isMouseDown}`}
			style={{
				width: 64,
				height: 88,
			}}
			title={tooltip + '\n\n' + stripIndents`
				Ctrl + click or Cmd + click to reset
				Hold Alt for fine control
				Hold Shift for coarse control
				${canEdit ? `Click value to edit` : ``}`}
			onMouseDown={handleMouseDown}
		>
			<div className="knobLabel unselectable">{label}</div>
			<ActualUberKnob percentage={percentage} chains={chains} range={range} />
			{/* {chains.length > 0
				? <ActualUberKnob percentage={percentage} chains={chains} color={color} />
				: <ActualKnob percentage={percentage} />} */}
			{children}
		</div>
	)
})
