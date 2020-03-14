import React, {useRef, useLayoutEffect} from 'react'
import {useDispatch} from 'react-redux'
import {midiNoteToNoteNameFull} from '@corgifm/common/common-samples-stuff'
import {expMidiPatternsActions} from '@corgifm/common/redux'
import {smallNoteHeight, tinyNoteHeight} from '@corgifm/common/BetterConstants'
import {CssColor} from '@corgifm/common/shamu-color'
import {BetterNoteResizer} from './BetterNoteResizer'
import {SeqEvent} from '@corgifm/common/SeqStuff'
import {useNodeContext} from '../../CorgiNode'
import {ExpBetterSequencerNode} from '../ExpBetterSequencerNode'
import {useObjectChangedEvent} from '../../hooks/useCorgiEvent'

interface Props {
	event: SeqEvent
	noteHeight: number
	columnWidth: number
	isSelected: boolean
	onNoteSelect: (eventId: Id, select: boolean, clear: boolean) => void
	handleMouseDown: (e: MouseEvent, direction: 'left' | 'right' | 'center', eventId: Id) => void
	rows: string[]
}

export const BetterNote = React.memo(function _BetterNote({
	event, noteHeight, columnWidth, isSelected,
	onNoteSelect, handleMouseDown, rows,
}: Props) {

	const dispatch = useDispatch()
	const noteLabel = midiNoteToNoteNameFull(event.note)

	const mainRef = useRef<SVGSVGElement>(null)

	const nodeContext = useNodeContext() as ExpBetterSequencerNode
	const expMidiPattern = useObjectChangedEvent(nodeContext.midiPatternParam.value)

	useLayoutEffect(() => {

		// TODO I don't think this ever gets called
		// It gets intercepted by the resizer
		const onMouseDown = (e: MouseEvent) => {
			if (e.button !== 0) return
			e.stopPropagation()
			if (e.shiftKey) {
				onNoteSelect(event.id, !isSelected, false)
			} else {
				onNoteSelect(event.id, true, true)
			}
		}

		const onDoubleClick = (e: MouseEvent) => {
			e.preventDefault()
			e.stopPropagation()
			dispatch(expMidiPatternsActions.deleteEvents(expMidiPattern.id, [event.id]))
		}

		const noteElement = mainRef.current

		if (noteElement === null) return

		noteElement.addEventListener('dblclick', onDoubleClick)
		noteElement.addEventListener('mousedown', onMouseDown)

		return () => {
			noteElement.removeEventListener('dblclick', onDoubleClick)
			noteElement.removeEventListener('mousedown', onMouseDown)
		}
	}, [onNoteSelect, event.id, isSelected, expMidiPattern.id, dispatch])

	const tiny = noteHeight <= tinyNoteHeight
	const small = noteHeight <= smallNoteHeight
	const actualHeight = noteHeight - (tiny ? 0 : 2)
	const useBorder = !tiny
	const borderThickness = 2
	const width = Math.max(1, event.duration * columnWidth)

	return (
		<svg
			className={`note selected-${isSelected} ${tiny ? 'tiny' : ''}`}
			x={event.startBeat * columnWidth}
			y={((rows.length - event.note) * noteHeight) - noteHeight + (tiny ? 0 : 1)}
			width={width}
			height={actualHeight}
			ref={mainRef}
		>
			<rect
				className={`noteBackground`}
				width={width - (useBorder ? 2 : 0)}
				height={actualHeight - (useBorder ? 2 : 0)}
				x={useBorder ? 1 : 0}
				y={useBorder ? 1 : 0}
				fill={tiny && isSelected ? CssColor.defaultGray : 'currentColor'}
			>
				<title>{noteLabel}</title>
			</rect>
			<text
				className="noteLabel"
				style={{
					display: small ? 'none' : undefined,
				}}
				x={8}
				y={actualHeight / 1.5}
			>
				{noteLabel}
			</text>
			<rect
				className={`noteBorder`}
				width="100%"
				height="100%"
				strokeWidth={borderThickness * 2}
				stroke={!useBorder ? 'none' : isSelected ? CssColor.defaultGray : CssColor.panelGrayDark}
			>
				<title>{noteLabel}</title>
			</rect>
			<BetterNoteResizer {...{handleMouseDown, eventId: event.id, noteHeight, width}} />
		</svg>
	)
})
