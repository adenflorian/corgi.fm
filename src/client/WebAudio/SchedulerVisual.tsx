import {Map, OrderedMap} from 'immutable'
import * as React from 'react'
import ReactDOM from 'react-dom'
import {Store} from 'redux'
import {logger} from '../../common/logger'
import {AppOptions, IClientAppState, selectOption, shamuConnect} from '../../common/redux'
import {getCurrentSongIsPlaying} from '../note-scanner'
import {Voice} from './Voice'

const _xScale = 20
const _height = 50
const _width = 256

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

interface SchedulerVisualProps {
	scheduledVoices: OrderedMap<number, Voice>
}

const SchedulerVisual = function SchedulerVisual_({scheduledVoices}: SchedulerVisualProps) {
	return (
		<div
			style={{
				position: 'relative',
				top: 2,
				width: _width,
				height: _height,
			}}
		>
			{scheduledVoices.map(voice => {
				return (
					<div
						style={{
							position: 'absolute',
							fill: 'none',
							width: _width,
							height: _height,
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
								d={_getPathDForVoice(voice)}
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
					width: _width,
					height: _height,
				}}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d={
							` M ${_width / 2} ${1 * _height}` +
							` L ${_width / 2} 0`
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

function _getPathDForVoice(voice: Voice) {
	const xShift = (-_audioContext.currentTime)
	const xOffset = _width / 2

	return (
		` M ` +
		`   ${((voice.getScheduledAttackStartTime() + xShift) * _xScale) + xOffset} ` +
		`   ${_height}` +
		` L ` +
		`   ${((voice.getScheduledAttackEndTime() + xShift) * _xScale) + xOffset} ` +
		`   ${(-_height * voice.getScheduledSustainAtAttackEnd()) + _height}` +
		` L ` +
		`   ${Math.min(1000, ((voice.getScheduledReleaseStartTimeSeconds() + xShift) * _xScale) + xOffset)} ` +
		`   ${(-_height * voice.getScheduledSustainAtReleaseStart()) + _height}` +
		` L ` +
		`   ${Math.min(1000, ((voice.getScheduledReleaseEndTimeSeconds() + xShift) * _xScale) + xOffset)} ` +
		`                       ${(-_height * voice.getScheduledSustainAtReleaseEnd()) + _height}`
	)
}

let _instruments = Map<string, () => OrderedMap<number, Voice>>()
let _audioContext: AudioContext

function _renderSchedulerVisual(id: string, scheduledVoices: OrderedMap<number, Voice>) {
	const element = document.getElementById('scheduleVisual-' + id)

	if (!element) return logger.warn('missing placeholder element for debug visual: scheduleVisual -' + id)

	ReactDOM.render(
		<SchedulerVisual scheduledVoices={scheduledVoices} />,
		document.getElementById('scheduleVisual-' + id),
	)
}

export function registerInstrumentWithSchedulerVisual(id: string, getScheduledVoices: () => OrderedMap<number, Voice>, audioContext: AudioContext) {
	if (!_audioContext) _audioContext = audioContext

	_instruments = _instruments.set(id, getScheduledVoices)
}

_renderLoop()

function _renderLoop() {
	if (
		_store &&
		(getCurrentSongIsPlaying() || selectOption(_store.getState(), AppOptions.renderNoteSchedulerDebugWhileStopped)) &&
		selectOption(_store.getState(), AppOptions.showNoteSchedulerDebug)
	) {
		_renderSchedulerVisualForAllInstruments()
	}

	requestAnimationFrame(_renderLoop)
}

function _renderSchedulerVisualForAllInstruments() {
	_instruments.forEach((val, key) => {
		_renderSchedulerVisual(key, val())
	})
}

window.addEventListener('keydown', e => {
	if (e.key === 'b') {
		_instruments.forEach((val, key) => {
			logger.log(`instrument ${key}: `, val().toJS())
		})
	}
})
