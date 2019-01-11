import * as React from 'react'

export interface IPanelProps {
	children: any
	className?: string
	color: string
	id?: string
	label?: string
	labelTitle?: string
	saturate?: boolean
}

export const Panel = (props: IPanelProps) => (
	<React.Fragment>
		<div style={{color: props.color}} className={props.saturate ? 'saturate' : ''}>
			{props.label !== undefined &&
				<div className="label colorize transitionAllColor" title={props.labelTitle}>
					{props.label}
				</div>
			}
			<div
				id={props.id}
				className={`panel ${props.className}`}
			>
				<div className="isometricBoxShadow" />
				{props.children}
			</div>
		</div>
	</React.Fragment>
)
