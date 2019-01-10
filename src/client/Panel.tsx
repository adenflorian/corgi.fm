import * as React from 'react'

export interface IPanelProps {
	children: any
	className?: string
	color: string
	id?: string
	label?: string
}

export const Panel = (props: IPanelProps) => (
	<div
		id={props.id}
		className={`container panel ${props.className}`}
		style={{color: props.color}}
	>
		<div className="isometricBoxShadow"></div>
		{props.label !== undefined && <div className="label">{props.label}</div>}
		{props.children}
	</div>
)
