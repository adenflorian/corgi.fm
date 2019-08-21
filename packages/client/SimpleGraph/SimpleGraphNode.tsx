/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
import React from 'react'
import {ContextMenuTrigger} from 'react-contextmenu'
import Draggable, {DraggableEventHandler} from 'react-draggable'
import {Dispatch} from 'redux'
import {ConnectionNodeType} from '@corgifm/common/common-types'
import {
	findNodeInfo, IPosition, movePosition,
	nodeClicked, selectConnectionSourceColorByTargetId,
	selectOptions, selectPosition, selectShamuMetaState,
	shamuConnect, shamuMetaActions,
} from '@corgifm/common/redux'
import {panelHeaderHeight} from '@corgifm/common/common-constants'
import {BasicSampler} from '../BasicSampler/BasicSampler'
import {graphSizeX, graphSizeY, handleClassName, nodeMenuId} from '../client-constants'
import {ECSSequencerRenderSystem} from '../ECS/ECSSequencerRenderSystem'
import {ConnectedGridSequencerContainer} from '../GridSequencer/GridSequencerContainer'
import {GroupSequencerView} from '../GroupSequencer/GroupSequencer'
import {ConnectedInfiniteSequencer} from '../InfiniteSequencer/InfiniteSequencer'
import {ConnectedBasicSynthesizerView} from '../Instruments/BasicSynthesizerView'
import {Keyboard} from '../Keyboard/Keyboard'
import {ConnectedMasterControls} from '../MasterControls'
import {ConnectedSimpleCompressor} from '../ShamuNodes/SimpleCompressor/SimpleCompressorView'
import {ConnectedSimpleDelay} from '../ShamuNodes/SimpleDelay/SimpleDelayView'
import {ConnectedSimpleReverb} from '../ShamuNodes/SimpleReverb/SimpleReverbView'
import {simpleGlobalClientState} from '../SimpleGlobalClientState'
import {ConnectedVolumeControl} from '../Volume/VolumeControl'
import {BetterSequencer} from '../BetterSequencer/BetterSequencer'

interface ISimpleGraphNodeProps {
	positionId: Id
}

interface ISimpleGraphNodeReduxProps {
	position: IPosition
	color: string
	highQuality: boolean
	fancyZoomPan: boolean
	isSelected: boolean
}

type ISimpleGraphNodeAllProps = ISimpleGraphNodeProps & ISimpleGraphNodeReduxProps & {dispatch: Dispatch}

export class SimpleGraphNode extends React.PureComponent<ISimpleGraphNodeAllProps> {
	public render() {
		const {
			positionId, color, highQuality,
			position, fancyZoomPan, isSelected,
		} = this.props

		const {x, y, width, height, targetType, zIndex} = position

		return (
			<Draggable
				enableUserSelectHack={false}
				onDrag={this._handleDrag}
				position={{
					x,
					y,
				}}
				scale={simpleGlobalClientState.zoom}
				bounds={{
					top: -(graphSizeY / 2),
					right: (graphSizeX / 2),
					bottom: (graphSizeY / 2),
					left: -(graphSizeX / 2),
				}}
				handle={`.${handleClassName}`}
				cancel={`.noDrag, .panel`}
			>
				<div
					className={`simpleGraphNode ${isSelected ? 'selectedNode' : ''}`}
					onBlur={() => this.props.dispatch(shamuMetaActions.clearSelectedNode())}
					// TODO
					tabIndex={0}
					onFocus={this._handleMouseDown}
					style={{
						position: 'absolute',
						willChange: fancyZoomPan ? '' : 'transform',
						width,
						height: height + panelHeaderHeight,
						zIndex,
						top: -panelHeaderHeight,
					}}
				>
					{
						// @ts-ignore disableIfShiftIsPressed
						<ContextMenuTrigger
							id={nodeMenuId}
							disableIfShiftIsPressed={true}
							holdToDisplay={-1}
							nodeId={positionId}
							nodeType={targetType}
							collect={({nodeId, nodeType}) => ({
								nodeId,
								nodeType,
							})}
						>
							{getComponentByNodeType(targetType, positionId, color)}
						</ContextMenuTrigger>
					}
					<canvas
						id={ECSSequencerRenderSystem.canvasIdPrefix + positionId}
						style={{
							position: 'absolute',
							width,
							height,
							bottom: 0,
							left: 0,
							pointerEvents: 'none',
							zIndex: 999999,
							display: highQuality ? undefined : 'none',
						}}
						width={width}
						height={height}
					/>
				</div>
			</Draggable>
		)
	}

	private readonly _handleDrag: DraggableEventHandler = (_, data) => {
		this.props.dispatch(movePosition(this.props.positionId, {x: data.x, y: data.y}))
	}

	private readonly _handleMouseDown = () => {
		this.props.dispatch(nodeClicked(this.props.positionId))
		this.props.dispatch(shamuMetaActions.setSelectedNode({id: this.props.positionId, type: this.props.position.targetType}))
	}
}

export function getComponentByNodeType(type: ConnectionNodeType, id: Id, color: string) {
	switch (type) {
		case ConnectionNodeType.masterClock: return <ConnectedMasterControls color={color} />
		case ConnectionNodeType.audioOutput: return <ConnectedVolumeControl color={color} />

		case ConnectionNodeType.groupSequencer: return <GroupSequencerView id={id} color={color} />

		case ConnectionNodeType.betterSequencer: return <BetterSequencer id={id} />
		case ConnectionNodeType.gridSequencer: return <ConnectedGridSequencerContainer id={id} />
		case ConnectionNodeType.infiniteSequencer: return <ConnectedInfiniteSequencer id={id} />
		case ConnectionNodeType.virtualKeyboard: return <Keyboard id={id} />

		case ConnectionNodeType.basicSynthesizer: return <ConnectedBasicSynthesizerView id={id} color={color} />
		case ConnectionNodeType.basicSampler: return <BasicSampler id={id} color={color} />

		case ConnectionNodeType.simpleReverb: return <ConnectedSimpleReverb id={id} color={color} />
		case ConnectionNodeType.simpleCompressor: return <ConnectedSimpleCompressor id={id} color={color} />
		case ConnectionNodeType.simpleDelay: return <ConnectedSimpleDelay id={id} color={color} />

		default: throw new Error('invalid type: ' + type.toString() + ' ' + id)
	}
}

export const ConnectedSimpleGraphNode = shamuConnect(
	(state, {positionId}: ISimpleGraphNodeProps): ISimpleGraphNodeReduxProps => {
		const position = selectPosition(state.room, positionId)
		const selectedNode = selectShamuMetaState(state.room).selectedNode
		const selectedId = selectedNode ? selectedNode.id : undefined

		return {
			position,
			color: findNodeInfo(position.targetType).color
				|| selectConnectionSourceColorByTargetId(state, positionId),
			highQuality: selectOptions(state).graphicsECS,
			fancyZoomPan: selectOptions(state).graphicsExpensiveZoomPan,
			isSelected: positionId === selectedId,
		}
	},
)(SimpleGraphNode)
