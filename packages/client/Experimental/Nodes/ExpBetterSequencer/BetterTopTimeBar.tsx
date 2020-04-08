import React, {useState, useCallback, useLayoutEffect, Fragment} from 'react'
import {useDispatch} from 'react-redux'
import {Set} from 'immutable'
import {expMidiPatternsActions} from '@corgifm/common/redux'
import {smallestNoteLength, loopBarHeight, betterSideNotesWidth, topTimeBarHeight} from '@corgifm/common/BetterConstants'
import {sumPoints} from '@corgifm/common/common-utils'
import {MIN_MIDI_NOTE_NUMBER_0, MAX_MIDI_NOTE_NUMBER_127} from '@corgifm/common/common-constants'
import {oneLine} from 'common-tags'
import {BetterNote} from './BetterNote'
import {movementXToBeats} from './BetterSequencerHelpers'
import {SeqEvents, duplicateNoteEvent, SeqPattern} from '@corgifm/common/SeqStuff'
import {CssColor} from '@corgifm/common/shamu-color'
import {useNodeContext} from '../../CorgiNode'
import {ExpBetterSequencerNode} from './ExpBetterSequencerNode'
import {useObjectChangedEvent} from '../../hooks/useCorgiEvent'

interface Props {
	readonly columnWidth: number
	readonly onTopZoomPanBarMouseDown: (e: React.MouseEvent) => void
}

export const BetterTopTimeBar = React.memo(function _BetterTopTimeBar({
	columnWidth, onTopZoomPanBarMouseDown,
}: Props) {

	const dispatch = useDispatch()
	const nodeContext = useNodeContext() as ExpBetterSequencerNode
	const expMidiPatternView = useObjectChangedEvent(nodeContext.midiPatternParam.value)

	const loopMarkerStart = expMidiPatternView.loopStartBeat * columnWidth
	const loopMarkerEnd = expMidiPatternView.loopEndBeat * columnWidth

	

	return (
		<div
			className={oneLine`
				topTimeBar
			`}
			style={{
				height: topTimeBarHeight,
				width: '100%',
				backgroundColor: CssColor.panelGray,
				position: 'relative',
			}}
			onMouseDown={onTopZoomPanBarMouseDown}
		>
			<div className="loopBracket" style={{
				height: '100%',
				width: loopMarkerEnd - loopMarkerStart - 2,
				backgroundColor: CssColor.panelGrayLight,
				position: 'absolute',
				left: loopMarkerStart + 1,
			}} />
		</div>
	)
})
