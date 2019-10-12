export type NumberChangedDelegate = (newNumber: number) => void

export interface ICorgiNumberChangedEvent {
	subscribe(delegate: NumberChangedDelegate): number
	unsubscribe(delegate: NumberChangedDelegate): void
	invokeImmediately(newNumber: number): void
	invokeNextFrame(newNumber: number, onInvoked?: () => void): void
}

export class CorgiNumberChangedEvent implements ICorgiNumberChangedEvent {
	private readonly _subscribers = new Set<NumberChangedDelegate>()
	private _frameRequested = false

	public constructor(
		private _currentValue: number,
	) {}

	public subscribe(delegate: NumberChangedDelegate): number {
		this._subscribers.add(delegate)
		return this._currentValue
	}

	public unsubscribe(delegate: NumberChangedDelegate) {
		this._subscribers.delete(delegate)
	}

	public invokeImmediately(newNumber: number) {
		this._currentValue = newNumber
		this._invoke()
	}

	public invokeNextFrame(newNumber: number, onInvoked?: () => void) {
		this._currentValue = newNumber
		if (this._frameRequested) return
		this._frameRequested = true
		requestAnimationFrame(() => {
			this._frameRequested = false
			this._invoke()
			if (onInvoked) onInvoked()
		})
	}

	private _invoke() {
		this._subscribers.forEach(delegate => delegate(this._currentValue))
	}
}

export type StringChangedDelegate = (newString: string) => void

export class CorgiStringChangedEvent {
	private readonly _subscribers = new Set<StringChangedDelegate>()
	private _frameRequested = false

	public constructor(
		private _currentValue: string,
	) {}

	public subscribe(delegate: StringChangedDelegate): string {
		this._subscribers.add(delegate)
		return this._currentValue
	}

	public unsubscribe(delegate: StringChangedDelegate) {
		this._subscribers.delete(delegate)
	}

	public invokeImmediately(newString: string) {
		this._currentValue = newString
		this._invoke()
	}

	public invokeNextFrame(newString: string, onInvoked?: () => void) {
		this._currentValue = newString
		if (this._frameRequested) return
		this._frameRequested = true
		requestAnimationFrame(() => {
			this._frameRequested = false
			this._invoke()
			if (onInvoked) onInvoked()
		})
	}

	private _invoke() {
		this._subscribers.forEach(delegate => delegate(this._currentValue))
	}
}
