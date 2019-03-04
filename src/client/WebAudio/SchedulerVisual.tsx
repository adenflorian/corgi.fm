import {Map, OrderedMap} from 'immutable'
import * as React from 'react'
import ReactDOM from 'react-dom'
import {Store} from 'redux'
import {logger} from '../../common/logger'
import {AppOptions, IClientAppState, selectOption, shamuConnect} from '../../common/redux'
import {getCurrentSongIsPlaying} from '../note-scanner'
import {Voice} from './Instrument'

interface Props {
	scheduledVoices: OrderedMap<number, Voice>
}

const xScale = 20
const height = 50
const width = 256

let _store: Store<IClientAppState>

export function setStoreForSchedulerVisual(store: Store<IClientAppState>) {
	_store = store
}

interface NoteSchedulerVisualPlaceholderProps {
	id: string
}

interface NoteSchedulerVisualPlaceholderReduxProps {
	showNoteSchedulerDebug: boolean
}

type NoteSchedulerVisualPlaceholderAllProps = NoteSchedulerVisualPlaceholderProps & NoteSchedulerVisualPlaceholderReduxProps

export const NoteSchedulerVisualPlaceholder =
	React.memo(function _NoteSchedulerVisualPlaceholder(props: NoteSchedulerVisualPlaceholderAllProps) {
		if (props.showNoteSchedulerDebug) {
			return (
				<div
					id={'scheduleVisual-' + props.id}
					style={{
						pointerEvents: 'none',
						position: 'relative',
						top: 2,
						backgroundColor: '#29292f40',
						height: 50,
					}}
				>
				</div>
			)
		} else {
			return null
		}
	})

export const ConnectedNoteSchedulerVisualPlaceholder = shamuConnect(
	state => ({
		showNoteSchedulerDebug: selectOption(state, AppOptions.showNoteSchedulerDebug) as boolean,
	}),
)(NoteSchedulerVisualPlaceholder)

const SchedulerVisual = function SchedulerVisual_({scheduledVoices}: Props) {
	return (
		<div
			style={{
				position: 'relative',
				top: 2,
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
						stroke="lime"
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
		` M ` +
		`   ${((voice.getScheduledAttackStartTime() + xShift) * xScale) + xOffset} ` +
		`   ${height}` +
		` L ` +
		`   ${((voice.getScheduledAttackEndTime() + xShift) * xScale) + xOffset} ` +
		`   ${(-height * voice.getScheduledSustainAtAttackEnd()) + height}` +
		` L ` +
		`   ${Math.min(1000, ((voice.getScheduledReleaseStartTimeSeconds() + xShift) * xScale) + xOffset)} ` +
		`   ${(-height * voice.getScheduledSustainAtReleaseStart()) + height}` +
		` L ` +
		`   ${Math.min(1000, ((voice.getScheduledReleaseEndTimeSeconds() + xShift) * xScale) + xOffset)} ` +
		`                       ${(-height * voice.getScheduledSustainAtReleaseEnd()) + height}`
	)
}

let _instruments = Map<string, OrderedMap<number, Voice>>()
let _audioContext: AudioContext

function renderSchedulerVisual(id: string, scheduledVoices: OrderedMap<number, Voice>) {
	const element = document.getElementById('scheduleVisual-' + id)

	if (!element) return logger.warn('missing placeholder element for debug visual: scheduleVisual -' + id)

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
	if (getCurrentSongIsPlaying() && selectOption(_store.getState(), AppOptions.showNoteSchedulerDebug)) {
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
