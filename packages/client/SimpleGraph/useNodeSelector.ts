import React, {useState, useCallback, useLayoutEffect} from 'react'
import Immutable, {Set} from 'immutable'
import {useSelector, useDispatch, useStore} from 'react-redux'
import {
	IClientAppState, selectExpAllPositions,
	shamuMetaActions, selectExpNodesState,
	selectRoomMember, selectLocalClientId, selectExpGraphsState,
} from '@corgifm/common/redux'
import {useBoolean, useRoomType} from '../react-hooks'
import {mouseFromScreenToBoard} from '../SimpleGlobalClientState'
import {CorgiObjectChangedEvent} from '../Experimental/CorgiEvents'
import {RoomType} from '@corgifm/common/common-types'

export const NodeSelectorContext = React.createContext<NodeSelectorContextValue>({
	onSelectedNodeIdsChange: new CorgiObjectChangedEvent(Set<Id>()),
})

interface NodeSelectorContextValue {
	readonly onSelectedNodeIdsChange: CorgiObjectChangedEvent<Set<Id>>
}

const emptySet = Immutable.Set()

export function useNodeSelector() {
	const [boxActive, activateBox, deactivateBox] = useBoolean(false)
	const [boxOrigin, setBoxOrigin] = useState({x: 0, y: 0})
	const [otherCorner, setOtherCorner] = useState({x: 0, y: 0})

	const roomType = useRoomType()
	const selected = useSelector((state: IClientAppState) => roomType === RoomType.Experimental
		? selectExpGraphsState(state.room).mainGraph.positions.meta.selectedNodes
		: emptySet)
	const [originalSelected, setOriginalSelected] = useState(Set<Id>())

	const [nodeSelectorContextValue] = useState<NodeSelectorContextValue>({
		onSelectedNodeIdsChange: new CorgiObjectChangedEvent(selected),
	})


	const dispatch = useDispatch()
	const store = useStore()

	const onMouseDown = useCallback((e: MouseEvent) => {
		if (e.button !== 0) return
		setBoxOrigin({x: e.clientX, y: e.clientY})
		setOtherCorner({x: e.clientX, y: e.clientY})
		if (e.shiftKey) {
			setOriginalSelected(selected)
		} else {
			setOriginalSelected(Set())
			dispatch(shamuMetaActions.clearSelectedNodes())
		}
		activateBox()
	}, [activateBox, dispatch, selected])

	useLayoutEffect(() => {
		if (!boxActive || roomType !== RoomType.Experimental) return

		const onMouseUp = (e: MouseEvent) => {
			if (e.button !== 0) return
			if (boxActive) {
				deactivateBox()
				selectNodes(undefined, e.shiftKey)
			}
		}

		const onMouseMove = (e: MouseEvent) => {
			if (e.buttons !== 1) return deactivateBox()
			setOtherCorner({x: e.clientX, y: e.clientY})
			selectNodes({x: e.clientX, y: e.clientY}, e.shiftKey)
		}

		function selectNodes(otherCorner2 = otherCorner, preserve = false) {
			const originPercentages = mouseFromScreenToBoard(boxOrigin)
			const otherCornerPercentages = mouseFromScreenToBoard(otherCorner2)
			const box = {
				top: Math.min(originPercentages.y, otherCornerPercentages.y),
				bottom: Math.max(originPercentages.y, otherCornerPercentages.y),
				left: Math.min(originPercentages.x, otherCornerPercentages.x),
				right: Math.max(originPercentages.x, otherCornerPercentages.x),
			}

			const state = store.getState()
			const expPositions = selectExpAllPositions(state.room)
			const expNodes = selectExpNodesState(state.room)
			const currentGroupId = selectRoomMember(state.room, selectLocalClientId(state)).groupNodeId

			const insideBox = expNodes
				.filter(x => x.groupId === currentGroupId)
				.map(x => expPositions.get(x.id)!)
				.filter(
					z =>
						z.y >= box.top &&
						z.y + z.height <= box.bottom &&
						z.x >= box.left &&
						z.x + z.width <= box.right
				)
				.keySeq()
				.toSet()

			const toFlip = preserve
				? insideBox.filter(i => originalSelected.has(i))
				: Set()

			const newSelected = insideBox
				.concat(preserve ? originalSelected : [])
				.filter(i => !toFlip.has(i))

			if (Immutable.is(selected, newSelected)) return

			dispatch(shamuMetaActions.setSelectedNodes(newSelected))
		}

		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key.toLowerCase() === 'shift') {
				selectNodes(otherCorner, true)
			}
		}

		const onKeyUp = (e: KeyboardEvent) => {
			if (e.key.toLowerCase() === 'shift') {
				selectNodes(otherCorner, false)
			}
		}

		window.addEventListener('mousemove', onMouseMove)
		window.addEventListener('mouseup', onMouseUp)
		document.addEventListener('keydown', onKeyDown)
		document.addEventListener('keyup', onKeyUp)

		return () => {
			window.removeEventListener('mousemove', onMouseMove)
			window.removeEventListener('mouseup', onMouseUp)
			document.removeEventListener('keydown', onKeyDown)
			document.removeEventListener('keyup', onKeyUp)
		}
	}, [activateBox, boxActive, boxOrigin, deactivateBox, dispatch, originalSelected, otherCorner, roomType, selected])

	return [onMouseDown, boxOrigin, otherCorner, boxActive, nodeSelectorContextValue] as const
}
