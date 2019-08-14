import React, {useCallback, useMemo} from 'react'
import {useSelector, useDispatch} from 'react-redux'
import {
	BasicSamplerParam, basicSamplerActions, samplerParamsSelector,
	createSelectedPadNumberSelector, createSelectSamplePadSelector,
} from '@corgifm/common/redux';
import {Knob} from '../Knob/Knob';
import {
	attackToolTip, adsrValueToString, decayToolTip, sustainToolTip,
	releaseToolTip, panToolTip, panValueToString, filterToolTip,
	filterValueToString, detuneToolTip, detuneValueToString, gainToolTip,
	percentageValueString
} from '../client-constants';
import {KnobSnapping} from '../Knob/KnobSnapping';
import {allBuiltInBQFilterTypes} from '@corgifm/common/OscillatorTypes';
import {CssColor} from '@corgifm/common/shamu-color'


interface SamplerControlsProps {
	id: Id
}

export const SamplerControls = React.memo(({id}: SamplerControlsProps) => {
	const dispatch = useDispatch()

	const selectedSampleNote = useSelector(createSelectedPadNumberSelector(id))
	const selectedSample = useSelector(
		createSelectSamplePadSelector(id, selectedSampleNote))

	const selectParams = useMemo(() => samplerParamsSelector(id), [id])

	const props = useSelector(selectParams)

	const _dispatchChangeInstrumentParam = useCallback(
		(paramType: BasicSamplerParam, value: any) => {
			if (selectedSampleNote) {
				dispatch(basicSamplerActions.setSampleParam(
					id, selectedSampleNote, paramType, value))
			} else {
				dispatch(basicSamplerActions.setParam(id, paramType, value))
			}
		},
		[dispatch, id, selectedSampleNote],
	)

	return (
		<div
			className="controls"
			style={{
				color: selectedSample ? CssColor[selectedSample.color] : 'currentColor',
			}}
		>
			<div className="knobs">
				<Knob
					min={0}
					max={10}
					curve={3}
					value={props.attack}
					defaultValue={0.01}
					onChange={_dispatchChangeInstrumentParam}
					label="Attack"
					onChangeId={BasicSamplerParam.attack}
					tooltip={attackToolTip}
					valueString={adsrValueToString}
					readOnly={selectedSampleNote !== undefined}
				/>
				<Knob
					min={0}
					max={30}
					curve={3}
					value={props.decay}
					defaultValue={0}
					onChange={_dispatchChangeInstrumentParam}
					label="Decay"
					onChangeId={BasicSamplerParam.decay}
					tooltip={decayToolTip}
					valueString={adsrValueToString}
					readOnly={selectedSampleNote !== undefined}
				/>
				<Knob
					min={0}
					max={1}
					value={props.sustain}
					defaultValue={1}
					onChange={_dispatchChangeInstrumentParam}
					label="Sustain"
					onChangeId={BasicSamplerParam.sustain}
					tooltip={sustainToolTip}
					valueString={adsrValueToString}
					readOnly={selectedSampleNote !== undefined}
				/>
				<Knob
					min={0.001}
					max={60}
					curve={2}
					value={props.release}
					defaultValue={1}
					onChange={_dispatchChangeInstrumentParam}
					label="Release"
					onChangeId={BasicSamplerParam.release}
					tooltip={releaseToolTip}
					valueString={adsrValueToString}
					readOnly={selectedSampleNote !== undefined}
				/>
			</div>
			<div className="knobs">
				<Knob
					min={-1}
					max={1}
					value={props.pan}
					defaultValue={0}
					onChange={_dispatchChangeInstrumentParam}
					label="Pan"
					onChangeId={BasicSamplerParam.pan}
					tooltip={panToolTip}
					valueString={panValueToString}
					readOnly={selectedSampleNote !== undefined}
				/>
				<Knob
					min={0}
					max={20000}
					curve={2}
					value={props.filterCutoff}
					defaultValue={20000}
					onChange={_dispatchChangeInstrumentParam}
					label="Filter"
					onChangeId={BasicSamplerParam.filterCutoff}
					tooltip={filterToolTip}
					valueString={filterValueToString}
					readOnly={selectedSampleNote !== undefined}
				/>
				<KnobSnapping
					label="Filter Type"
					value={props.filterType}
					defaultIndex={0}
					onChange={_dispatchChangeInstrumentParam}
					onChangeId={BasicSamplerParam.filterType}
					tooltip="So many filters..."
					possibleValues={allBuiltInBQFilterTypes}
					readOnly={selectedSampleNote !== undefined}
				/>
				<Knob
					min={-100}
					max={100}
					value={props.detune}
					defaultValue={0}
					onChange={_dispatchChangeInstrumentParam}
					label="Detune"
					onChangeId={BasicSamplerParam.detune}
					tooltip={detuneToolTip}
					valueString={detuneValueToString}
				/>
				<Knob
					min={0}
					max={1}
					curve={2}
					value={props.gain}
					defaultValue={0.5}
					onChange={_dispatchChangeInstrumentParam}
					label="Gain"
					onChangeId={BasicSamplerParam.gain}
					tooltip={gainToolTip}
					valueString={percentageValueString}
					readOnly={selectedSampleNote !== undefined}
				/>
			</div>
		</div>
	)
})
