import React, {useCallback} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import {ConnectionNodeType} from '@corgifm/common/common-types'
import {
	AppOptions, findNodeInfo, positionActions, setOption,
	localActions, createPositionEnabledSelector, createPositionTypeSelector,
	createOptionSelector,
	createPositionHeightSelector,
} from '@corgifm/common/redux'
import {CssColor} from '@corgifm/common/shamu-color'
import {handleClassName} from '../client-constants'
import './Panel.less'

export interface Props {
	children: any
	className?: string
	color: string
	id: Id
	label: string
	labelTitle?: string
	saturate?: boolean
	helpText?: string
	ownerName?: string
	extra?: string
}

/** For nodes only */
export const Panel =
	React.memo(function _Panel({
		children, className = '', color = CssColor.disabledGray,
		id, label, labelTitle, saturate = false, helpText, ownerName, extra,
	}: Props) {
		const dispatch = useDispatch()

		const isPositionEnabled = useSelector(createPositionEnabledSelector(id))
		const nodeType = useSelector(createPositionTypeSelector(id))
		const isMasterVolumeMuted = useSelector(createOptionSelector(AppOptions.masterVolumeMute)) as boolean
		const height = useSelector(createPositionHeightSelector(id))

		const enabled = nodeType === ConnectionNodeType.audioOutput
			? isMasterVolumeMuted === false
			: isPositionEnabled

		const nodeInfo = findNodeInfo(nodeType)

		const handleMouseDownOnHeader = useCallback((e: React.MouseEvent) => {
			if (id && e.shiftKey) {
				dispatch(localActions.connectKeyboardToNode(id, nodeType))
			}
		}, [dispatch, id, nodeType])

		return (
			<div
				style={{
					color: enabled ? color : CssColor.disabledGray,
					position: 'relative',
				}}
				className={`panelContainer ${saturate ? 'saturate' : ''}`}
			>
				<div
					className={`header ${handleClassName}`}
					title={labelTitle}
					onMouseDown={handleMouseDownOnHeader}
				>
					<div
						className={`colorDotContainer noDrag ${enabled ? 'enabled' : ''}`}
						onClick={onColorDotClick}
						title={(enabled ? 'Enabled' : 'Disabled') +
							`\nDisable or enable this node\n` +
							nodeInfo.disabledText + ' when disabled'}
					>
						<div className="colorDot" />
					</div>
					<div className="label">{label}</div>
					{ownerName &&
						<div
							className="ownerName"
							title={`This node belongs to ${ownerName}`}
						>
							{ownerName}
						</div>
					}
					{extra &&
						<div className="extra" title={extra}>{extra}</div>
					}
					{helpText &&
						<div className="helpText" title={helpText}>?</div>
					}
				</div>
				<div
					id={id as string}
					className={`panel ${className}`}
					style={{
						height,
					}}
				>
					{children}
				</div>
			</div>
		)

		function onColorDotClick() {
			if (nodeType === ConnectionNodeType.audioOutput) {
				dispatch(setOption(AppOptions.masterVolumeMute, enabled))
			} else {
				dispatch(positionActions.setEnabled(id, !enabled))
			}
		}
	})

export interface PanelLiteProps {
	children: any
	className?: string
	color: string
}

export const PanelLite = React.memo(
	({children, className = '', color}: PanelLiteProps) => {
		return (
			<div
				style={{
					color: color,
					position: 'relative',
				}}
				className={`panelContainer`}
			>
				<div
					className={`panel ${className}`}
				>
					{children}
				</div>
			</div>
		)
	}
)
