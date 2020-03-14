interface ClientId extends String {}

interface Id extends String {}

interface IDisposable {
	readonly dispose: () => void
}

interface Point {
	readonly x: number
	readonly y: number
}

type Include<T, U extends T> = T extends U ? T : never

type ThenArg<T> = T extends Promise<infer U>
	? U
	: T extends (...args: any[]) => Promise<infer V>
		? V
		: T

type OmitStrict<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

type AnyFunction = (...args: any[]) => any

type Octave = number

type RequiredField<T, K extends keyof T> = {
	[P in K]-?: T[P]
} & T

interface IdObject {
	readonly id: Id
}
