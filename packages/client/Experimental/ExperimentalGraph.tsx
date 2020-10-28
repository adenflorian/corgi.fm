import React from 'react'
import {mainBoardsId} from '../client-constants'
import {ConnectedMousePointers} from '../MousePointers/MousePointers'
import {ConnectedZoom} from '../SimpleGraph/Zoom'
import {ExperimentalMain} from './ExperimentalMain'

export const ExperimentalGraph = function _ExperimentalGraph() {
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
					<ConnectedMousePointers />
					<ExperimentalMain />
				</div>
			</ConnectedZoom>
		</div>
	)
}
