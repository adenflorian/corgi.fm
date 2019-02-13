import {Store} from 'redux'

/*
https://github.com/Danetag/redux-watch-immutable

MIT License

Copyright (c) 2017 Arnaud Tanielian

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

type Comparator = (a: any, b: any) => boolean

export class ReduxWatcher {
	private readonly aPath = []
	private readonly aPathExisting = []

	constructor(
		private store: Store,
		private currentState: any,
	) {}

	public readonly setStore = (store: Store) => {
		this.store = store
		this.currentState = this.store.getState()
		this.store.subscribe(this._watch)
		return this.store
	}

	public readonly setCompareFn = (compare: Comparator) => {
		this._compare = compare
	}

	public readonly watch = (objectPath: string, callback: () => void) => {
		const index = this.aPathExisting.indexOf(objectPath)

		// New path
		if (index > -1) {
			// if new callback, add it
			let check = true
			this.aPath[index].aCallback.forEach(cb => {
				if (cb === callback) check = false
			})

			if (check) {
				// add the callback yo an existing path
				this.aPath[index].aCallback.push(callback)
			}
		} else {
			this.aPath.push({
				path: objectPath.split('.'),
				aCallback: [callback],
			})

			this.aPathExisting.push(objectPath)
		}

		// return the dispose function
		return () => {
			const idxPath = this.aPathExisting.indexOf(objectPath)

			if (idxPath > -1) {
				// delete only the callback. If last callback, delete the path
				let idxCb = -1
				this.aPath[idxPath].aCallback.forEach((cb, i) => {
					if (cb === callback) idxCb = i
				})

				if (idxCb > -1) this.aPath[idxPath].aCallback.splice(idxCb, 1)

				if (!this.aPath[idxPath].aCallback.length) {
					this.aPath.splice(idxPath, 1)
					this.aPathExisting.splice(idxPath, 1)
				}
			}
		}
	}

	private _compare: Comparator = (a, b) => a === b

	private readonly _watch = () => {
		const prev = this.currentState
		this.currentState = this.store.getState()

		this.aPath.forEach((o, i) => {
			const currentValue = this.currentState.getIn(o.path)
			const prevValue = prev.getIn(o.path)

			if (!this._compare(currentValue, prevValue)) {
				o.aCallback.forEach(cb => {
					// setTimeout: to make sure the stack is free
					setTimeout(() => cb(currentValue, prevValue, this.aPath[i]), 0)
				})
			}
		})
	}
}
