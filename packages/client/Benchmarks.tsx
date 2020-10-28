import React, {useCallback} from 'react'
import {List, Map} from 'immutable'
import {logger} from './client-logger'

const length = 100000
const _iterations = 10

const benchmarks: readonly Benchmark[] = [
	{
		name: 'array map',
		setup: () => new Array(length).fill(0),
		func: (arr: number[]) => arr.map(x => x + 1),
		iterations: _iterations,
	}, {
		name: 'immutable map',
		setup: () => List(new Array(length).fill(0)),
		func: (list: List<number>) => list.map(x => x + 1),
		iterations: _iterations,
	}, {
		name: 'array filter',
		setup: () => new Array(length).fill(0),
		func: (arr: number[]) => arr.filter(x => x % 2 === 0),
		iterations: _iterations,
	}, {
		name: 'immutable filter',
		setup: () => List(new Array(length).fill(0)),
		func: (list: List<number>) => list.filter(x => x % 2 === 0),
		iterations: _iterations,
	}, {
		name: 'array push',
		setup: () => new Array(length).fill(0),
		func: (arr: number[]) => arr.push(1),
		iterations: _iterations,
	}, {
		name: 'array slice push',
		setup: () => new Array(length).fill(0),
		func: (arr: number[]) => arr.slice(0).push(1),
		iterations: _iterations,
	}, {
		name: 'immutable push',
		setup: () => List(new Array(length).fill(0)),
		func: (list: List<number>) => list.push(1),
		iterations: _iterations,
	}, {
		name: 'object get',
		setup: () => new Array(length / 10).fill(0).reduce((result, current, i) => ({...result, [i]: current}), {}),
		func: (obj: any) => obj[500],
		iterations: _iterations * 1000000,
	}, {
		name: 'immutable Map get',
		setup: () => List(new Array(length / 10).fill(0)).reduce((result, current, i) => result.set(i, current), Map<number, number>()),
		func: (map: Map<number, number>) => map.get(500),
		iterations: _iterations * 1000000,
	},
]

interface Benchmark {
	name: string
	setup: Function
	func: Function
	iterations: number
}

export function Benchmarks() {

	const run = useCallback(() => {
		logger.log('hi')

		benchmarks.forEach(benchmark => {
			const result = benchmarkSomething(benchmark)
			logger.log(`${benchmark.name}: ${result.toFixed(2)}ms`)
		})
	}, [])

	return (
		<div>
			<h1>Benchmarks</h1>
			<button type="button" onClick={run}>
				run
			</button>
		</div>
	)
}

function benchmarkSomething(benchmark: Benchmark): number {
	const setupResult = benchmark.setup()
	const startTime = window.performance.now()
	for (let i = 0; i < benchmark.iterations; i++) {
		benchmark.func(setupResult)
	}
	// return results.reduce(add) / results.length
	// return results.reduce(add)
	return window.performance.now() - startTime
}

/** Returns how long function took in milliseconds */
function benchmarkSomethingFoo(func: Function): number {
	const startTime = window.performance.now()

	func()

	return window.performance.now() - startTime
}

const add = (a: number, b: number) => a + b
