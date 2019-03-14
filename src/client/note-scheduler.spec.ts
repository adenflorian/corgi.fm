import {expect} from 'chai'
import {List, Set} from 'immutable'
import {
	makeMidiClipEvent, makeMidiGlobalClipEvent, MidiClip, MidiGlobalClipEvent, MidiGlobalClipEvents, MidiRange,
} from '../common/midi-types'
import {applyBPM, applyBPMToEvents, getEvents} from './note-scheduler'

type Tests = Array<{
	name: string,
	start: number,
	length: number,
	expected: MidiGlobalClipEvent[],
}>

describe('note-scheduler', () => {
	describe('bpm functions', () => {
		describe('applyBPM', () => {
			[
				{time: 0, bpm: 60, expected: 0},
				{time: 1, bpm: 60, expected: 1},
				{time: 2, bpm: 60, expected: 2},
				{time: 0, bpm: 30, expected: 0},
				{time: 1, bpm: 30, expected: 2},
				{time: 1, bpm: 120, expected: 0.5},
				{time: 333333.333333, bpm: 30, expected: 666666.666666},
				{time: 333333.333333, bpm: 120, expected: 166666.6666665},
				{time: 1, bpm: 3, expected: 20},
			]
				.forEach(({time, bpm, expected}) => {
					it(`time: ${time} | bpm: ${bpm}`, () => {
						expect(applyBPM(time, bpm)).to.equal(expected)
					})
				})
		})
		describe('applyBPMToEvents', () => {
			([
				{
					name: '60 bpm',
					bpm: 60,
					events: List<MidiGlobalClipEvent>([
						makeMidiGlobalClipEvent({startTime: 0.00, endTime: 0.25, notes: Set([60])}),
						makeMidiGlobalClipEvent({startTime: 0.25, endTime: 0.50, notes: Set([64])}),
						makeMidiGlobalClipEvent({startTime: 1.00, endTime: 1.10, notes: Set([67])}),
						makeMidiGlobalClipEvent({startTime: 1.50, endTime: 1.60, notes: Set([71])}),
						makeMidiGlobalClipEvent({startTime: 1.99, endTime: 2.00, notes: Set([72])}),
						makeMidiGlobalClipEvent({startTime: 2.00, endTime: 3.00, notes: Set([71])}),
					]),
					expected: List<MidiGlobalClipEvent>([
						makeMidiGlobalClipEvent({startTime: 0.00, endTime: 0.25, notes: Set([60])}),
						makeMidiGlobalClipEvent({startTime: 0.25, endTime: 0.50, notes: Set([64])}),
						makeMidiGlobalClipEvent({startTime: 1.00, endTime: 1.10, notes: Set([67])}),
						makeMidiGlobalClipEvent({startTime: 1.50, endTime: 1.60, notes: Set([71])}),
						makeMidiGlobalClipEvent({startTime: 1.99, endTime: 2.00, notes: Set([72])}),
						makeMidiGlobalClipEvent({startTime: 2.00, endTime: 3.00, notes: Set([71])}),
					]),
				},
				{
					name: '40 bpm',
					bpm: 40,
					events: List<MidiGlobalClipEvent>([
						makeMidiGlobalClipEvent({startTime: 0.00, endTime: 0.25, notes: Set([60])}),
						makeMidiGlobalClipEvent({startTime: 0.25, endTime: 0.50, notes: Set([64])}),
						makeMidiGlobalClipEvent({startTime: 1.00, endTime: 1.10, notes: Set([67])}),
						makeMidiGlobalClipEvent({startTime: 1.50, endTime: 1.60, notes: Set([71])}),
						makeMidiGlobalClipEvent({startTime: 1.99, endTime: 2.00, notes: Set([72])}),
						makeMidiGlobalClipEvent({startTime: 2.00, endTime: 3.00, notes: Set([71])}),
					]),
					expected: List<MidiGlobalClipEvent>([
						makeMidiGlobalClipEvent({startTime: 0.000, endTime: 0.375, notes: Set([60])}),
						makeMidiGlobalClipEvent({startTime: 0.375, endTime: 0.750, notes: Set([64])}),
						makeMidiGlobalClipEvent({startTime: 1.500, endTime: 1.650, notes: Set([67])}),
						makeMidiGlobalClipEvent({startTime: 2.250, endTime: 2.400, notes: Set([71])}),
						makeMidiGlobalClipEvent({startTime: 2.985, endTime: 3.000, notes: Set([72])}),
						makeMidiGlobalClipEvent({startTime: 3.000, endTime: 4.500, notes: Set([71])}),
					]),
				},
			] as Array<{
				name: string,
				events: MidiGlobalClipEvents,
				bpm: number,
				expected: MidiGlobalClipEvents,
			}>)
				.forEach(({name, events, bpm, expected}) => {
					it(`name: ${name}`, () => {
						expect(
							applyBPMToEvents(events, bpm).toArray(),
						).to.deep.equal(expected.toArray())
					})
				})
		})
	})
	describe('MidiRange', () => {
		describe('bad args', () => {
			it('should throw when start too big', () => {
				expect(() => new MidiRange(100000000))
					.to.throw('too big')
			})
			it('should throw when end too big', () => {
				expect(() => new MidiRange(0, 100000000))
					.to.throw('too big')
			})
		})
		describe('end', () => {
			it('should be start plus length', () => {
				expect(new MidiRange(0).end).to.equal(0)
				expect(new MidiRange(0, 1).end).to.equal(1)
				expect(new MidiRange(0.000001, 3.333333).end).to.equal(3.333334)
			})
		})
		describe('normalize', () => {
			[
				{
					length: 2,
					input: new MidiRange(3.99, 4.647),
					output: new MidiRange(1.99, 4.647),
				},
				{
					length: 2,
					input: new MidiRange(0),
					output: new MidiRange(0),
				},
				{
					length: 2,
					input: new MidiRange(0.001),
					output: new MidiRange(0.001),
				},
				{
					length: 2,
					input: new MidiRange(1.234567),
					output: new MidiRange(1.234567),
				},
				{
					length: 2,
					input: new MidiRange(9.876543),
					output: new MidiRange(1.876543),
				},
				{
					length: 3,
					input: new MidiRange(9.876543),
					output: new MidiRange(0.876543),
				},
				{
					length: 3,
					input: new MidiRange(99999997.876543),
					output: new MidiRange(1.876543),
				},
				{
					length: 3.3,
					input: new MidiRange(33333333.333333),
					output: new MidiRange(0.333333),
				},
				{
					length: 33333333.333333,
					input: new MidiRange(33333333.333333),
					output: new MidiRange(0),
				},
				{
					length: 33333333.333333,
					input: new MidiRange(1.333333),
					output: new MidiRange(1.333333),
				},
			]
				.forEach(({length, input, output}) => {
					it(`${length} ${JSON.stringify(input)} -> ${JSON.stringify(output)}`,
						() => {
							const normalizedRange = input.normalize(length)
							expect(normalizedRange.start).to.equal(output.start)
							expect(normalizedRange.length).to.equal(output.length)
						},
					)
				})
		})
	})
	describe('invalid inputs', () => {
		it('should fail when start time is negative', () => {
			expect(() => {
				getEvents(new MidiClip(), new MidiRange(-1, 1))
			})
				.to.throw('start must be >= 0')
		})
		it('should fail when length is negative', () => {
			expect(() => {
				getEvents(new MidiClip(), new MidiRange(2, -1))
			})
				.to.throw(`length must be >= 0`)
		})
		it('should return empty list when clipLength is negative', () => {
			expect(
				getEvents(new MidiClip({length: -1}), new MidiRange(0, 1)).toJSON(),
			)
				.to.deep.equal(List().toJSON())
			expect(
				getEvents(new MidiClip({length: 0}), new MidiRange(0, 1)).toJSON(),
			)
				.to.deep.equal(List().toJSON())
		})
	})
	describe('stuff', () => {
		const testClip = new MidiClip({
			length: 2,
			loop: true,
			events: List([
				makeMidiClipEvent({startBeat: 0.0, durationBeats: 0.25, notes: Set([60])}),
				makeMidiClipEvent({startBeat: 0.25, durationBeats: 0.25, notes: Set([64])}),
				makeMidiClipEvent({startBeat: 1.0, durationBeats: 0.45, notes: Set([67])}),
				makeMidiClipEvent({startBeat: 1.5, durationBeats: 0.33, notes: Set([71])}),
				makeMidiClipEvent({startBeat: 1.99, durationBeats: 1.01, notes: Set([72])}),
				makeMidiClipEvent({startBeat: 2.0, durationBeats: 1.50, notes: Set([71])}),
			]),
		});

		(
			[
				{
					name: '0 range - 0.00',
					start: 0.00,
					expected: [makeMidiGlobalClipEvent({startTime: 0.0, endTime: 0.25, notes: Set([60])})],
				},
				{
					name: '0 range - 0.25',
					start: 0.25,
					expected: [makeMidiGlobalClipEvent({startTime: 0.00, endTime: 0.25, notes: Set([64])})],
				},
				{
					name: '0 range - 1.00',
					start: 1.00,
					expected: [makeMidiGlobalClipEvent({startTime: 0.00, endTime: 0.45, notes: Set([67])})],
				},
				{
					name: '0 range - 2.00',
					start: 2.00,
					expected: [makeMidiGlobalClipEvent({startTime: 0.0, endTime: 0.25, notes: Set([60])})],
				},
				{
					name: '0 range - 3.00',
					start: 3.00,
					expected: [makeMidiGlobalClipEvent({startTime: 0.00, endTime: 0.45, notes: Set([67])})],
				},
				{
					name: '0 range - 3.99',
					start: 3.99,
					expected: [makeMidiGlobalClipEvent({startTime: 0.00, endTime: 1.01, notes: Set([72])})],
				},

				// start 0 range < clip.length
				{
					name: 'start 0 range < clip.length - A',
					start: 0.00, length: 0.01,
					expected: [makeMidiGlobalClipEvent({startTime: 0.0, endTime: 0.25, notes: Set([60])})],
				},
				{
					name: 'start 0 range < clip.length - B',
					start: 0.00, length: 0.25,
					expected: [makeMidiGlobalClipEvent({startTime: 0.0, endTime: 0.25, notes: Set([60])})],
				},
				{
					name: 'start 0 range < clip.length - C',
					start: 0.00, length: 0.250000001,
					expected: [
						makeMidiGlobalClipEvent({startTime: 0.00, endTime: 0.25, notes: Set([60])}),
						makeMidiGlobalClipEvent({startTime: 0.25, endTime: 0.50, notes: Set([64])}),
					],
				},

				{
					name: 'exact length of clip',
					start: 0.00, length: 2.00,
					expected: [
						makeMidiGlobalClipEvent({startTime: 0.00, endTime: 0.25, notes: Set([60])}),
						makeMidiGlobalClipEvent({startTime: 0.25, endTime: 0.50, notes: Set([64])}),
						makeMidiGlobalClipEvent({startTime: 1.00, endTime: 1.45, notes: Set([67])}),
						makeMidiGlobalClipEvent({startTime: 1.50, endTime: 1.83, notes: Set([71])}),
						makeMidiGlobalClipEvent({startTime: 1.99, endTime: 3.00, notes: Set([72])}),
					],
				},
				{
					name: 'half length, start halfway',
					start: 1.00, length: 1.00,
					expected: [
						makeMidiGlobalClipEvent({startTime: 0.00, endTime: 0.45, notes: Set([67])}),
						makeMidiGlobalClipEvent({startTime: 0.50, endTime: 0.83, notes: Set([71])}),
						makeMidiGlobalClipEvent({startTime: 0.99, endTime: 2.00, notes: Set([72])}),
					],
				},
				{
					name: 'exact length, 1st loop',
					start: 2.00, length: 2.00,
					expected: [
						makeMidiGlobalClipEvent({startTime: 0.00, endTime: 0.25, notes: Set([60])}),
						makeMidiGlobalClipEvent({startTime: 0.25, endTime: 0.50, notes: Set([64])}),
						makeMidiGlobalClipEvent({startTime: 1.00, endTime: 1.45, notes: Set([67])}),
						makeMidiGlobalClipEvent({startTime: 1.50, endTime: 1.83, notes: Set([71])}),
						makeMidiGlobalClipEvent({startTime: 1.99, endTime: 3.00, notes: Set([72])}),
					],
				},
				{
					name: 'exact length, start halfway',
					start: 1.00, length: 2.00,
					expected: [
						makeMidiGlobalClipEvent({startTime: 0.00, endTime: 0.45, notes: Set([67])}),
						makeMidiGlobalClipEvent({startTime: 0.50, endTime: 0.83, notes: Set([71])}),
						makeMidiGlobalClipEvent({startTime: 0.99, endTime: 2.00, notes: Set([72])}),
						makeMidiGlobalClipEvent({startTime: 1.00, endTime: 1.25, notes: Set([60])}),
						makeMidiGlobalClipEvent({startTime: 1.25, endTime: 1.50, notes: Set([64])}),
					],
				},
				{
					name: 'twice length of clip',
					start: 0.00, length: 4.00,
					expected: [
						makeMidiGlobalClipEvent({startTime: 0.00, endTime: 0.25, notes: Set([60])}),
						makeMidiGlobalClipEvent({startTime: 0.25, endTime: 0.50, notes: Set([64])}),
						makeMidiGlobalClipEvent({startTime: 1.00, endTime: 1.45, notes: Set([67])}),
						makeMidiGlobalClipEvent({startTime: 1.50, endTime: 1.83, notes: Set([71])}),
						makeMidiGlobalClipEvent({startTime: 1.99, endTime: 3.00, notes: Set([72])}),
						makeMidiGlobalClipEvent({startTime: 2.00, endTime: 2.25, notes: Set([60])}),
						makeMidiGlobalClipEvent({startTime: 2.25, endTime: 2.50, notes: Set([64])}),
						makeMidiGlobalClipEvent({startTime: 3.00, endTime: 3.45, notes: Set([67])}),
						makeMidiGlobalClipEvent({startTime: 3.50, endTime: 3.83, notes: Set([71])}),
						makeMidiGlobalClipEvent({startTime: 3.99, endTime: 5.00, notes: Set([72])}),
					],
				},
				{
					name: 'thrice length of clip',
					start: 0.00, length: 6.00,
					expected: [
						makeMidiGlobalClipEvent({startTime: 0.00, endTime: 0.25, notes: Set([60])}),
						makeMidiGlobalClipEvent({startTime: 0.25, endTime: 0.50, notes: Set([64])}),
						makeMidiGlobalClipEvent({startTime: 1.00, endTime: 1.45, notes: Set([67])}),
						makeMidiGlobalClipEvent({startTime: 1.50, endTime: 1.83, notes: Set([71])}),
						makeMidiGlobalClipEvent({startTime: 1.99, endTime: 3.00, notes: Set([72])}),
						makeMidiGlobalClipEvent({startTime: 2.00, endTime: 2.25, notes: Set([60])}),
						makeMidiGlobalClipEvent({startTime: 2.25, endTime: 2.50, notes: Set([64])}),
						makeMidiGlobalClipEvent({startTime: 3.00, endTime: 3.45, notes: Set([67])}),
						makeMidiGlobalClipEvent({startTime: 3.50, endTime: 3.83, notes: Set([71])}),
						makeMidiGlobalClipEvent({startTime: 3.99, endTime: 5.00, notes: Set([72])}),
						makeMidiGlobalClipEvent({startTime: 4.00, endTime: 4.25, notes: Set([60])}),
						makeMidiGlobalClipEvent({startTime: 4.25, endTime: 4.50, notes: Set([64])}),
						makeMidiGlobalClipEvent({startTime: 5.00, endTime: 5.45, notes: Set([67])}),
						makeMidiGlobalClipEvent({startTime: 5.50, endTime: 5.83, notes: Set([71])}),
						makeMidiGlobalClipEvent({startTime: 5.99, endTime: 7.00, notes: Set([72])}),
					],
				},
				{
					name: 'thrice and a half length of clip',
					start: 0.00, length: 5.00,
					expected: [
						makeMidiGlobalClipEvent({startTime: 0.00, endTime: 0.25, notes: Set([60])}),
						makeMidiGlobalClipEvent({startTime: 0.25, endTime: 0.50, notes: Set([64])}),
						makeMidiGlobalClipEvent({startTime: 1.00, endTime: 1.45, notes: Set([67])}),
						makeMidiGlobalClipEvent({startTime: 1.50, endTime: 1.83, notes: Set([71])}),
						makeMidiGlobalClipEvent({startTime: 1.99, endTime: 3.00, notes: Set([72])}),
						makeMidiGlobalClipEvent({startTime: 2.00, endTime: 2.25, notes: Set([60])}),
						makeMidiGlobalClipEvent({startTime: 2.25, endTime: 2.50, notes: Set([64])}),
						makeMidiGlobalClipEvent({startTime: 3.00, endTime: 3.45, notes: Set([67])}),
						makeMidiGlobalClipEvent({startTime: 3.50, endTime: 3.83, notes: Set([71])}),
						makeMidiGlobalClipEvent({startTime: 3.99, endTime: 5.00, notes: Set([72])}),
						makeMidiGlobalClipEvent({startTime: 4.00, endTime: 4.25, notes: Set([60])}),
						makeMidiGlobalClipEvent({startTime: 4.25, endTime: 4.50, notes: Set([64])}),
					],
				},
			] as Tests
		)
			.forEach(({name, start, length, expected}) => {
				it(name, () => {
					const result = getEvents(testClip, new MidiRange(start, length)).toArray()

					expect(result).to.deep.equal(expected)
				})
			})
	})
})
