import {useState} from 'react'

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
