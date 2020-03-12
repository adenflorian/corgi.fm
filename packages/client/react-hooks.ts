import {useState} from 'react'
import {useSelector} from 'react-redux'
import {
	selectLocalClientId, createRoomMemberSelector,
	IClientAppState, selectRoomInfoState, selectExpPosition, selectActivityType,
} from '@corgifm/common/redux'
import {logger} from './client-logger'

export function useBoolean(init: boolean): [boolean, Enabler, Disabler] {
	const [toggle, setToggle] = useState(init)

	return [
		toggle,
		() => setToggle(true),
		() => setToggle(false),
	]
}

type Enabler = () => void
type Disabler = () => void

export function useResettableState<T>(init: T): [T, React.Dispatch<React.SetStateAction<T>>, Resetter] {
	const [value, setValue] = useState(init)

	return [
		value,
		setValue,
		() => setValue(init),
	]
}

type Resetter = () => void

export function useInputState(init: string): [string, OnChange] {
	const [value, onChange] = useState(init)

	return [
		value,
		e => onChange(e.target.value),
	]
}

type OnChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void

export function useEnumInputState<T extends string>(init: T, typeGuard: StringTypeGuard<T>): [T, OnChange] {
	const [value, onChange] = useState(init)

	return [
		value,
		e => {
			if (typeGuard(e.target.value)) {
				onChange(e.target.value)
			} else {
				logger.warn('[useEnumInputState] onChange value failed typeGuard: ', e.target.value)
			}
		},
	]
}

type StringTypeGuard<T extends string> = (val: string) => val is T

export function useLocalClientId() {
	return useSelector(selectLocalClientId)
}

export function useLocalRoomMember() {
	const localClientId = useSelector(selectLocalClientId)
	return useSelector(createRoomMemberSelector(localClientId))
}

export function useRoomType() {
	return useSelector((state: IClientAppState) => selectActivityType(state.room))
}

export function useExpPosition(nodeId: Id) {
	return useSelector((state: IClientAppState) => selectExpPosition(state.room, nodeId))
}
