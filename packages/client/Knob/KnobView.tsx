import {stripIndents} from 'common-tags'
import React from 'react'
import {ActualKnob} from './ActualKnob'
import './Knob.less'

interface IKnobViewProps {
	label: string
	percentage: number
	adjustedPercentage: number
	readOnly?: boolean
	markColor?: string
	handleMouseDown: (e: React.MouseEvent) => any
	tooltip: string
	children: React.ReactNode
	canEdit: boolean
}

export const KnobView = React.memo(function _KnobView(props: IKnobViewProps) {
	const {
		handleMouseDown, percentage, canEdit,
		label, readOnly = false, tooltip, children,
	} = props

	return (
		<div
			className={`knob ${readOnly ? 'readOnly' : ''}`}
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
			<ActualKnob percentage={percentage} />
			{children}
		</div>
	)
})
