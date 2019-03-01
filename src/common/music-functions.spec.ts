import {expect} from 'chai'
import {applyOctave} from './music-functions'

describe('input-middleware', () => {
	describe('applyOctave', () => {
		[
			[0, -1, 0],
			[1, -1, 1],
			[0, 0, 12],
			[0, 1, 24],
			[0, 2, 36],
			[1, 2, 37],
			[11, 4, 71],
		].forEach(arr => {
			it(`should return ${arr[2]} when ${arr[0]} and ${arr[1]}`, () => {
				expect(applyOctave(arr[0], arr[1])).to.equal(arr[2])
			})
		})
	})
})
