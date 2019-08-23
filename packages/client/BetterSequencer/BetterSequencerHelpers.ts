import {getNodeInfo} from '@corgifm/common/redux'
import {MidiClipEvent} from '@corgifm/common/midi-types'
import {mouseFromScreenToBoard, makeMouseMovementAccountForGlobalZoom} from '../SimpleGlobalClientState'

export function getMaxPan(length: number, zoom: number) {
	return (length * zoom) - length
}

export function clientSpaceToPercentages(
	clientSpace: Point, nodePosition: Point, panPixels: Point, maxPanX: number,
	maxPanY: number, width: number, height: number,
) {
	const editorSpace = clientSpaceToEditorSpace(clientSpace, nodePosition)

	return editorSpaceToPercentages(
		editorSpace, panPixels, maxPanX, maxPanY, width, height)
}

export function editorSpaceToPercentages(
	editorSpace: Point, panPixels: Point, maxPanX: number, maxPanY: number,
	width: number, height: number,
): Point {
	const panSpace = {
		x: (editorSpace.x + panPixels.x) / (maxPanX + width),
		y: (editorSpace.y + panPixels.y) / (maxPanY + height),
		centerY: (height / 2 + panPixels.y) / (maxPanY + height),
	}

	return panSpace
}

export function clientSpaceToEditorSpace(
	clientSpace: Point, nodePosition: Point,
) {

	const boardSpace = mouseFromScreenToBoard(clientSpace)

	const nodeSpace = {
		x: boardSpace.x - nodePosition.x,
		y: boardSpace.y - nodePosition.y,
	}

	const nodeInfo = getNodeInfo().betterSequencer

	const editorSpace = {
		x: nodeSpace.x - nodeInfo.notesDisplayStartX,
		y: nodeSpace.y,
	}

	return editorSpace
}

export const eventToNote = (event: MidiClipEvent) => event.note

export function movementToBeats(movement: Point, lengthBeats: number, zoom: Point, width: number, height: number) {
	const a = makeMouseMovementAccountForGlobalZoom(movement)

	const scaledWidth = zoom.x * width
	const scaledHeight = zoom.y * height

	const percentageMovement = {
		x: (a.x / scaledWidth) * lengthBeats,
		y: a.y / scaledHeight, // maybe multiply by note count?
	}

	return percentageMovement
}

export function movementXToBeats(movementX: number, lengthBeats: number, zoomX: number, width: number) {
	const a = makeMouseMovementAccountForGlobalZoom({x: movementX, y: 0}).x

	const scaledWidth = zoomX * width

	const percentageMovement = a / scaledWidth

	return percentageMovement * lengthBeats
}

export function movementYToNote(movementY: number, rows: string[], zoomY: number, height: number) {
	const a = makeMouseMovementAccountForGlobalZoom({x: 0, y: movementY}).y

	const scaledHeight = zoomY * height

	const percentageMovement = a / scaledHeight

	return percentageMovement * rows.length
}
