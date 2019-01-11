import * as React from 'react'
import {CssColor} from '../common/shamu-color'

export interface IPanelProps {
	children: any
	className?: string
	color?: string
	id?: string
	label?: string
	labelTitle?: string
	saturate?: boolean
}

export const Panel: React.FunctionComponent<IPanelProps> =
	({children, className, color = CssColor.defaultGray, id, label, labelTitle, saturate}) => (
		<React.Fragment>
			<div style={{color}} className={saturate ? 'saturate' : ''}>
				{label !== undefined &&
					<div className="label colorize transitionAllColor" title={labelTitle}>
						{label}
					</div>
				}
				<div
					id={id}
					className={`panel ${className}`}
				>
					<div className="isometricBoxShadow" />
					{children}
				</div>
			</div>
		</React.Fragment>
	)
