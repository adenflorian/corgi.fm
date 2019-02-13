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

let store = null;
let currentState = null;

const aPath = [];
const aPathExisting = [];

let compareValues = (a, b) => {
	return a === b;
};

const watch_ = () => {
	const prev = currentState;
	currentState = store.getState();

	aPath.forEach((o, i) => {
		const currentValue = currentState.getIn(o.path);
		const prevValue = prev.getIn(o.path);
		if (!compareValues(currentValue, prevValue)) {
			o.aCallback.forEach((cb) => {
				// setTimeout: to make sure the stack is free
				setTimeout(() => cb(currentValue, prevValue, aPath[i]), 0);
			});
		}
	});
};

/* API */

export const setStore = (store_ = null) => {
	if (!store_) {
		console.error('You haven\'t provided a store');
		return false;
	}
	store = store_;
	currentState = store.getState();
	store.subscribe(watch_);
	return store;
};

export const setCompareFn = (compare_ = null) => {
	if (!compare_) compareValues = compare_;
};

export const watch = (objectPath = '', callback = null) => {
	const idx = aPathExisting.indexOf(objectPath);

	// New path
	if (idx > -1) {
		// if new callback, add it
		let check = true;
		aPath[idx].aCallback.forEach((cb) => {
			if (cb === callback) check = false;
		});

		if (check) {
			// add the callback yo an existing path
			aPath[idx].aCallback.push(callback);
		}
	} else {
		aPath.push({
			path: objectPath.split('.'),
			aCallback: [callback]
		});

		aPathExisting.push(objectPath);
	}

	// return the dispose function
	return () => {
		const idxPath = aPathExisting.indexOf(objectPath);

		if (idxPath > -1) {
			// delete only the callback. If last callback, delete the path
			let idxCb = -1;
			aPath[idxPath].aCallback.forEach((cb, i) => {
				if (cb === callback) idxCb = i;
			});

			if (idxCb > -1) aPath[idxPath].aCallback.splice(idxCb, 1);

			if (!aPath[idxPath].aCallback.length) {
				aPath.splice(idxPath, 1);
				aPathExisting.splice(idxPath, 1);
			}
		}
	};
};
