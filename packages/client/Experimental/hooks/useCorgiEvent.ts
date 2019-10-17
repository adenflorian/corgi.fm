import {
	useLayoutEffect, useState, useRef, useReducer,
} from 'react'
import {
	CorgiNumberChangedEvent, CorgiStringChangedEvent,
	CorgiEnumChangedEvent, CorgiObjectChangedEvent,
} from '../CorgiEvents'

export function useNumberChangedEvent(event: CorgiNumberChangedEvent) {
	const [value, setState] = useState(0)

	const previousValue = useRef(0)

	useLayoutEffect(() => {
		function onNewValue(newValue: number) {
			if (newValue === previousValue.current) return

			previousValue.current = newValue
			setState(newValue)
		}

		const initialValue = event.subscribe(onNewValue)
		onNewValue(initialValue)

		return () => event.unsubscribe(onNewValue)
	}, [event])

	return value
}

export function useStringChangedEvent(event?: CorgiStringChangedEvent) {
	const [value, setState] = useState('')

	const previousValue = useRef('')

	useLayoutEffect(() => {
		if (!event) return

		function onNewValue(newValue: string) {
			if (newValue === previousValue.current) return

			previousValue.current = newValue
			setState(newValue)
		}

		const initialValue = event.subscribe(onNewValue)
		onNewValue(initialValue)

		return () => event.unsubscribe(onNewValue)
	}, [event])

	return value
}

export function useEnumChangedEvent<TEnum extends string>(initValue: TEnum, event?: CorgiEnumChangedEvent<TEnum>) {
	const [value, setState] = useState<TEnum>(initValue)

	const previousValue = useRef<TEnum>(initValue)

	useLayoutEffect(() => {
		if (!event) return

		function onNewValue(newValue: TEnum) {
			if (newValue === previousValue.current) return

			previousValue.current = newValue
			setState(newValue)
		}

		const initialValue = event.subscribe(onNewValue)
		onNewValue(initialValue)

		return () => event.unsubscribe(onNewValue)
	}, [event])

	return value
}

export function useObjectChangedEvent<TObject extends object | undefined>(event: CorgiObjectChangedEvent<TObject>) {
	const [, forceRender] = useReducer(x => x + 1, 0)

	const value = useRef(event.currentValue)

	useLayoutEffect(() => {
		if (!event) return

		function onNewValue(newValue: TObject) {
			value.current = newValue
			forceRender(0)
		}

		const initialValue = event.subscribe(onNewValue)
		onNewValue(initialValue)

		return () => event.unsubscribe(onNewValue)
	}, [event])

	return value.current
}
