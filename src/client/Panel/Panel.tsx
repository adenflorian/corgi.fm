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
	autoSize?: boolean
}

export const Panel: React.FC<IPanelProps> =
	React.memo(function _Panel({autoSize = false, children, className = '', color = CssColor.defaultGray, id, label, labelTitle, saturate = false}) {

		const renderLabel = label !== undefined && label !== ''

		const labelHeight = 20

		return (
			<div
				style={{
					color,
					position: 'relative',
					width: autoSize ? 'auto' : undefined,
					height: autoSize ? 'auto' : undefined,
				}}
				className={`panelContainer handle ${saturate ? 'saturate' : ''}`}
			>
				{renderLabel &&
					<div
						className="label colorize"
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
					<ShamuBorder saturate={saturate} />
					{children}
				</div>
			</div>
		)
	})

const ShamuBorder = React.memo(function _ShamuBorder({saturate}: {saturate: boolean}) {
	return (
		<svg
			style={{
				position: 'absolute',
				width: '100%',
				height: '100%',
				stroke: 'none',
				fill: 'currentColor',
				strokeWidth: 4,
				top: 2,
				left: -2,
				zIndex: -1,
				filter: `drop-shadow(-1px 1px 4px rgb(24, 24, 24))` + (saturate ? ' saturate(3)' : ''),
			}}
		>
			<g>
				<rect x="0" y="0" width="100%" height="100%" />
			</g>
		</svg>
	)
})
