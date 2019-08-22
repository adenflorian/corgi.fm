import {getNodeInfo} from '@corgifm/common/redux'
import {mouseFromScreenToBoard, makeMouseMovementAccountForGlobalZoom} from '../SimpleGlobalClientState'
import {MidiClipEvent} from '@corgifm/common/midi-types';

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

export function movementXToBeats(movementX: number, lengthBeats: number, zoomX: number, width: number) {
	const a = makeMouseMovementAccountForGlobalZoom({x: movementX, y: 0}).x

	const scaledWidth = zoomX * width

	const percentageMovement = a / scaledWidth

	return percentageMovement * lengthBeats
}
