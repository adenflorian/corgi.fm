import * as React from 'react'

export interface IPanelProps {
	id: string
	children: any
}

export const Panel = (props: IPanelProps) => (
	<div id={props.id} className="container">
		<div className="isometricBoxShadow"></div>
		{props.children}
	</div>
)
