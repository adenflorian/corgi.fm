import React, {useState, useCallback, useLayoutEffect, Fragment} from 'react'
import {useDispatch} from 'react-redux'
import {Set} from 'immutable'
import {expMidiPatternsActions} from '@corgifm/common/redux'
import {smallestNoteLength, loopBarHeight, betterSideNotesWidth} from '@corgifm/common/BetterConstants'
import {sumPoints} from '@corgifm/common/common-utils'
import {MIN_MIDI_NOTE_NUMBER_0, MAX_MIDI_NOTE_NUMBER_127} from '@corgifm/common/common-constants'
import {oneLine} from 'common-tags'
import {BetterNote} from './BetterNote'
import {movementXToBeats} from './BetterSequencerHelpers'
import {SeqEvents, duplicateNoteEvent, SeqPattern} from '@corgifm/common/SeqStuff'
import {CssColor} from '@corgifm/common/shamu-color'
import {useNodeContext} from '../../CorgiNode'
import {ExpBetterSequencerNode} from '../ExpBetterSequencerNode'
import {useObjectChangedEvent} from '../../hooks/useCorgiEvent'

interface Props {
	readonly width: number
	readonly columnWidth: number
}

export const BetterLoopBar = React.memo(function _BetterLoopBar({width, columnWidth}: Props) {

	const dispatch = useDispatch()
	const nodeContext = useNodeContext() as ExpBetterSequencerNode
	const expMidiPatternView = useObjectChangedEvent(nodeContext.midiPatternParam.value)

	const loopMarkerStart = expMidiPatternView.loopStartBeat * columnWidth
	const loopMarkerEnd = expMidiPatternView.loopEndBeat * columnWidth

	

	return (
		<div
			className={oneLine`
				loopBar
			`}
			style={{
				height: loopBarHeight,
				width: '100%',
				backgroundColor: CssColor.panelGray,
				position: 'relative',

			}}
		>
			<div className="loopBracket" style={{
				marginTop: 1,
				height: loopBarHeight - 2,
				width: loopMarkerEnd - loopMarkerStart - 2,
				backgroundColor: 'currentColor',
				position: 'absolute',
				left: loopMarkerStart + 1,
				// border: '1px solid ' + CssColor.panelGrayLight,
				boxSizing: 'border-box',
			}} />
			<div className="loopStart" style={{
				height: 0,
				width: 0,
				// backgroundColor: CssColor.panelGrayDark,
				position: 'absolute',
				left: loopMarkerStart,
				// borderTopRightRadius: loopBarHeight,
				// borderBottomRightRadius: loopBarHeight,
				borderTop: `${loopBarHeight / 2}px solid transparent`,
				borderBottom: `${loopBarHeight / 2}px solid transparent`,
				borderLeft: `${loopBarHeight / 1.5}px solid ${CssColor.panelGrayDark}`,
			}} />
			{/* <div className="loopEnd" style={{
				height: loopBarHeight,
				width: loopBarHeight,
				backgroundColor: CssColor.panelGrayDark,
				position: 'absolute',
				left: loopMarkerEnd - loopBarHeight,
				borderTopLeftRadius: loopBarHeight,
				borderBottomLeftRadius: loopBarHeight,
			}} /> */}
			<div className="loopEnd" style={{
				height: 0,
				width: 0,
				// backgroundColor: CssColor.panelGrayDark,
				position: 'absolute',
				left: loopMarkerEnd - (loopBarHeight / 1.5),
				// borderTopLeftRadius: loopBarHeight,
				// borderBottomLeftRadius: loopBarHeight,
				borderTop: `${loopBarHeight / 2}px solid transparent`,
				borderBottom: `${loopBarHeight / 2}px solid transparent`,
				borderRight: `${loopBarHeight / 1.5}px solid ${CssColor.panelGrayDark}`,
			}} />
		</div>
	)
})
