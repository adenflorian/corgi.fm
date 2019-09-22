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
import {Resizer} from './Resizer'

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

		const {disabledText, isResizable} = findNodeInfo(nodeType)

		const handleMouseDownOnHeader = useCallback((e: React.MouseEvent) => {
			if (e.buttons === 1 && e.shiftKey) {
				dispatch(localActions.connectKeyboardToNode(id, nodeType))
			}
		}, [dispatch, id, nodeType])

		return (
			<div
				style={{
					color: enabled ? color : CssColor.disabledGray,
				}}
				className={`panelContainer ${saturate ? 'saturate' : ''}`}
			>
				<div
					className={`header ${handleClassName}`}
					title={labelTitle}
					onMouseDown={handleMouseDownOnHeader}
				>
					<div
						className={`colorDotContainer enabled-${enabled}`}
						onClick={onColorDotClick}
						title={(enabled ? 'Enabled' : 'Disabled') +
							`\nDisable or enable this node\n` +
							disabledText + ' when disabled'}
					>
						<svg width={24} height={16}>
							<circle
								r={3}
								cx="50%"
								cy="50%"
								stroke="currentColor"
								strokeWidth="2px"
								fill={enabled ? 'currentColor' : 'none'}
							/>
						</svg>
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
				{isResizable && <Resizer id={id} />}
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
					color,
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
