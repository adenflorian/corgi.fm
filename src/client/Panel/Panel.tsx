import * as React from 'react'
import {CssColor} from '../../common/shamu-color'
import {handleClassName, handleVisualClassName} from '../client-constants'
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
	helpText?: string
	ownerName?: string
}

export const Panel: React.FC<IPanelProps> =
	React.memo(function _Panel({
		autoSize = false, children, className = '', color = CssColor.defaultGray,
		id, label, labelTitle, saturate = false, helpText, ownerName,
	}) {

		const renderLabel = label !== undefined && label !== ''

		return (
			<div
				style={{
					color,
					position: 'relative',
					width: autoSize ? 'auto' : undefined,
					height: autoSize ? 'auto' : undefined,
				}}
				className={`panelContainer ${handleClassName} ${saturate ? 'saturate' : ''}`}
			>
				{renderLabel &&
					<div
						className={`header ${handleClassName} ${handleVisualClassName}`}
						title={labelTitle}
						style={{color}}
					>
						<div className="colorDot"></div>
						<div className="label">{label}</div>
						{ownerName &&
							<div className="ownerName" title={ownerName}>{ownerName}</div>
						}
						{helpText &&
							<div className="helpText" title={helpText}>?</div>
						}
					</div>
				}
				<div
					id={id}
					className={`panel ${className}`}
				>
					{children}
				</div>
			</div>
		)
	})
