import {stripIndents} from 'common-tags'
import React from 'react'
import {ActualKnob} from './ActualKnob'
import './Knob.less'
import {ActualUberKnob} from './ActualUberKnob';
import {ParamInputChainReact} from '../Experimental/ExpPorts';

interface IKnobViewProps {
	label: string
	percentage: number
	readOnly?: boolean
	markColor?: string
	handleMouseDown: (e: React.MouseEvent) => any
	tooltip: string
	children: React.ReactNode
	canEdit: boolean
	isMouseDown: boolean
	color?: string
}

export const KnobView = React.memo(function _KnobView(props: IKnobViewProps) {
	const {
		handleMouseDown, percentage, canEdit, isMouseDown, color,
		label, readOnly = false, tooltip, children,
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
			<ActualKnob percentage={percentage} />
			{children}
		</div>
	)
})
