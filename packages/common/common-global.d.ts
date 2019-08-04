interface ClientId extends String {}

interface Id extends String {}

interface IDisposable {
	readonly dispose: () => void
}

interface Point {
	readonly x: number
	readonly y: number
}