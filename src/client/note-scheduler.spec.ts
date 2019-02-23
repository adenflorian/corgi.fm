import {expect} from 'chai'
import {List} from 'immutable'
import {applyBPM, applyBPMToEvents, makeMidiClip, MidiGlobalClipEvent, MidiGlobalClipEvents, NoteScheduler, Range} from './note-scheduler'

const testClip = makeMidiClip({
	length: 2,
	loop: true,
	events: List([
		{startBeat: 0.0, note: 60},
		{startBeat: 0.25, note: 64},
		{startBeat: 1.0, note: 67},
		{startBeat: 1.5, note: 71},
		{startBeat: 1.99, note: 72},
		{startBeat: 2.0, note: 71},
	]),
})

type Tests = Array<{
	name: string,
	start: number,
	length: number,
	expected: MidiGlobalClipEvent[],
}>

describe.only('note-scheduler', () => {
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
					events: List<MidiGlobalClipEvent>([
						{startTime: 0.0, note: 60},
						{startTime: 0.25, note: 64},
						{startTime: 1.0, note: 67},
						{startTime: 1.5, note: 71},
						{startTime: 1.99, note: 72},
						{startTime: 2.0, note: 71},
					]),
					bpm: 60,
					expected: List<MidiGlobalClipEvent>([
						{startTime: 0.0, note: 60},
						{startTime: 0.25, note: 64},
						{startTime: 1.0, note: 67},
						{startTime: 1.5, note: 71},
						{startTime: 1.99, note: 72},
						{startTime: 2.0, note: 71},
					]),
				},
				{
					name: '40 bpm',
					events: List<MidiGlobalClipEvent>([
						{startTime: 0.0, note: 60},
						{startTime: 0.25, note: 64},
						{startTime: 1.0, note: 67},
						{startTime: 1.5, note: 71},
						{startTime: 1.99, note: 72},
						{startTime: 2.0, note: 71},
					]),
					bpm: 40,
					expected: List<MidiGlobalClipEvent>([
						{startTime: 0.0, note: 60},
						{startTime: 0.375, note: 64},
						{startTime: 1.5, note: 67},
						{startTime: 2.25, note: 71},
						{startTime: 2.985, note: 72},
						{startTime: 3.0, note: 71},
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
	describe('Range', () => {
		describe('bad args', () => {
			it('should throw when start too big', () => {
				expect(() => new Range(100000000))
					.to.throw('too big')
			})
			it('should throw when end too big', () => {
				expect(() => new Range(0, 100000000))
					.to.throw('too big')
			})
		})
		describe('end', () => {
			it('should be start plus length', () => {
				expect(new Range(0).end).to.equal(0)
				expect(new Range(0, 1).end).to.equal(1)
				expect(new Range(0.000001, 3.333333).end).to.equal(3.333334)
			})
		})
		describe('normalize', () => {
			[
				{
					length: 2,
					input: new Range(3.99, 4.647),
					output: new Range(1.99, 4.647),
				},
				{
					length: 2,
					input: new Range(0),
					output: new Range(0),
				},
				{
					length: 2,
					input: new Range(0.001),
					output: new Range(0.001),
				},
				{
					length: 2,
					input: new Range(1.234567),
					output: new Range(1.234567),
				},
				{
					length: 2,
					input: new Range(9.876543),
					output: new Range(1.876543),
				},
				{
					length: 3,
					input: new Range(9.876543),
					output: new Range(0.876543),
				},
				{
					length: 3,
					input: new Range(99999997.876543),
					output: new Range(1.876543),
				},
				{
					length: 3.3,
					input: new Range(33333333.333333),
					output: new Range(0.333333),
				},
				{
					length: 33333333.333333,
					input: new Range(33333333.333333),
					output: new Range(0),
				},
				{
					length: 33333333.333333,
					input: new Range(1.333333),
					output: new Range(1.333333),
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
				new NoteScheduler(makeMidiClip())
					.getNotes(new Range(-1, 1))
			})
				.to.throw('start must be >= 0')
		})
		it('should fail when length is negative', () => {
			expect(() => {
				new NoteScheduler(makeMidiClip())
					.getNotes(new Range(2, -1))
			})
				.to.throw(`length must be >= 0`)
		})
		it('should fail when clipLength is negative', () => {
			expect(() => {
				new NoteScheduler(makeMidiClip({length: -1}))
					.getNotes(new Range(0, 1))
			})
				.to.throw(`clipLength must be > 0`)
		})
	})
	describe.only('stuff', () => {
		(
			[
				{
					name: '0 range - 0.00',
					start: 0.00,
					expected: [{startTime: 0.0, note: 60}],
				},
				{
					name: '0 range - 0.25',
					start: 0.25,
					expected: [{startTime: 0.00, note: 64}],
				},
				{
					name: '0 range - 1.00',
					start: 1.00,
					expected: [{startTime: 0.00, note: 67}],
				},
				{
					name: '0 range - 2.00',
					start: 2.00,
					expected: [{startTime: 0.0, note: 60}],
				},
				{
					name: '0 range - 3.00',
					start: 3.00,
					expected: [{startTime: 0.00, note: 67}],
				},
				{
					name: '0 range - 3.99',
					start: 3.99,
					expected: [{startTime: 0.00, note: 72}],
				},

				// start 0 range < clip.length
				{
					name: 'start 0 range < clip.length - A',
					start: 0.00, length: 0.01,
					expected: [{startTime: 0.0, note: 60}],
				},
				{
					name: 'start 0 range < clip.length - B',
					start: 0.00, length: 0.25,
					expected: [{startTime: 0.0, note: 60}],
				},
				{
					name: 'start 0 range < clip.length - C',
					start: 0.00, length: 0.250000001,
					expected: [
						{startTime: 0.00, note: 60},
						{startTime: 0.25, note: 64},
					],
				},

				{
					name: 'exact length of clip',
					start: 0.00, length: 2.00,
					expected: [
						{startTime: 0.0, note: 60},
						{startTime: 0.25, note: 64},
						{startTime: 1.0, note: 67},
						{startTime: 1.5, note: 71},
						{startTime: 1.99, note: 72},
					],
				},
				{
					name: 'half length, start halfway',
					start: 1.00, length: 1.00,
					expected: [
						{startTime: 0.0, note: 67},
						{startTime: 0.5, note: 71},
						{startTime: 0.99, note: 72},
					],
				},
				{
					name: 'exact length, 1st loop',
					start: 2.00, length: 2.00,
					expected: [
						{startTime: 0.0, note: 60},
						{startTime: 0.25, note: 64},
						{startTime: 1.0, note: 67},
						{startTime: 1.5, note: 71},
						{startTime: 1.99, note: 72},
					],
				},
				{
					name: 'exact length, start halfway',
					start: 1.00, length: 2.00,
					expected: [
						{startTime: 0.0, note: 67},
						{startTime: 0.5, note: 71},
						{startTime: 0.99, note: 72},
						{startTime: 1.0, note: 60},
						{startTime: 1.25, note: 64},
					],
				},
				{
					name: 'twice length of clip',
					start: 0.00, length: 4.00,
					expected: [
						{startTime: 0.0, note: 60},
						{startTime: 0.25, note: 64},
						{startTime: 1.0, note: 67},
						{startTime: 1.5, note: 71},
						{startTime: 1.99, note: 72},
						{startTime: 2.0, note: 60},
						{startTime: 2.25, note: 64},
						{startTime: 3.0, note: 67},
						{startTime: 3.5, note: 71},
						{startTime: 3.99, note: 72},
					],
				},
				{
					name: 'thrice length of clip',
					start: 0.00, length: 6.00,
					expected: [
						{startTime: 0.0, note: 60},
						{startTime: 0.25, note: 64},
						{startTime: 1.0, note: 67},
						{startTime: 1.5, note: 71},
						{startTime: 1.99, note: 72},
						{startTime: 2.0, note: 60},
						{startTime: 2.25, note: 64},
						{startTime: 3.0, note: 67},
						{startTime: 3.5, note: 71},
						{startTime: 3.99, note: 72},
						{startTime: 4.0, note: 60},
						{startTime: 4.25, note: 64},
						{startTime: 5.0, note: 67},
						{startTime: 5.5, note: 71},
						{startTime: 5.99, note: 72},
					],
				},
				{
					name: 'thrice and a half length of clip',
					start: 0.00, length: 5.00,
					expected: [
						{startTime: 0.0, note: 60},
						{startTime: 0.25, note: 64},
						{startTime: 1.0, note: 67},
						{startTime: 1.5, note: 71},
						{startTime: 1.99, note: 72},
						{startTime: 2.0, note: 60},
						{startTime: 2.25, note: 64},
						{startTime: 3.0, note: 67},
						{startTime: 3.5, note: 71},
						{startTime: 3.99, note: 72},
						{startTime: 4.0, note: 60},
						{startTime: 4.25, note: 64},
					],
				},
			] as Tests
		)
			.forEach(({name, start, length, expected}) => {
				it(name, () => {
					const result = new NoteScheduler(testClip)
						.getNotes(new Range(start, length))
						.toArray()

					expect(result).to.deep.equal(expected)
				})
			})
	})
})
