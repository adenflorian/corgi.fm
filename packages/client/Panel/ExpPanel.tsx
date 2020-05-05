import React, {useCallback} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import {ConnectionNodeType} from '@corgifm/common/common-types'
import {
	createExpPositionHeightSelector,
	expNodesActions,
	createExpNodeEnabledSelector,
} from '@corgifm/common/redux'
import {CssColor} from '@corgifm/common/shamu-color'
import {handleClassName} from '../client-constants'
import './Panel.less'
import {ExpResizer} from './ExpResizer'

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
	onHeaderDoubleClick?: (e: React.MouseEvent) => void
}

const stopPropagation = (e: React.SyntheticEvent) => e.stopPropagation()

/** For nodes only */
export const ExpPanel =
	React.memo(function _ExpPanel({
		children, className = '', color = CssColor.disabledGray,
		id, label, labelTitle, saturate = false, helpText, ownerName, extra,
		onHeaderDoubleClick,
	}: Props) {
		const dispatch = useDispatch()

		const enabled = useSelector(createExpNodeEnabledSelector(id))
		// const nodeType = useSelector(createExpPositionTypeSelector(id))
		const nodeType = ConnectionNodeType.dummy
		const height = useSelector(createExpPositionHeightSelector(id))

		// const {disabledText, isResizable} = findNodeInfo(nodeType)
		const disabledText = 'disabled'
		const isResizable = true

		const handleMouseDownOnHeader = useCallback((e: React.MouseEvent) => {
			// if (e.buttons === 1 && e.shiftKey) {
			// 	dispatch(localActions.connectKeyboardToNode(id, nodeType))
			// }
		}, [])

		return (
			<div
				style={{
					color: enabled ? color : CssColor.disabledGray,
					backgroundColor: 'unset',
					boxShadow: 'unset',
				}}
				className={`panelContainer ${saturate ? 'saturate' : ''}`}
			>
				<div
					className={`header ${handleClassName}`}
					title={labelTitle}
					onMouseDown={handleMouseDownOnHeader}
					onDoubleClick={onHeaderDoubleClick}
				>
					<div
						className={`colorDotContainer enabled-${enabled}`}
						onClick={onColorDotClick}
						onDoubleClick={stopPropagation}
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
				{isResizable && <ExpResizer id={id} />}
			</div>
		)

		function onColorDotClick() {
			dispatch(expNodesActions.setEnabled(id, !enabled))
		}
	})
