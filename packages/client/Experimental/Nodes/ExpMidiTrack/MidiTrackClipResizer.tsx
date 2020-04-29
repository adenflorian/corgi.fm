import React, {useLayoutEffect, useRef, Fragment} from 'react'
import './MidiTrackClipResizer.less'

interface Props {
	clipId: Id
	handleMouseDown: (e: MouseEvent, direction: 'left' | 'right' | 'center', clipId: Id) => void
	width: number
}

const debug = false

const hitWidth = 6

export const MidiTrackClipResizer = React.memo(function _MidiTrackClipResizer({
	clipId, handleMouseDown, width,
}: Props) {

	const leftRef = useRef<HTMLDivElement>(null)
	const rightRef = useRef<HTMLDivElement>(null)
	const centerRef = useRef<HTMLDivElement>(null)

	useLayoutEffect(() => {
		const onMouseDownLeft = (e: MouseEvent) => {
			e.stopPropagation()
			handleMouseDown(e, 'left', clipId)
		}
		const onMouseDownRight = (e: MouseEvent) => {
			e.stopPropagation()
			handleMouseDown(e, 'right', clipId)
		}
		const onMouseDownCenter = (e: MouseEvent) => {
			e.stopPropagation()
			handleMouseDown(e, 'center', clipId)
		}

		const leftElement = leftRef.current
		const rightElement = rightRef.current
		const centerElement = centerRef.current

		if (leftElement === null || rightElement === null || centerElement === null) return

		leftElement.addEventListener('mousedown', onMouseDownLeft)
		rightElement.addEventListener('mousedown', onMouseDownRight)
		centerElement.addEventListener('mousedown', onMouseDownCenter)

		return () => {
			leftElement.removeEventListener('mousedown', onMouseDownLeft)
			rightElement.removeEventListener('mousedown', onMouseDownRight)
			centerElement.removeEventListener('mousedown', onMouseDownCenter)
		}
	}, [clipId, handleMouseDown])

	return (
		<div className="midiTrackClipResizer" style={{opacity: debug ? 0.5 : undefined, display: 'flex', position: 'absolute', height: '100%', zIndex: 3}}>
			<div
				style={{backgroundColor: debug ? 'red' : undefined, width: hitWidth}}
				className="resizeHandle left"
				ref={leftRef}
			/>
			<div
				style={{backgroundColor: debug ? 'blue' : undefined, width: Math.max(0, width - (hitWidth * 2)), left: hitWidth}}
				className="resizeHandle mid"
				ref={centerRef}
			/>
			<div
				style={{backgroundColor: debug ? 'green' : undefined, width: hitWidth, left: width - hitWidth}}
				className="resizeHandle right"
				ref={rightRef}
			/>
		</div>
	)
})
