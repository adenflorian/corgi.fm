import * as React from 'react'
import {ContextMenuTrigger} from 'react-contextmenu'
import Draggable, {DraggableEventHandler} from 'react-draggable'
import {IoMdMove as HandleIcon} from 'react-icons/io'
import {Dispatch} from 'redux'
import {ConnectionNodeType} from '../../common/common-types'
import {
	getConnectionNodeInfo, IPosition, movePosition,
	nodeClicked, selectConnectionSourceColorByTargetId,
	selectOptions, selectPosition, shamuConnect,
} from '../../common/redux'
import {CssColor} from '../../common/shamu-color'
import {ConnectedBasicSampler} from '../BasicSampler/BasicSampler'
import {graphSizeX, graphSizeY, nodeMenuId} from '../client-constants'
import {ECSSequencerRenderSystem} from '../ECS/ECSSequencerRenderSystem'
import {ConnectedGridSequencerContainer} from '../GridSequencer/GridSequencerContainer'
import {ConnectedInfiniteSequencer} from '../InfiniteSequencer/InfiniteSequencer'
import {ConnectedBasicSynthesizerView} from '../Instruments/BasicSynthesizerView'
import {ConnectedKeyboard} from '../Keyboard/Keyboard'
import {ConnectedMasterControls} from '../MasterControls'
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
}

type ISimpleGraphNodeAllProps = ISimpleGraphNodeProps & ISimpleGraphNodeReduxProps & {dispatch: Dispatch}

const handleClassName = 'handle'

export class SimpleGraphNode extends React.PureComponent<ISimpleGraphNodeAllProps> {
	public render() {
		const {
			positionId, color, highQuality,
			position, fancyZoomPan,
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
				cancel={`.actualKnob, .note, .key, .controls > *, .oscillatorTypes > *, .verticalScrollBar`}
				onMouseDown={this._handleMouseDown}
			>
				<div
					className="simpleGraphNode"
					style={{
						position: 'absolute',
						willChange: fancyZoomPan ? '' : 'transform',
						width,
						height,
						zIndex,
					}}
				>
					<Handle />
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
							top: 0,
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
	}
}

const handleSize = 24
const borderRadius = 4

const Handle = React.memo(function Handle_() {
	return <div
		className={handleClassName + ' handleVisual'}
		style={{
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
			width: handleSize,
			height: handleSize,
			backgroundColor: CssColor.panelGray,
			position: 'absolute',
			bottom: '100%',
			left: 8,
			borderTopLeftRadius: borderRadius,
			borderTopRightRadius: borderRadius,
			boxShadow: 'inset 0px -6px 8px -5px #000000c2',
		}}
	>
		<HandleIcon />
	</div>
})

export function getComponentByNodeType(type: ConnectionNodeType, id: string, color: string) {
	switch (type) {
		case ConnectionNodeType.masterClock: return <ConnectedMasterControls color={color} />
		case ConnectionNodeType.audioOutput: return <ConnectedVolumeControl color={color} />

		case ConnectionNodeType.gridSequencer: return <ConnectedGridSequencerContainer id={id} />
		case ConnectionNodeType.infiniteSequencer: return <ConnectedInfiniteSequencer id={id} />
		case ConnectionNodeType.virtualKeyboard: return <ConnectedKeyboard id={id} />

		case ConnectionNodeType.basicSynthesizer: return <ConnectedBasicSynthesizerView id={id} color={color} />
		case ConnectionNodeType.basicSampler: return <ConnectedBasicSampler id={id} color={color} />

		case ConnectionNodeType.simpleReverb: return <ConnectedSimpleReverb id={id} color={color} />

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
		}
	},
)(SimpleGraphNode)
