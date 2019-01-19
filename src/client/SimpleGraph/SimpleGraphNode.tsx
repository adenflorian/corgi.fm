import * as React from 'react'
import {ConnectionNodeType} from '../../common/redux/connections-redux'
import {IPosition, selectPosition} from '../../common/redux/positions-redux'
import {shamuConnect} from '../../common/redux/redux-utils'
import {ConnectedBasicSampler} from '../BasicSampler/BasicSampler'
import {ConnectedGridSequencerContainer} from '../GridSequencer/GridSequencerContainer'
import {ConnectedInfiniteSequencer} from '../InfiniteSequencer/InfiniteSequencer'
import {ConnectedBasicInstrumentView} from '../Instruments/BasicInstrumentView'
import {ConnectedKeyboard} from '../Keyboard/Keyboard'
import {ConnectedMasterControls} from '../MasterControls'
import {ConnectedVolumeControl} from '../Volume/VolumeControl'

interface ISimpleGraphNodeProps {
	positionId: string
}

interface ISimpleGraphNodeReduxProps {
	x: number
	y: number
	targetId: string
	targetType: ConnectionNodeType
}

type ISimpleGraphNodeAllProps = ISimpleGraphNodeProps & ISimpleGraphNodeReduxProps

// Using a normal function allows for component name to show in react dev tools
export function SimpleGraphNode({x, y, targetId, targetType}: ISimpleGraphNodeAllProps) {
	return <div
		className="simpleGraphNode"
		style={{
			position: 'absolute',
			top: y + 'px',
			left: x + 'px',
		}}
	>
		{getComponentByNodeType(targetType, targetId)}
	</div>
}

export function getComponentByNodeType(type: ConnectionNodeType, id: string) {
	switch (type) {
		case ConnectionNodeType.masterClock: return <ConnectedMasterControls />
		case ConnectionNodeType.audioOutput: return <ConnectedVolumeControl />

		case ConnectionNodeType.gridSequencer: return <ConnectedGridSequencerContainer id={id} />
		case ConnectionNodeType.infiniteSequencer: return <ConnectedInfiniteSequencer id={id} />
		case ConnectionNodeType.keyboard: return <ConnectedKeyboard id={id} />

		case ConnectionNodeType.instrument: return <ConnectedBasicInstrumentView id={id} />
		case ConnectionNodeType.sampler: return <ConnectedBasicSampler id={id} />

		default: return null
	}
}

export const ConnectedSimpleGraphNode = shamuConnect(
	(state, {positionId}: ISimpleGraphNodeProps): ISimpleGraphNodeReduxProps => {
		const position = selectPosition(state.room, positionId)!

		return {
			x: position.x,
			y: position.y,
			targetId: position.targetId,
			targetType: position.targetType,
		}
	},
)(SimpleGraphNode)
