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

		const margin = 16
		const labelHeight = 20

		return (
			<div
				style={{
					color,
					position: 'relative',
					// marginTop: margin + labelHeight,
				}}
				className={`panelContainer ${saturate ? 'saturate' : ''}`}
			>
				{renderLabel &&
					<div
						className="label colorize transitionAllColor"
						title={labelTitle}
						style={{
							position: 'absolute',
							top: -labelHeight,
							width: '100%',
						}}
					>
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
		)
	}
