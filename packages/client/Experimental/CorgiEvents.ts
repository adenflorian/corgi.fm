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

export type EnumChangedDelegate<TEnum extends string> = (newEnum: TEnum) => void

export class CorgiEnumChangedEvent<TEnum extends string> {
	private readonly _subscribers = new Set<EnumChangedDelegate<TEnum>>()
	private _frameRequested = false

	public constructor(
		private _currentValue: TEnum,
	) {}

	public subscribe(delegate: EnumChangedDelegate<TEnum>): TEnum {
		this._subscribers.add(delegate)
		return this._currentValue
	}

	public unsubscribe(delegate: EnumChangedDelegate<TEnum>) {
		this._subscribers.delete(delegate)
	}

	public invokeImmediately(newEnum: TEnum) {
		this._currentValue = newEnum
		this._invoke()
	}

	public invokeNextFrame(newEnum: TEnum, onInvoked?: () => void) {
		this._currentValue = newEnum
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

export type ObjectChangedDelegate<TObject extends object | undefined> = (newObject: TObject) => void

export class CorgiObjectChangedEvent<TObject extends object | undefined> {
	private readonly _subscribers = new Set<ObjectChangedDelegate<TObject>>()
	private _frameRequested = false

	public constructor(
		public currentValue: TObject,
	) {}

	public subscribe(delegate: ObjectChangedDelegate<TObject>): TObject {
		this._subscribers.add(delegate)
		return this.currentValue
	}

	public unsubscribe(delegate: ObjectChangedDelegate<TObject>) {
		this._subscribers.delete(delegate)
	}

	public invokeImmediately(newObject: TObject) {
		this.currentValue = newObject
		this._invoke()
	}

	public invokeNextFrame(newObject: TObject, onInvoked?: () => void) {
		this.currentValue = newObject
		if (this._frameRequested) return
		this._frameRequested = true
		requestAnimationFrame(() => {
			this._frameRequested = false
			this._invoke()
			if (onInvoked) onInvoked()
		})
	}

	private _invoke() {
		this._subscribers.forEach(delegate => delegate(this.currentValue))
	}
}
