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
