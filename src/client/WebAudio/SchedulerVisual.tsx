import {Map, OrderedMap} from 'immutable'
import {string} from 'prop-types'
import * as React from 'react'
import ReactDOM from 'react-dom'
import {logger} from '../../common/logger'
import {IMidiNote} from '../../common/MidiNote'
import {getCurrentSongIsPlaying, getCurrentSongTime} from '../note-scanner'
import {Voice} from './Instrument'

interface Props {
	scheduledVoices: OrderedMap<number, Voice>
}

const xScale = 20
const height = 50
const width = 256

const SchedulerVisual = function SchedulerVisual_({scheduledVoices}: Props) {
	return (
		<div
			style={{
				position: 'relative',
				top: 8,
				width,
				height,
			}}
		>
			{scheduledVoices.map(voice => {
				return (
					<div
						style={{
							position: 'absolute',
							fill: 'none',
							width,
							height,
						}}
						key={voice.id}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							style={{
								width: '100%',
								height: '100%',
							}}
						>
							<path
								d={getPathDForVoice(voice)}
								stroke="white"
								strokeWidth={1}
							/>
						</svg>
					</div>
				)
			}).valueSeq()}
			<div
				style={{
					position: 'absolute',
					fill: 'none',
					width,
					height,
				}}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d={
							` M ${width / 2} ${1 * height}` +
							` L ${width / 2} 0`
						}
						stroke="green"
						strokeWidth={1}
						strokeDasharray={4}
					/>
				</svg>
			</div>
		</div>
	)
}

function getPathDForVoice(voice: Voice) {
	const xShift = (-_audioContext.currentTime)
	const xOffset = width / 2

	return (
		` M ${((voice.getScheduledAttackStartTime() + xShift) * xScale) + xOffset} ${height}` +
		` L ${((voice.getScheduledAttackEndTime() + xShift) * xScale) + xOffset} ${(-height * voice.getScheduledSustainAtAttackEnd()) + height}` +
		` L ${Math.min(1000, ((voice.getScheduledReleaseStartTimeSeconds() + xShift) * xScale) + xOffset)} ${(-height * voice.getScheduledSustainAtReleaseStart()) + height}` +
		` L ${Math.min(1000, ((voice.getScheduledReleaseEndTimeSeconds() + xShift) * xScale) + xOffset)} ${(-height * voice.getScheduledSustainAtReleaseEnd()) + height}`
	)
}

let _instruments = Map<string, OrderedMap<number, Voice>>()
let _audioContext: AudioContext

function renderSchedulerVisual(id: string, scheduledVoices: OrderedMap<number, Voice>) {
	ReactDOM.render(
		<SchedulerVisual scheduledVoices={scheduledVoices} />,
		document.getElementById('scheduleVisual-' + id),
	)
}

export function updateSchedulerVisual(id: string, scheduledVoices: OrderedMap<number, Voice>, audioContext: AudioContext) {
	if (!_audioContext) _audioContext = audioContext

	if (_instruments.has(id) === false) {
		_instruments = _instruments.set(id, scheduledVoices)
	} else {
		_instruments = _instruments.update(id, x => x.merge(scheduledVoices))
	}

	const currentTime = _audioContext.currentTime

	_instruments = _instruments.update(id, x => x.filter(y => y.getScheduledReleaseEndTimeSeconds() >= currentTime - 10))

	// renderSchedulerVisual(id, _instruments.get(id)!)
}

renderLoop()

function renderLoop() {
	if (getCurrentSongIsPlaying()) {
		_instruments.forEach((val, key) => {
			renderSchedulerVisual(key, val)
		})
	}

	requestAnimationFrame(renderLoop)
}

window.addEventListener('keydown', e => {
	if (e.key === 'b') {
		logger.log('_instruments: ', _instruments.toJS())
	}
})
