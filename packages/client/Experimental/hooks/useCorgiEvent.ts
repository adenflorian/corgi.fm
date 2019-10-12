import {
	useLayoutEffect, useState, useRef,
} from 'react'
import {useNodeContext} from '../CorgiNode'
import {ExpAudioParam} from '../ExpParams'
import {CorgiNumberChangedEvent, CorgiStringChangedEvent, CorgiEnumChangedEvent} from '../CorgiEvents'

// export function useAudioParam(paramId: Id) {
// 	const nodeContext = useNodeContext()

// 	const [value, setState] = useState(0)

// 	const previousValue = useRef(0)

// 	useLayoutEffect(() => {
// 		function onNewValue(newValue: number) {
// 			if (newValue === previousValue.current) {
// 				return
// 			}

// 			previousValue.current = newValue
// 			setState(newValue)
// 		}

// 		nodeContext.registerAudioParam(paramId, onNewValue)

// 		return () => nodeContext.unregisterAudioParam(paramId, onNewValue)
// 	}, [nodeContext, paramId])

// 	return value
// }

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
