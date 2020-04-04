import React, {useCallback, useLayoutEffect, useState} from 'react'
import {CssColor} from '@corgifm/common/shamu-color'
import {useLocalVolume, useBoolean, useLocalMute} from './react-hooks'
import {hot} from 'react-hot-loader'
import {useStore} from 'react-redux'
import {setOption, AppOptions, selectOption} from '@corgifm/common/redux'
import {clamp} from '@corgifm/common/common-utils'

const width = 160
const sliderSize = 16
const slidableDistance = width - sliderSize

export const MasterVolume = hot(module)(React.memo(function _MasterVolume() {
	const volume = useLocalVolume()
	const mute = useLocalMute()

	const [isSliderActive, activateSlider, deactivateSlider] = useBoolean(false)
	const [startingVolume, setStartingVolume] = useState(0)
	const [persistentDelta, setPersistentDelta] = useState(0)

	const onClickSlider = useCallback(() => {
		const currentVolume = selectOption(getState(), AppOptions.masterVolume) as number
		setStartingVolume(currentVolume)
		setPersistentDelta(0)
		activateSlider()
	}, [activateSlider])

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
			dispatch(setOption(AppOptions.masterVolume, newVolume))
		}

		window.addEventListener('mouseup', onMouseUp)
		window.addEventListener('mousemove', onMouseMove)

		return () => {
			window.removeEventListener('mouseup', onMouseUp)
			window.removeEventListener('mousemove', onMouseMove)
		}
	}, [isSliderActive, dispatch, persistentDelta, setPersistentDelta, startingVolume])

	const onMuteClick = useCallback(() => {
		dispatch(setOption(AppOptions.masterVolumeMute, !mute))
	}, [mute])

	return (
		<div
			className="masterVolume blob"
			style={{
				pointerEvents: 'all',
				userSelect: 'none',
				color: mute ? CssColor.brightRed : CssColor.defaultGray,
			}}
		>
			<div className='blobDark'>
				local volume {(volume * 100).toFixed(0)}%
			</div>
			<div className="rail" style={{
				width,
			}}>
				<div
					className="slider"
					style={{
						backgroundColor: CssColor.defaultGray,
						borderRadius: 8,
						marginLeft: slidableDistance * volume,
						width: sliderSize,
						height: sliderSize,
					}}
					onMouseDown={onClickSlider}
				></div>
			</div>
			<div className='blobDark' onClick={onMuteClick}>
				{mute ? 'muted' : 'not muted'}
			</div>
		</div>
	)
}))
