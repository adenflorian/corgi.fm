import * as React from 'react'
import {Dispatch} from 'redux'
import {positionActions, selectPosition, shamuConnect} from '../../common/redux'
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

interface ReduxProps {
	enabled: boolean
}

type AllProps = IPanelProps & ReduxProps & {dispatch: Dispatch}

export const DumbPanel: React.FC<AllProps> =
	React.memo(function _Panel({
		autoSize = false, children, className = '', color = CssColor.defaultGray,
		id, label, labelTitle, saturate = false, helpText, ownerName, dispatch, enabled,
	}) {

		const renderLabel = label !== undefined && label !== ''

		return (
			<div
				style={{
					color: enabled ? color : CssColor.defaultGray,
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
					>
						<div
							className={`colorDotContainer noDrag ${enabled ? 'enabled' : ''}`}
							onClick={() => id !== undefined ? dispatch(positionActions.setEnabled(id, !enabled)) : undefined}
						>
							<div className="colorDot"></div>
						</div>
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

export const Panel = shamuConnect(
	(state, {id}: IPanelProps): ReduxProps => {
		return {
			enabled: id === undefined ? false : selectPosition(state.room, id).enabled,
		}
	},
)(DumbPanel)
