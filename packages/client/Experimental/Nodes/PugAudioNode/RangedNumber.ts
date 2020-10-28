export class RangedNumber {
	public get value() {return this._value}
	public set value(newValue: number) {
		this._validate(newValue)
		this._value = newValue
	}

	public constructor(
		private _value: number,
		public readonly min: number,
		public readonly max: number,
	) {
		this._validate(_value)
	}

	private _validate(value: number) {
		if (value < this.min) {
			throw new RangedNumberError(`value of ${value} is below the min of ${this.min}`)
		}
		if (value > this.max) {
			throw new RangedNumberError(`value of ${value} is above the max of ${this.max}`)
		}
	}
}

export class RangedNumberError extends Error {}
