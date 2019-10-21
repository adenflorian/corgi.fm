import React, {useCallback, useMemo} from 'react'
import {hot} from 'react-hot-loader'
import {selectLocalClientId, IClientAppState} from '@corgifm/common/redux'
import {Input} from 'webmidi'
import {useSelector} from 'react-redux'
import {ButtonSelect, ButtonSelectOption} from '../../ButtonSelect/ButtonSelect'
import {useObjectChangedEvent} from '../hooks/useCorgiEvent'
import {useSingletonContext} from '../../SingletonContext'
import {CorgiObjectChangedEvent} from '../CorgiEvents'
import {logger} from '../../client-logger'

interface KeyboardNodeExtraProps {
	readonly onInputSelected: (input: Input) => void
	readonly inputChangedEvent: CorgiObjectChangedEvent<Input | undefined>
	readonly ownerId: Id
}

export const KeyboardNodeExtra = hot(module)(React.memo(function _KeyboardNodeExtra({
	onInputSelected, inputChangedEvent, ownerId,
}: KeyboardNodeExtraProps) {
	const localClientId = useSelector((state: IClientAppState) => selectLocalClientId(state))

	if (localClientId === ownerId) {
		return <KeyboardNodeExtra2 onInputSelected={onInputSelected} inputChangedEvent={inputChangedEvent} ownerId={ownerId} />
	} else {
		return <div>not your keyboard</div>
	}
}))

const KeyboardNodeExtra2 = React.memo(function _KeyboardNodeExtra({
	onInputSelected, inputChangedEvent,
}: KeyboardNodeExtraProps) {
	const midiService = useSingletonContext().midiService
	const midiInputs = useObjectChangedEvent(midiService.onInputsChanged)
	const midiInputOptions = useMemo(() => midiInputs.map((input): ButtonSelectOption<Input> => ({
		label: input.name,
		value: input.id,
		object: input,
	})), [midiInputs])

	const onNewSelection = useCallback((newSelection: ButtonSelectOption<Input>) => {
		if (newSelection.object === undefined) return logger.error('missing object from newSelection:', {newSelection})
		onInputSelected(newSelection.object)
	}, [onInputSelected])

	const selectedInput = useObjectChangedEvent(inputChangedEvent)

	return (
		<div style={{display: 'flex', justifyContent: 'center'}}>
			<ButtonSelect
				options={midiInputOptions}
				onNewSelection={onNewSelection}
				selectedOption={midiInputOptions.find(x => x.object === selectedInput)}
			/>
		</div>
	)
})
