import React, {useState, useCallback, useLayoutEffect, useRef, Fragment} from 'react'
import {ContextMenuTrigger} from 'react-contextmenu'
import {Set} from 'immutable'
import {
	selectLocalClientId, selectOptions, selectRoomSettings, IClientAppState,
	createAnimationFrameSelector, animationActions, RoomType,
} from '@corgifm/common/redux'
import {useSelector} from 'react-redux'
import {backgroundMenuId, graphSizeX, zoomBackgroundClass, expBackgroundMenuId} from '../client-constants'
import PlusSVG from '../OtherSVG/plus.svg'
import {simpleGlobalClientState} from '../SimpleGlobalClientState'

interface Props {
	children: React.ReactNode
}

const maxZoom = 4
const minZoom = -3
const scrollZoomMod = 0.002
const mouseZoomMod = 0.001
const mousePanMod = 1
const maxPan = graphSizeX
const defaultZoom = 0
const defaultZoomReal = 1
const defaultPan = {x: 0, y: 0} as const
// const zoomTextLength = Math.max(scrollZoomMod.toString().length, mouseZoomMod.toString().length)

const zoomLevels = {
	close: 1,
	defaultPlusSome: defaultZoom + 0.0001,
	default: defaultZoom,
	defaultMinusSome: defaultZoom - 0.0001,
	far: -1,
} as const

const zoomCloser = 'zoomCloser'
const zoomFarther = 'zoomFarther'
const zoomFar = 'zoomFar'
const zoomClose = 'zoomClose'
const zoomDefault = 'zoomDefault'
const zoomZoom = 'zoomZoom'

function getZoomClasses(): string {
	const zoom = Math.round(simpleGlobalClientState.zoomDisplay * 10) / 10

	return `${zoomZoom} ` + (zoom >= zoomLevels.close
		? zoomCloser
		: zoom <= zoomLevels.far
			? zoomFarther
			: zoom < zoomLevels.defaultMinusSome
				? zoomFar
				: zoom > zoomLevels.defaultPlusSome
					? zoomClose
					: zoomDefault)
}

export const globalZoomAnimParentKey = 'globalZoom'
export const globalZoomResetZoomAnimChildKey = 'resetZoom'
export const globalZoomResetPanAnimChildKey = 'resetPan'

export const createResetZoomAction = () => animationActions.trigger(Set([globalZoomAnimParentKey]), globalZoomResetZoomAnimChildKey)
export const createResetPanAction = () => animationActions.trigger(Set([globalZoomAnimParentKey]), globalZoomResetPanAnimChildKey)

