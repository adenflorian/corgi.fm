import {
	useLayoutEffect, useState, useRef, useReducer,
} from 'react'
import {
	ReadonlyCorgiNumberChangedEvent, ReadonlyCorgiStringChangedEvent,
	ReadonlyCorgiEnumChangedEvent, ReadonlyCorgiObjectChangedEvent,
	ReadonlyBooleanChangedEvent,
} from '../CorgiEvents'

export function useNumberChangedEvent(event: ReadonlyCorgiNumberChangedEvent, doEqualityCheck = true) {
	const [, forceRender] = useReducer(x => x + 1, 0)

	const previousValue = useRef(0)

	useLayoutEffect(() => {
		function onNewValue(newValue: number) {
			if (doEqualityCheck && newValue === previousValue.current) return

			previousValue.current = newValue
			forceRender(0)
		}

		event.subscribe(onNewValue)

		return () => event.unsubscribe(onNewValue)
	}, [doEqualityCheck, event])

	return previousValue.current
}

export function useStringChangedEvent(event?: ReadonlyCorgiStringChangedEvent) {
	const [value, setState] = useState(event ? event.current : '')

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

export function useEnumChangedEvent<TEnum extends string>(initValue: TEnum, event?: ReadonlyCorgiEnumChangedEvent<TEnum>) {
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

export function useObjectChangedEvent<TObject extends object | boolean | undefined>(event: ReadonlyCorgiObjectChangedEvent<TObject>) {
	const [, forceRender] = useReducer(x => x + 1, 0)

	const value = useRef(event.current)

	useLayoutEffect(() => {
		function onNewValue(newValue: TObject) {
			value.current = newValue
			forceRender(0)
		}

		event.subscribe(onNewValue)

		return () => event.unsubscribe(onNewValue)
	}, [event])

	return value.current
}

export function useBooleanChangedEvent(event: ReadonlyBooleanChangedEvent) {
	const [, forceRender] = useReducer(x => x + 1, 0)

	const previousValue = useRef(event.current)

	useLayoutEffect(() => {
		function onNewValue(newValue: boolean) {
			if (newValue === previousValue.current) return

			previousValue.current = newValue
			forceRender(0)
		}

		const initialValue = event.subscribe(onNewValue)
		onNewValue(initialValue)

		return () => event.unsubscribe(onNewValue)
	}, [event])

	return previousValue.current
}
