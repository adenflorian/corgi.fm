import {Seq} from 'immutable'
import * as React from 'react'
import {connect} from 'react-redux'
import {IClientAppState} from '../../common/redux'
import {selectAllPositionIds} from '../../common/redux'
import {mainBoardsId} from '../client-constants'
import {ConnectedConnections, ConnectionsUsage} from '../Connections/Connections'
import {ECSCanvasRenderSystem} from '../ECS/ECS'
import {ConnectedMousePointers} from '../MousePointers/MousePointers'
import {ConnectedSimpleGraphNode} from './SimpleGraphNode'
import {ConnectedZoom} from './Zoom'

interface ISimpleGraphReduxProps {
	positionIds: Seq.Indexed<string>
}

const canvasSize = ECSCanvasRenderSystem.canvasSize

export const SimpleGraph: React.FC<ISimpleGraphReduxProps> =
	React.memo(function _SimpleGraph({positionIds}) {
		return (
			<div
				className="simpleGraph"
				style={{
					position: 'fixed',
					width: 0,
					height: 0,
					margin: '50vh 50vw',
				}}
			>
				<ConnectedZoom>
					<div id={mainBoardsId} className="boards">
						<canvas
							id="ECSCanvasRenderSystemCanvas"
							style={{
								position: 'absolute',
								width: canvasSize,
								height: canvasSize,
								top: -canvasSize / 2,
								left: -canvasSize / 2,
							}}
							width={canvasSize}
							height={canvasSize}
						></canvas>
						<ConnectedMousePointers />
						<ConnectedConnections />
						{positionIds.map(positionId =>
							<ConnectedSimpleGraphNode key={positionId} positionId={positionId} />,
						)}
					</div>
				</ConnectedZoom>
			</div>
		)
		// TODO Only update if IDs actually changed
		// (prev, next) => {
		// 	return next.positionIds.count() === prev.positionIds.count()
		// },
	})

export const ConnectedSimpleGraph = connect(
	(state: IClientAppState): ISimpleGraphReduxProps => ({
		positionIds: selectAllPositionIds(state.room),
	}),
)(SimpleGraph)
