/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
import React from 'react'
import {ContextMenuTrigger} from 'react-contextmenu'
import Draggable, {DraggableEventHandler} from 'react-draggable'
import {Dispatch} from 'redux'
import {ConnectionNodeType} from '@corgifm/common/common-types'
import {
	getConnectionNodeInfo, IPosition, movePosition,
	nodeClicked, selectConnectionSourceColorByTargetId,
	SelectedNode, selectOptions, selectPosition, selectShamuMetaState, shamuConnect, shamuMetaActions,
} from '@corgifm/common/redux'
import {ConnectedBasicSampler} from '../BasicSampler/BasicSampler'
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

interface ISimpleGraphNodeProps {
	positionId: Id
}

interface ISimpleGraphNodeReduxProps {
	position: IPosition
	color: string
	highQuality: boolean
	fancyZoomPan: boolean
	selectedNode?: SelectedNode
}

type ISimpleGraphNodeAllProps = ISimpleGraphNodeProps & ISimpleGraphNodeReduxProps & {dispatch: Dispatch}

export class SimpleGraphNode extends React.PureComponent<ISimpleGraphNodeAllProps> {
	public render() {
		const {
			positionId, color, highQuality,
			position, fancyZoomPan, selectedNode,
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
					className={`simpleGraphNode ${selectedNode && selectedNode.id === positionId ? 'selectedNode' : ''}`}
					onBlur={() => this.props.dispatch(shamuMetaActions.clearSelectedNode())}
					// TODO
					tabIndex={0}
					onFocus={this._handleMouseDown}
					style={{
						position: 'absolute',
						willChange: fancyZoomPan ? '' : 'transform',
						width,
						height: height + 24,
						zIndex,
						top: -24,
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
							zIndex: 2,
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

		case ConnectionNodeType.gridSequencer: return <ConnectedGridSequencerContainer id={id} />
		case ConnectionNodeType.infiniteSequencer: return <ConnectedInfiniteSequencer id={id} />
		case ConnectionNodeType.virtualKeyboard: return <Keyboard id={id} />

		case ConnectionNodeType.basicSynthesizer: return <ConnectedBasicSynthesizerView id={id} color={color} />
		case ConnectionNodeType.basicSampler: return <ConnectedBasicSampler id={id} color={color} />

		case ConnectionNodeType.simpleReverb: return <ConnectedSimpleReverb id={id} color={color} />
		case ConnectionNodeType.simpleCompressor: return <ConnectedSimpleCompressor id={id} color={color} />
		case ConnectionNodeType.simpleDelay: return <ConnectedSimpleDelay id={id} color={color} />

		default: throw new Error('invalid type: ' + type.toString() + ' ' + id)
	}
}

export const ConnectedSimpleGraphNode = shamuConnect(
	(state, {positionId}: ISimpleGraphNodeProps): ISimpleGraphNodeReduxProps => {
		const position = selectPosition(state.room, positionId)

		return {
			position,
			color: getConnectionNodeInfo(position.targetType).color
				|| selectConnectionSourceColorByTargetId(state, positionId),
			highQuality: selectOptions(state).graphicsECS,
			fancyZoomPan: selectOptions(state).graphicsExpensiveZoomPan,
			selectedNode: selectShamuMetaState(state.room).selectedNode,
		}
	},
)(SimpleGraphNode)
