import React, {useMemo} from 'react'
import {hot} from 'react-hot-loader'
import {useNumberChangedEvent, useObjectChangedEvent} from '../hooks/useCorgiEvent'
import {useExpPosition} from '../../react-hooks'
import {useNodeContext} from '../CorgiNode'
import {CssColor} from '@corgifm/common/shamu-color'
import {ExpMidiTrackNode} from './ExpMidiTrackNode'
import {clamp} from '@corgifm/common/common-utils'

export function getExpMidiTrackNodeView() {
	return <ExpMidiTrackNodeView />
}

interface Props {
}

export const ExpMidiTrackNodeView = hot(module)(React.memo(function _ExpMidiTrackNodeView({
}: Props) {
	const nodeContext = useNodeContext() as ExpMidiTrackNode
	const position = useExpPosition(nodeContext.id)

	return (
		<div
			style={{
				// color: CssColor.defaultGray,
				fontSize: 14,
				fontFamily: 'Ubuntu',
			}}
		>
			hello
		</div>
	)
}))
