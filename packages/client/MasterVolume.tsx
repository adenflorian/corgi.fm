import React, {useCallback, useLayoutEffect, useState} from 'react'
import {CssColor} from '@corgifm/common/shamu-color'
import {useLocalVolume, useBoolean, useLocalMute} from './react-hooks'
import {hot} from 'react-hot-loader'
import {useStore} from 'react-redux'
import {setOption, AppOptions} from '@corgifm/common/redux'
import {clamp} from '@corgifm/common/common-utils'
import {FiVolumeX, FiVolume1, FiVolume2} from 'react-icons/fi'

const width = 160
const sliderSize = 16
const slidableDistance = width - sliderSize
const lineSize = sliderSize / 2

export const MasterVolume = hot(module)(React.memo(function _MasterVolume() {
	const mute = useLocalMute()
	let volume = useLocalVolume()
	volume = mute ? 0 : volume

	const [isSliderActive, activateSlider, deactivateSlider] = useBoolean(false)
	const [startingVolume, setStartingVolume] = useState(0)
	const [persistentDelta, setPersistentDelta] = useState(0)

	const onClickSlider = useCallback(() => {
		setStartingVolume(volume)
		setPersistentDelta(0)
		activateSlider()
	}, [activateSlider, volume])

	const {dispatch, getState} = useStore()

	useLayoutEffect(() => {
		if (!isSliderActive) return

		const onMouseUp = () => {
			deactivateSlider()
		}

		const onMouseMove = (e: MouseEvent) => {
			const delta = e.movementX / slidableDistance
			const newPersistentDelta = persistentDelta + delta
			const newVolume = clamp(startingVolume + newPersistentDelta, 0, 1)
			setPersistentDelta(newPersistentDelta)
			if (mute) dispatch(setOption(AppOptions.masterVolumeMute, false))
			dispatch(setOption(AppOptions.masterVolume, newVolume))
		}

		window.addEventListener('mouseup', onMouseUp)
		window.addEventListener('mousemove', onMouseMove)

		return () => {
			window.removeEventListener('mouseup', onMouseUp)
			window.removeEventListener('mousemove', onMouseMove)
		}
	}, [isSliderActive, dispatch, persistentDelta, setPersistentDelta, startingVolume, mute])

	const onMuteClick = useCallback(() => {
		dispatch(setOption(AppOptions.masterVolumeMute, !mute))
	}, [mute])

	return (
		<div
			className="masterVolume blob"
			style={{
				pointerEvents: 'all',
				userSelect: 'none',
				color: CssColor.blue,
			}}
			title="This controls your local master volume, and won't affect anyone else"
		>
			<div className='blobDark' onClick={onMuteClick} style={{fontSize: 16 + 8}}>
				{(mute || volume === 0) ? <FiVolumeX /> : volume > 0.5 ? <FiVolume2 /> : <FiVolume1 />}
			</div>
			<div
				className="rail"
				style={{
					width,
					position: 'relative',
				}}
			>
				<div
					className="colorLine"
					style={{
						position: 'absolute',
						backgroundColor: 'currentColor',
						borderRadius: lineSize / 2,
						width: (slidableDistance * volume) + (sliderSize / 2),
						height: lineSize,
					}}
				/>
				<div
					className="slider"
					style={{
						position: 'absolute',
						zIndex: 1,
						backgroundColor: CssColor.defaultGray,
						borderRadius: sliderSize / 2,
						marginLeft: slidableDistance * volume,
						width: sliderSize,
						height: sliderSize,
					}}
					onMouseDown={onClickSlider}
				/>
			</div>
		</div>
	)
}))
