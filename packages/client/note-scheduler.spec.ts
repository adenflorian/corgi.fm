import {List, Set, OrderedMap} from 'immutable'
import {
	makeMidiClipEvent, makeMidiGlobalClipEvent, MidiClip, MidiGlobalClipEvent, MidiGlobalClipEvents, MidiRange, makeMidiGlobalClipEvents, makeEvents,
} from '@corgifm/common/midi-types'
import {applyBPM, applyBPMToEvents, getEvents} from './note-scheduler'

type Tests = {
	name: string
	start: number
	length: number
	expected: MidiGlobalClipEvent[]
}[]

const nextId = 0

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
						expect(applyBPM(time, bpm)).toEqual(expected)
					})
				})
		})
		describe('applyBPMToEvents', () => {
			([
				{
					name: '60 bpm',
					bpm: 60,
					events: makeMidiGlobalClipEvents(List<MidiGlobalClipEvent>([
						makeMidiGlobalClipEvent({startTime: 0.00, endTime: 0.25, note: 60, id: '1'}),
						makeMidiGlobalClipEvent({startTime: 0.25, endTime: 0.50, note: 64, id: '2'}),
						makeMidiGlobalClipEvent({startTime: 1.00, endTime: 1.10, note: 67, id: '3'}),
						makeMidiGlobalClipEvent({startTime: 1.50, endTime: 1.60, note: 71, id: '4'}),
						makeMidiGlobalClipEvent({startTime: 1.99, endTime: 2.00, note: 72, id: '5'}),
						makeMidiGlobalClipEvent({startTime: 2.00, endTime: 3.00, note: 71, id: '6'}),
					])),
					expected: makeMidiGlobalClipEvents(List<MidiGlobalClipEvent>([
						makeMidiGlobalClipEvent({startTime: 0.00, endTime: 0.25, note: 60, id: '1'}),
						makeMidiGlobalClipEvent({startTime: 0.25, endTime: 0.50, note: 64, id: '2'}),
						makeMidiGlobalClipEvent({startTime: 1.00, endTime: 1.10, note: 67, id: '3'}),
						makeMidiGlobalClipEvent({startTime: 1.50, endTime: 1.60, note: 71, id: '4'}),
						makeMidiGlobalClipEvent({startTime: 1.99, endTime: 2.00, note: 72, id: '5'}),
						makeMidiGlobalClipEvent({startTime: 2.00, endTime: 3.00, note: 71, id: '6'}),
					])),
				},
				{
					name: '40 bpm',
					bpm: 40,
					events: makeMidiGlobalClipEvents(List<MidiGlobalClipEvent>([
						makeMidiGlobalClipEvent({startTime: 0.00, endTime: 0.25, note: 60, id: '1'}),
						makeMidiGlobalClipEvent({startTime: 0.25, endTime: 0.50, note: 64, id: '2'}),
						makeMidiGlobalClipEvent({startTime: 1.00, endTime: 1.10, note: 67, id: '3'}),
						makeMidiGlobalClipEvent({startTime: 1.50, endTime: 1.60, note: 71, id: '4'}),
						makeMidiGlobalClipEvent({startTime: 1.99, endTime: 2.00, note: 72, id: '5'}),
						makeMidiGlobalClipEvent({startTime: 2.00, endTime: 3.00, note: 71, id: '6'}),
					])),
					expected: makeMidiGlobalClipEvents(List<MidiGlobalClipEvent>([
						makeMidiGlobalClipEvent({startTime: 0.000, endTime: 0.375, note: 60, id: '1'}),
						makeMidiGlobalClipEvent({startTime: 0.375, endTime: 0.750, note: 64, id: '2'}),
						makeMidiGlobalClipEvent({startTime: 1.500, endTime: 1.650, note: 67, id: '3'}),
						makeMidiGlobalClipEvent({startTime: 2.250, endTime: 2.400, note: 71, id: '4'}),
						makeMidiGlobalClipEvent({startTime: 2.985, endTime: 3.000, note: 72, id: '5'}),
						makeMidiGlobalClipEvent({startTime: 3.000, endTime: 4.500, note: 71, id: '6'}),
					])),
				},
			] as {
				name: string
				events: MidiGlobalClipEvents
				bpm: number
				expected: MidiGlobalClipEvents
			}[])
				.forEach(({name, events, bpm, expected}) => {
					it(`name: ${name}`, () => {
						expect(
							applyBPMToEvents(events, bpm).toArray(),
						).toEqual(expected.toArray())
					})
				})
		})
	})
	describe('MidiRange', () => {
		describe('bad args', () => {
			it('should throw when start too big', () => {
				expect(() => new MidiRange(100000000))
					.toThrow('too big')
			})
			it('should throw when end too big', () => {
				expect(() => new MidiRange(0, 100000000))
					.toThrow('too big')
			})
		})
		describe('end', () => {
			it('should be start plus length', () => {
				expect(new MidiRange(0).end).toEqual(0)
				expect(new MidiRange(0, 1).end).toEqual(1)
				expect(new MidiRange(0.000001, 3.333333).end).toEqual(3.333334)
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
							expect(normalizedRange.start).toEqual(output.start)
							expect(normalizedRange.length).toEqual(output.length)
						},
					)
				})
		})
	})
	describe('invalid inputs', () => {
		it('should fail when start time is negative', () => {
			expect(() => {
				getEvents(new MidiClip(), new MidiRange(-1, 1), 1)
			})
				.toThrow('start must be >= 0')
		})
		it('should fail when length is negative', () => {
			expect(() => {
				getEvents(new MidiClip(), new MidiRange(2, -1), 1)
			})
				.toThrow(`length must be >= 0`)
		})
		it('should return empty map when clipLength is negative', () => {
			expect(
				getEvents(new MidiClip({length: -1}), new MidiRange(0, 1), 1).toJSON(),
			)
				.toEqual(OrderedMap().toJSON())
			expect(
				getEvents(new MidiClip({length: 0}), new MidiRange(0, 1), 1).toJSON(),
			)
				.toEqual(OrderedMap().toJSON())
		})
	})
	describe('stuff', () => {
		const testClip = new MidiClip({
			length: 2,
			loop: true,
			events: makeEvents(List([
				{...makeMidiClipEvent({startBeat: 0.0, durationBeats: 0.25, note: 60}), id: '1'},
				{...makeMidiClipEvent({startBeat: 0.25, durationBeats: 0.25, note: 64}), id: '2'},
				{...makeMidiClipEvent({startBeat: 1.0, durationBeats: 0.45, note: 67}), id: '3'},
				{...makeMidiClipEvent({startBeat: 1.5, durationBeats: 0.33, note: 71}), id: '4'},
				{...makeMidiClipEvent({startBeat: 1.99, durationBeats: 1.01, note: 72}), id: '5'},
				{...makeMidiClipEvent({startBeat: 2.0, durationBeats: 1.50, note: 71}), id: '6'},
			])),
		});

		(
			[
				{
					name: '0 range - 0.00',
					start: 0.00,
					expected: [makeMidiGlobalClipEvent({startTime: 0.0, endTime: 0.25, note: 60, id: '1'})],
				},
				{
					name: '0 range - 0.25',
					start: 0.25,
					expected: [makeMidiGlobalClipEvent({startTime: 0.00, endTime: 0.25, note: 64, id: '2'})],
				},
				{
					name: '0 range - 1.00',
					start: 1.00,
					expected: [makeMidiGlobalClipEvent({startTime: 0.00, endTime: 0.45, note: 67, id: '3'})],
				},
				{
					name: '0 range - 2.00',
					start: 2.00,
					expected: [makeMidiGlobalClipEvent({startTime: 0.0, endTime: 0.25, note: 60, id: '1'})],
				},
				{
					name: '0 range - 3.00',
					start: 3.00,
					expected: [makeMidiGlobalClipEvent({startTime: 0.00, endTime: 0.45, note: 67, id: '3'})],
				},
				{
					name: '0 range - 3.99',
					start: 3.99,
					expected: [makeMidiGlobalClipEvent({startTime: 0.00, endTime: 1.01, note: 72, id: '5'})],
				},

				// start 0 range < clip.length
				{
					name: 'start 0 range < clip.length - A',
					start: 0.00,
					length: 0.01,
					expected: [makeMidiGlobalClipEvent({startTime: 0.0, endTime: 0.25, note: 60, id: '1'})],
				},
				{
					name: 'start 0 range < clip.length - B',
					start: 0.00,
					length: 0.25,
					expected: [makeMidiGlobalClipEvent({startTime: 0.0, endTime: 0.25, note: 60, id: '1'})],
				},
				{
					name: 'start 0 range < clip.length - C',
					start: 0.00,
					length: 0.250000001,
					expected: [
						makeMidiGlobalClipEvent({startTime: 0.00, endTime: 0.25, note: 60, id: '1'}),
						makeMidiGlobalClipEvent({startTime: 0.25, endTime: 0.50, note: 64, id: '2'}),
					],
				},

				{
					name: 'exact length of clip',
					start: 0.00,
					length: 2.00,
					expected: [
						makeMidiGlobalClipEvent({startTime: 0.00, endTime: 0.25, note: 60, id: '1'}),
						makeMidiGlobalClipEvent({startTime: 0.25, endTime: 0.50, note: 64, id: '2'}),
						makeMidiGlobalClipEvent({startTime: 1.00, endTime: 1.45, note: 67, id: '3'}),
						makeMidiGlobalClipEvent({startTime: 1.50, endTime: 1.83, note: 71, id: '4'}),
						makeMidiGlobalClipEvent({startTime: 1.99, endTime: 3.00, note: 72, id: '5'}),
					],
				},
				{
					name: 'half length, start halfway',
					start: 1.00,
					length: 1.00,
					expected: [
						makeMidiGlobalClipEvent({startTime: 0.00, endTime: 0.45, note: 67, id: '3'}),
						makeMidiGlobalClipEvent({startTime: 0.50, endTime: 0.83, note: 71, id: '4'}),
						makeMidiGlobalClipEvent({startTime: 0.99, endTime: 2.00, note: 72, id: '5'}),
					],
				},
				{
					name: 'exact length, 1st loop',
					start: 2.00,
					length: 2.00,
					expected: [
						makeMidiGlobalClipEvent({startTime: 0.00, endTime: 0.25, note: 60, id: '1'}),
						makeMidiGlobalClipEvent({startTime: 0.25, endTime: 0.50, note: 64, id: '2'}),
						makeMidiGlobalClipEvent({startTime: 1.00, endTime: 1.45, note: 67, id: '3'}),
						makeMidiGlobalClipEvent({startTime: 1.50, endTime: 1.83, note: 71, id: '4'}),
						makeMidiGlobalClipEvent({startTime: 1.99, endTime: 3.00, note: 72, id: '5'}),
					],
				},
				{
					name: 'exact length, start halfway',
					start: 1.00,
					length: 2.00,
					expected: [
						makeMidiGlobalClipEvent({startTime: 0.00, endTime: 0.45, note: 67, id: '3'}),
						makeMidiGlobalClipEvent({startTime: 0.50, endTime: 0.83, note: 71, id: '4'}),
						makeMidiGlobalClipEvent({startTime: 0.99, endTime: 2.00, note: 72, id: '5'}),
						makeMidiGlobalClipEvent({startTime: 1.00, endTime: 1.25, note: 60, id: '1'}),
						makeMidiGlobalClipEvent({startTime: 1.25, endTime: 1.50, note: 64, id: '2'}),
					],
				},
				{
					name: 'twice length of clip',
					start: 0.00,
					length: 4.00,
					expected: [
						makeMidiGlobalClipEvent({startTime: 0.00, endTime: 0.25, note: 60, id: '1'}),
						makeMidiGlobalClipEvent({startTime: 0.25, endTime: 0.50, note: 64, id: '2'}),
						makeMidiGlobalClipEvent({startTime: 1.00, endTime: 1.45, note: 67, id: '3'}),
						makeMidiGlobalClipEvent({startTime: 1.50, endTime: 1.83, note: 71, id: '4'}),
						makeMidiGlobalClipEvent({startTime: 1.99, endTime: 3.00, note: 72, id: '5'}),
						makeMidiGlobalClipEvent({startTime: 2.00, endTime: 2.25, note: 60, id: '1'}),
						makeMidiGlobalClipEvent({startTime: 2.25, endTime: 2.50, note: 64, id: '2'}),
						makeMidiGlobalClipEvent({startTime: 3.00, endTime: 3.45, note: 67, id: '3'}),
						makeMidiGlobalClipEvent({startTime: 3.50, endTime: 3.83, note: 71, id: '4'}),
						makeMidiGlobalClipEvent({startTime: 3.99, endTime: 5.00, note: 72, id: '5'}),
					],
				},
				{
					name: 'thrice length of clip',
					start: 0.00,
					length: 6.00,
					expected: [
						makeMidiGlobalClipEvent({startTime: 0.00, endTime: 0.25, note: 60, id: '1'}),
						makeMidiGlobalClipEvent({startTime: 0.25, endTime: 0.50, note: 64, id: '2'}),
						makeMidiGlobalClipEvent({startTime: 1.00, endTime: 1.45, note: 67, id: '3'}),
						makeMidiGlobalClipEvent({startTime: 1.50, endTime: 1.83, note: 71, id: '4'}),
						makeMidiGlobalClipEvent({startTime: 1.99, endTime: 3.00, note: 72, id: '5'}),
						makeMidiGlobalClipEvent({startTime: 2.00, endTime: 2.25, note: 60, id: '1'}),
						makeMidiGlobalClipEvent({startTime: 2.25, endTime: 2.50, note: 64, id: '2'}),
						makeMidiGlobalClipEvent({startTime: 3.00, endTime: 3.45, note: 67, id: '3'}),
						makeMidiGlobalClipEvent({startTime: 3.50, endTime: 3.83, note: 71, id: '4'}),
						makeMidiGlobalClipEvent({startTime: 3.99, endTime: 5.00, note: 72, id: '5'}),
						makeMidiGlobalClipEvent({startTime: 4.00, endTime: 4.25, note: 60, id: '1'}),
						makeMidiGlobalClipEvent({startTime: 4.25, endTime: 4.50, note: 64, id: '2'}),
						makeMidiGlobalClipEvent({startTime: 5.00, endTime: 5.45, note: 67, id: '3'}),
						makeMidiGlobalClipEvent({startTime: 5.50, endTime: 5.83, note: 71, id: '4'}),
						makeMidiGlobalClipEvent({startTime: 5.99, endTime: 7.00, note: 72, id: '5'}),
					],
				},
				{
					name: 'thrice and a half length of clip',
					start: 0.00,
					length: 5.00,
					expected: [
						makeMidiGlobalClipEvent({startTime: 0.00, endTime: 0.25, note: 60, id: '1'}),
						makeMidiGlobalClipEvent({startTime: 0.25, endTime: 0.50, note: 64, id: '2'}),
						makeMidiGlobalClipEvent({startTime: 1.00, endTime: 1.45, note: 67, id: '3'}),
						makeMidiGlobalClipEvent({startTime: 1.50, endTime: 1.83, note: 71, id: '4'}),
						makeMidiGlobalClipEvent({startTime: 1.99, endTime: 3.00, note: 72, id: '5'}),
						makeMidiGlobalClipEvent({startTime: 2.00, endTime: 2.25, note: 60, id: '1'}),
						makeMidiGlobalClipEvent({startTime: 2.25, endTime: 2.50, note: 64, id: '2'}),
						makeMidiGlobalClipEvent({startTime: 3.00, endTime: 3.45, note: 67, id: '3'}),
						makeMidiGlobalClipEvent({startTime: 3.50, endTime: 3.83, note: 71, id: '4'}),
						makeMidiGlobalClipEvent({startTime: 3.99, endTime: 5.00, note: 72, id: '5'}),
						makeMidiGlobalClipEvent({startTime: 4.00, endTime: 4.25, note: 60, id: '1'}),
						makeMidiGlobalClipEvent({startTime: 4.25, endTime: 4.50, note: 64, id: '2'}),
					],
				},
			] as Tests
		)
			.forEach(({name, start, length, expected}) => {
				it(name, () => {
					const result = getEvents(testClip, new MidiRange(start, length), 1).toObject()

					expect(result).toEqual(makeMidiGlobalClipEvents(List(expected)).toObject())
				})
			})
	})
})