export const ConnectedZoom = React.memo(function _Zoom({
	children,
}: Props) {

	const zoomRef = useRef<HTMLDivElement>(null)
	const backgroundRef = useRef<HTMLDivElement>(null)

	const triggerZoomReset = useSelector(createAnimationFrameSelector(globalZoomAnimParentKey, globalZoomResetZoomAnimChildKey))
	const triggerPanReset = useSelector(createAnimationFrameSelector(globalZoomAnimParentKey, globalZoomResetPanAnimChildKey))
	const requireCtrlToZoom = useSelector((state: IClientAppState) => selectOptions(state).requireCtrlToScroll)
	const fancyZoomPan = useSelector((state: IClientAppState) => selectOptions(state).graphicsExpensiveZoomPan)
	const disableMenu = useSelector((state: IClientAppState) => {
		const roomSettings = selectRoomSettings(state.room)
		return selectLocalClientId(state) !== roomSettings.ownerId && roomSettings.onlyOwnerCanDoStuff
	})

	const [backgroundClicked, setBackgroundClicked] = useState(false)
	const [startZoom, setStartZoom] = useState(simpleGlobalClientState.zoom)

	const clampPan = useCallback((pan2: number, zoom2: number = simpleGlobalClientState.zoom) => {
		return Math.min(maxPan * zoom2, Math.max(-maxPan * zoom2, pan2))
	}, [])

	const clampZoom = useCallback((val: number) => {
		return Math.min(maxZoom, Math.max(minZoom, val))
	}, [])

	// TODO Wait for animation frame?
	const updateRefs = useCallback((zoom = false) => {
		const zoomElement = zoomRef.current
		if (zoomElement) {
			// TODO Use CSS Typed Object Model
			zoomElement.style.transform = getTransform(simpleGlobalClientState.pan)

			const newZoomClasses = getZoomClasses()

			if (zoom && zoomElement.className !== newZoomClasses) {
				zoomElement.className = newZoomClasses
			}
		}
		const backgroundElement = backgroundRef.current
		if (backgroundElement) {
			// TODO Use CSS Typed Object Model
			backgroundElement.style.backgroundPosition = getBackgroundPosition(simpleGlobalClientState.pan)
			backgroundElement.style.backgroundSize = `${64 * simpleGlobalClientState.zoom}px`
		}
	}, [])

	const fixZoom = useCallback(() => {
		const zoomElement = zoomRef.current
		if (zoomElement) {
			// TODO Use CSS Typed Object Model
			zoomElement.style.transform = getTransform(simpleGlobalClientState.pan, 0.001)
		}
	}, [])

	useLayoutEffect(() => {
		if (!backgroundClicked && simpleGlobalClientState.zoom !== startZoom) {
			setTimeout(fixZoom, 10)
			setTimeout(updateRefs, 20)
		}
	}, [backgroundClicked, fixZoom, updateRefs, startZoom])

	const doZoom = useCallback((zoom2: number, clientX?: number, clientY?: number, controlKey = false) => {
		const newZoom = clampZoom(simpleGlobalClientState.zoomDisplay - zoom2)

		const newZoomReal = 2 ** newZoom

		const zoomDelta = newZoomReal - simpleGlobalClientState.zoom

		if (zoomDelta === 0) return

		const zoomPercentChange = (newZoomReal - simpleGlobalClientState.zoom) / simpleGlobalClientState.zoom

		const distanceFromCenterX = clientX && !controlKey ? clientX - (window.innerWidth / 2) : 0
		const distanceFromCenterY = clientY && !controlKey ? clientY - (window.innerHeight / 2) : 0

		const panX = ((distanceFromCenterX * zoomPercentChange) / newZoomReal)
		const panY = ((distanceFromCenterY * zoomPercentChange) / newZoomReal)

		simpleGlobalClientState.zoom = newZoomReal
		simpleGlobalClientState.zoomDisplay = newZoom
		simpleGlobalClientState.pan.x = clampPan(simpleGlobalClientState.pan.x - panX, newZoomReal)
		simpleGlobalClientState.pan.y = clampPan(simpleGlobalClientState.pan.y - panY, newZoomReal)

		updateRefs(true)
	}, [clampPan, clampZoom, updateRefs])

	const doPan = useCallback((x = 0, y = 0) => {
		simpleGlobalClientState.pan.x = clampPan(simpleGlobalClientState.pan.x + (x * mousePanMod / simpleGlobalClientState.zoom))
		simpleGlobalClientState.pan.y = clampPan(simpleGlobalClientState.pan.y + (y * mousePanMod / simpleGlobalClientState.zoom))

		updateRefs()
	}, [clampPan, updateRefs])

	const onBgMouseEvent = useCallback((e: React.MouseEvent) => {
		if (e.type === 'mousedown' && (e.buttons === 1 || (e.buttons === 4 && !e.shiftKey))) {
			setBackgroundClicked(true)
			setStartZoom(simpleGlobalClientState.zoom)
		}
	}, [])

	const onMouseWheel = useCallback((e: WheelEvent) => {
		// Turning off rounding so that two finger track pad scrolling will be smooth
		// TODO Detect if scroll amount is small or large, if large, round it
		if (requireCtrlToZoom === false || e.ctrlKey) {
			doZoom(e.deltaY * scrollZoomMod, e.clientX, e.clientY, e.ctrlKey)
		} else {
			doPan(-e.deltaX, -e.deltaY)
		}
		e.preventDefault()
	}, [doPan, doZoom, requireCtrlToZoom])

	const onMouseMove = useCallback((e: MouseEvent) => {
		if (backgroundClicked && (e.buttons !== 1 && e.buttons !== 4)) {
			setBackgroundClicked(false)
		}
		if (e.buttons === 4 && !e.shiftKey) {
			doPan(e.movementX, e.movementY)
		}
		if (backgroundClicked && e.buttons === 1) {
			if (e.ctrlKey) {
				doZoom(e.movementY * mouseZoomMod)
			} else {
				doPan(e.movementX, e.movementY)
			}
		}
	}, [backgroundClicked, doPan, doZoom])

	const onMouseUp = useCallback(() => {
		if (backgroundClicked) {
			setBackgroundClicked(false)
		}
	}, [backgroundClicked])

	useLayoutEffect(() => {
		window.addEventListener('wheel', onMouseWheel, {passive: false})
		window.addEventListener('mousemove', onMouseMove)
		window.addEventListener('mouseup', onMouseUp)

		return () => {
			window.removeEventListener('wheel', onMouseWheel)
			window.removeEventListener('mousemove', onMouseMove)
			window.removeEventListener('mouseup', onMouseUp)
		}
	}, [onMouseMove, onMouseWheel, onMouseUp])

	const resetZoom = useCallback(() => {
		simpleGlobalClientState.zoom = defaultZoomReal
		simpleGlobalClientState.zoomDisplay = defaultZoom
		updateRefs(true)
	}, [updateRefs])

	const resetPan = useCallback(() => {
		simpleGlobalClientState.pan.x = defaultPan.x
		simpleGlobalClientState.pan.y = defaultPan.y
		updateRefs()
	}, [updateRefs])

	useLayoutEffect(() => {
		resetZoom()
	}, [resetZoom, triggerZoomReset])

	useLayoutEffect(() => {
		resetPan()
	}, [resetPan, triggerPanReset])

	const roomType = useSelector((state: IClientAppState) => state.room.roomInfo.roomType)

	return (
		<Fragment>
			{
				// @ts-ignore disableIfShiftIsPressed
				<ContextMenuTrigger
					id={roomType === RoomType.Experimental ? expBackgroundMenuId : backgroundMenuId}
					disableIfShiftIsPressed={true}
					holdToDisplay={-1}
					disable={disableMenu}
				>
					<div
						ref={backgroundRef}
						className={zoomBackgroundClass}
						style={{
							position: 'fixed',
							width: `100vw`,
							height: `100vh`,
							top: `0`,
							left: `0`,
							backgroundImage: `url(${PlusSVG})`,
							// transition: backgroundClicked ? '' : 'background-size 0.05s ease 0s, background-position 0.05s ease 0s',
						}}
						onMouseDown={onBgMouseEvent}
					/>
				</ContextMenuTrigger>
			}
			<div
				ref={zoomRef}
				className={getZoomClasses()}
				style={{
					// Might not need this with the hack in SimpleGraphNode
					// willChange: backgroundClicked || !fancyZoomPan ? 'transform' : '',
					// transition: backgroundClicked ? '' : 'transform 0.05s ease 0s',
					// overflow: 'hidden',
				}}
			>
				{children}
			</div>
			{backgroundClicked && <div className="zoomBlock" />}
		</Fragment>
	)
})

function getBackgroundPosition(pan: Point): string {
	return `calc(50% + ${pan.x * simpleGlobalClientState.zoom}px) calc(50% + ${pan.y * simpleGlobalClientState.zoom}px)`
}

function getTransform(pan: Point, zoomDelta = 0): string {
	return `scale(${simpleGlobalClientState.zoom + zoomDelta}) translate(${pan.x}px, ${pan.y}px)`
}

export function toGraphSpace(x = 0, y = 0) {
	const zoom = simpleGlobalClientState.zoom
	const pan = simpleGlobalClientState.pan

	return {
		x: ((x - (window.innerWidth / 2)) / zoom) - pan.x,
		y: ((y - (window.innerHeight / 2)) / zoom) - pan.y,
	} as const
}

export function fromGraphSpace(x = 0, y = 0) {
	const zoom = simpleGlobalClientState.zoom
	const pan = simpleGlobalClientState.pan

	return {
		x: ((x + pan.x) * zoom) + (window.innerWidth / 2),
		y: ((y + pan.y) * zoom) + (window.innerHeight / 2),
	} as const
}
