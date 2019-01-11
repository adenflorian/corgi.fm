import * as React from 'react'
import {CssColor} from '../../common/shamu-color'
import './Panel.less'

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
	({children, className, color = CssColor.defaultGray, id, label, labelTitle, saturate}) => {

		const renderLabel = label !== undefined && label !== ''

		return (
			<React.Fragment>
				<div
					style={{color}}
					className={`${saturate ? 'saturate' : ''}`}
				>
					{renderLabel &&
						<div className="label colorize transitionAllColor" title={labelTitle}>
							{label}
						</div>
					}
					<div
						id={id}
						className={`panel ${className} ${renderLabel ? 'renderLabel' : ''}`}
					>
						<div className="isometricBoxShadow" />
						{children}
					</div>
				</div>
			</React.Fragment>
		)
	}
