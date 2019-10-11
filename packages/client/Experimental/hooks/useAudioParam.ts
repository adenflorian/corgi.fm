import {
	useLayoutEffect, useState, useRef,
} from 'react'
import {useNodeContext} from '../CorgiNode'
import {ExpAudioParam} from '../ExpParams';
import {CorgiNumberChangedEvent} from '../ExpPorts';

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
