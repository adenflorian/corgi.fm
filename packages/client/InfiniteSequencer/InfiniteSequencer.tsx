import {stripIndents} from 'common-tags'
import React from 'react'
import {
	IoMdDownload as Download, IoMdGrid as Rows, IoMdPlay as Play,
	IoMdRecording as Record, IoMdSquare as Stop,
	IoMdStar as Star, IoMdTrash as Clear, IoMdUndo as Undo,
} from 'react-icons/io'
import {connect, useDispatch} from 'react-redux'
import {
	globalClockActions, IClientAppState,
	infiniteSequencerActions, InfiniteSequencerFields, InfiniteSequencerState,
	InfiniteSequencerStyle, selectConnectionSourceColorByTargetId,
	selectInfiniteSequencer, sequencerActions,
} from '@corgifm/common/redux'
import {CssColor} from '@corgifm/common/shamu-color'
import {rateValues} from '@corgifm/common/common-samples-stuff'
import {
	percentageValueString, seqLengthValueToString, seqPitchValueToString,
	seqRateValueToString, sequencerDownloadToolTip, sequencerEraseToolTip,
	sequencerGateToolTip, sequencerPitchToolTip, sequencerPlayToolTip,
	sequencerRateToolTip, sequencerRecordToolTip, sequencerStopToolTip,
	sequencerUndoToolTip,
} from '../client-constants'
import {Knob} from '../Knob/Knob'
import {KnobIncremental} from '../Knob/KnobIncremental'
import {KnobSnapping} from '../Knob/KnobSnapping'
import {Panel} from '../Panel/Panel'
import './InfiniteSequencer.less'
import {ConnectedInfiniteSequencerNotes} from './InfiniteSequencerNotes'

interface IInfiniteSequencerProps {
	id: Id
}

interface IInfiniteSequencerReduxProps {
	color: string
	gate: number
	isPlaying: boolean
	isRecording: boolean
	name: string
	pitch: number
	rate: number
	showRows: boolean
	style: InfiniteSequencerStyle
	length: number
}

type IInfiniteSequencerAllProps =
	IInfiniteSequencerProps & IInfiniteSequencerReduxProps

export const InfiniteSequencer: React.FC<IInfiniteSequencerAllProps> = React.memo(
	function _InfiniteSequencer(props) {
		const {color, isPlaying, id, isRecording, name, length, rate} = props

		const dispatch = useDispatch()

		const dispatchInfiniteSeqParam = (paramType: InfiniteSequencerFields, value: number | boolean | string) =>
			dispatch(infiniteSequencerActions.setField(id, paramType, value))

		return render()

		function render() {
			return (
				<div
					className={
						`infiniteSequencer ` +
						`${isPlaying ? 'isPlaying saturate ' : 'isNotPlaying '}` +
						`${isRecording ? `isRecording` : ''}`
					}
				>
					<Panel
						id={props.id}
						label={name}
						color={isRecording ? CssColor.red : color}
						saturate={isPlaying}
						helpText={stripIndents`Plug your keyboard into the infinite sequencer, hit record, and play notes
							Hit backspace to undo and right arrow key to insert a rest`}
						extra={seqLengthValueToString(rate / 4 * length)}
					>
						<div className="controls" style={{width: InfiniteSequencerState.controlsWidth}}>
							<div className="buttons">
								<div
									className="play"
									onClick={() => {
										dispatch(sequencerActions.play(id))
										dispatch(globalClockActions.start())
									}}
									title={sequencerPlayToolTip}
								>
									<Play />
								</div>
								<div
									className="stop"
									onClick={() => dispatch(sequencerActions.stop(id))}
									title={sequencerStopToolTip}
								>
									<Stop />
								</div>
								<div
									className="record"
									onClick={() => dispatch(sequencerActions.toggleRecording(id, !isRecording))}
									title={sequencerRecordToolTip}
								>
									<Record />
								</div>
								<div
									className="export"
									onClick={() => dispatch(sequencerActions.exportMidi(id))}
									title={sequencerDownloadToolTip}
								>
									<Download />
								</div>
								<div
									className="erase"
									onClick={() => dispatch(sequencerActions.clear(props.id))}
									title={sequencerEraseToolTip}
								>
									<Clear />
								</div>
								<div
									className="undo"
									onClick={() => dispatch(sequencerActions.undo(props.id))}
									title={sequencerUndoToolTip + `\nBackspace to undo while recording and your keyboard is plugged in`}
								>
									<Undo />
								</div>

								<div
									className="style"
									onClick={() => dispatchInfiniteSeqParam(
										InfiniteSequencerFields.style,
										props.style === InfiniteSequencerStyle.colorBars
											? InfiniteSequencerStyle.colorGrid
											: InfiniteSequencerStyle.colorBars,
									)}
									title={stripIndents`Toggle display styles`}
								>
									<Star />
								</div>
								<div
									className={`showRows ${props.style === InfiniteSequencerStyle.colorGrid ? '' : 'disabled'}`}
									onClick={() => props.style === InfiniteSequencerStyle.colorGrid && dispatchInfiniteSeqParam(
										InfiniteSequencerFields.showRows,
										!props.showRows,
									)}
									title={stripIndents`Toggle piano roll lines`}
								>
									<Rows />
								</div>
							</div>
							<div className="knobs">
								<Knob
									min={0}
									max={2}
									value={props.gate}
									defaultValue={0.5}
									onChange={dispatchInfiniteSeqParam}
									label="Gate"
									onChangeId={InfiniteSequencerFields.gate}
									tooltip={sequencerGateToolTip}
									valueString={percentageValueString}
								/>
								<KnobIncremental
									min={-12}
									max={12}
									value={props.pitch}
									defaultValue={0}
									onChange={dispatchInfiniteSeqParam}
									label="Pitch"
									onChangeId={InfiniteSequencerFields.pitch}
									tooltip={sequencerPitchToolTip}
									valueString={seqPitchValueToString}
									increment={1}
								/>
								<KnobSnapping
									value={props.rate}
									defaultIndex={rateValues.indexOf(1 / 4)}
									onChange={dispatchInfiniteSeqParam}
									label="Rate"
									onChangeId={InfiniteSequencerFields.rate}
									tooltip={sequencerRateToolTip}
									valueString={seqRateValueToString}
									possibleValues={rateValues}
								/>
							</div>
						</div>
						<ConnectedInfiniteSequencerNotes id={id} />
					</Panel>
				</div>
			)
		}
	},
)

export const ConnectedInfiniteSequencer = connect(
	(state: IClientAppState, props: IInfiniteSequencerProps): IInfiniteSequencerReduxProps => {
		const infiniteSequencerState = selectInfiniteSequencer(state.room, props.id)

		return {
			isPlaying: infiniteSequencerState.isPlaying,
			isRecording: infiniteSequencerState.isRecording,
			color: selectConnectionSourceColorByTargetId(state.room, props.id),
			gate: infiniteSequencerState.gate,
			name: infiniteSequencerState.name,
			pitch: infiniteSequencerState.pitch,
			rate: infiniteSequencerState.rate,
			showRows: infiniteSequencerState.showRows,
			style: infiniteSequencerState.style,
			length: infiniteSequencerState.midiClip.length,
		}
	},
)(InfiniteSequencer)
