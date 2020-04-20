import React, {useMemo} from 'react'
import {hot} from 'react-hot-loader'
import {useNumberChangedEvent, useObjectChangedEvent} from '../hooks/useCorgiEvent'
import {useExpPosition} from '../../react-hooks'
import {useNodeContext} from '../CorgiNode'
import {CssColor} from '@corgifm/common/shamu-color'
import {ExpMidiTrackNode} from './ExpMidiTrackNode'
import {clamp} from '@corgifm/common/common-utils'
import {mainBorderRadius} from '../../client-constants'
import {MidiTrackViewControls} from './ExpMidiTrack/MidiTrackViewControls'
import {MidiTrackViewEditor} from './ExpMidiTrack/MidiTrackViewEditor'

export function getExpMidiTrackNodeView() {
	return <ExpMidiTrackNodeView />
}

interface Props {
}

const offsetY = 232
const controlsWidth = 200

export const ExpMidiTrackNodeView = hot(module)(React.memo(function _ExpMidiTrackNodeView({
}: Props) {
	const nodeContext = useNodeContext() as ExpMidiTrackNode
	const position = useExpPosition(nodeContext.id)
	// const track = useObjectChangedEvent(nodeContext.midiTimelineTrackParam.value)
	const componentHeight = position.height - offsetY

	return (
		<div
			style={{
				// color: CssColor.defaultGray,
				fontSize: 14,
				fontFamily: 'Ubuntu',
				display: 'flex',
				width: '100%',
				height: componentHeight,
			}}
		>
			<div
				className="controls"
				style={{
					width: controlsWidth,
					height: '100%',
					backgroundColor: CssColor.panelGrayLight,
					borderBottomLeftRadius: mainBorderRadius,
				}}
			>
				<MidiTrackViewControls />
			</div>
			<div
				className="editor"
				style={{
					width: '100%',
					height: '100%',
					backgroundColor: CssColor.panelGrayDark,
					borderBottomRightRadius: mainBorderRadius,
				}}
			>
				<MidiTrackViewEditor />
			</div>
		</div>
	)
}))
