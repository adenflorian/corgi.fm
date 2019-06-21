import * as React from 'react'
import {ContextMenuTrigger} from 'react-contextmenu'
import Draggable, {DraggableEventHandler} from 'react-draggable'
import {Dispatch} from 'redux'
import {ConnectionNodeType, Id} from '../../common/common-types'
import {
	getConnectionNodeInfo, IPosition, movePosition,
	nodeClicked, selectConnectionSourceColorByTargetId,
	selectOptions, selectPosition, selectShamuMetaState, shamuConnect, shamuMetaActions,
} from '../../common/redux'
import {ConnectedBasicSampler} from '../BasicSampler/BasicSampler'
import {graphSizeX, graphSizeY, handleClassName, nodeMenuId} from '../client-constants'
import {ECSSequencerRenderSystem} from '../ECS/ECSSequencerRenderSystem'
import {ConnectedGridSequencerContainer} from '../GridSequencer/GridSequencerContainer'
import {ConnectedGroupSequencerView} from '../GroupSequencer/GroupSequencer'
import {ConnectedInfiniteSequencer} from '../InfiniteSequencer/InfiniteSequencer'
import {ConnectedBasicSynthesizerView} from '../Instruments/BasicSynthesizerView'
import {ConnectedKeyboard} from '../Keyboard/Keyboard'
import {ConnectedMasterControls} from '../MasterControls'
import {ConnectedSimpleCompressor} from '../ShamuNodes/SimpleCompressor/SimpleCompressorView'
import {ConnectedSimpleReverb} from '../ShamuNodes/SimpleReverb/SimpleReverbView'
import {simpleGlobalClientState} from '../SimpleGlobalClientState'
import {ConnectedVolumeControl} from '../Volume/VolumeControl'

interface ISimpleGraphNodeProps {
	positionId: string
}

interface ISimpleGraphNodeReduxProps {
	position: IPosition
	color: string
	highQuality: boolean
	fancyZoomPan: boolean
	selectedNodeId?: Id
}

type ISimpleGraphNodeAllProps = ISimpleGraphNodeProps & ISimpleGraphNodeReduxProps & {dispatch: Dispatch}

export class SimpleGraphNode extends React.PureComponent<ISimpleGraphNodeAllProps> {
	public render() {
		const {
			positionId, color, highQuality,
			position, fancyZoomPan, selectedNodeId,
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
				cancel={`.actualKnob, .note, .key, .controls > *, .oscillatorTypes > *, .verticalScrollBar, .groupEvent, .noDrag`}
				onMouseDown={this._handleMouseDown}
			>
				<div
					className={`simpleGraphNode ${selectedNodeId === positionId ? 'selectedNode' : ''}`}
					onBlur={() => this.props.dispatch(shamuMetaActions.clearSelectedNodeId())}
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
					></canvas>
				</div>
			</Draggable>
		)
	}

	private readonly _handleDrag: DraggableEventHandler = (_, data) => {
		this.props.dispatch(movePosition(this.props.positionId, {x: data.x, y: data.y}))
	}

	private readonly _handleMouseDown = () => {
		this.props.dispatch(nodeClicked(this.props.positionId))
		this.props.dispatch(shamuMetaActions.setSelectedNodeId(this.props.positionId))
	}
}

export function getComponentByNodeType(type: ConnectionNodeType, id: string, color: string) {
	switch (type) {
		case ConnectionNodeType.masterClock: return <ConnectedMasterControls color={color} />
		case ConnectionNodeType.audioOutput: return <ConnectedVolumeControl color={color} />

		case ConnectionNodeType.groupSequencer: return <ConnectedGroupSequencerView id={id} color={color} />

		case ConnectionNodeType.gridSequencer: return <ConnectedGridSequencerContainer id={id} />
		case ConnectionNodeType.infiniteSequencer: return <ConnectedInfiniteSequencer id={id} />
		case ConnectionNodeType.virtualKeyboard: return <ConnectedKeyboard id={id} />

		case ConnectionNodeType.basicSynthesizer: return <ConnectedBasicSynthesizerView id={id} color={color} />
		case ConnectionNodeType.basicSampler: return <ConnectedBasicSampler id={id} color={color} />

		case ConnectionNodeType.simpleReverb: return <ConnectedSimpleReverb id={id} color={color} />
		case ConnectionNodeType.simpleCompressor: return <ConnectedSimpleCompressor id={id} color={color} />

		default: throw new Error('invalid type: ' + type.toString() + ' ' + id)
	}
}

export const ConnectedSimpleGraphNode = shamuConnect(
	(state, {positionId}: ISimpleGraphNodeProps): ISimpleGraphNodeReduxProps => {
		const position = selectPosition(state.room, positionId)

		return {
			position,
			color: getConnectionNodeInfo(position.targetType).color
				|| selectConnectionSourceColorByTargetId(state.room, positionId),
			highQuality: selectOptions(state).graphics_ECS,
			fancyZoomPan: selectOptions(state).graphics_expensiveZoomPan,
			selectedNodeId: selectShamuMetaState(state.room).selectedNodeId,
		}
	},
)(SimpleGraphNode)
