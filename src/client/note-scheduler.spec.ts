import {expect} from 'chai'
import {List} from 'immutable'
import {makeMidiClip, MidiEvent, NoteScheduler, Range} from './note-scheduler'

const event0 = {startBeat: 0.0, note: 60}
const event1 = {startBeat: 0.25, note: 64}
const event2 = {startBeat: 1.0, note: 67}
const event3 = {startBeat: 1.5, note: 71}
const event4 = {startBeat: 1.99, note: 72}
const event5 = {startBeat: 2.0, note: 71}

const testClip = makeMidiClip({
	length: 2,
	loop: true,
	events: List([
		event0,
		event1,
		event2,
		event3,
		event4,
		event5,
	]),
})

type Tests = Array<{
	name: string,
	start: number,
	end: number,
	expected: MidiEvent[],
}>

describe.only('note-scheduler', () => {
	describe('Range', () => {
		describe('normalize', () => {
			it('should work', () => {
				const normalizedRange = new Range(3.99, 4.647).normalize(2)
				expect(normalizedRange.start).to.equal(1.99)
				expect(normalizedRange.end).to.equal(0.647)
			})
		})
	})
	describe('invalid inputs', () => {
		it('should fail when start time is negative', () => {
			expect(() => {
				new NoteScheduler(makeMidiClip())
					.getNotes(new Range(-1, 1))
			})
				.to.throw('start time must be >= 0')
		})
		it('should fail when start time is greater than end time', () => {
			expect(() => {
				new NoteScheduler(makeMidiClip())
					.getNotes(new Range(2, 1))
			})
				.to.throw(`start time must be <= end time`)
		})
		it('should fail when clipLength is negative', () => {
			expect(() => {
				new NoteScheduler(makeMidiClip({length: -1}))
					.getNotes(new Range(0, 1))
			})
				.to.throw(`clipLength must be > 0`)
		})
	})
	describe('stuff', () => {
		(
			[
				{
					name: '0 range - 0.00',
					start: 0.00,
					expected: [event0],
				},
				{
					name: '0 range - 0.25',
					start: 0.25,
					expected: [event1],
				},
				{
					name: '0 range - 1.00',
					start: 1.00,
					expected: [event2],
				},
				{
					name: '0 range - 2.00',
					start: 2.00,
					expected: [event0],
				},
				{
					name: '0 range - 3.00',
					start: 3.00,
					expected: [event2],
				},
				{
					name: '0 range - 3.99',
					start: 3.99,
					expected: [event4],
				},

				// start 0 range < clip.length
				{
					name: 'start 0 range < clip.length - A',
					start: 0.00, end: 0.01,
					expected: [event0],
				},
				{
					name: 'start 0 range < clip.length - B',
					start: 0.00, end: 0.25,
					expected: [event0],
				},
				{
					name: 'start 0 range < clip.length - C',
					start: 0.00, end: 0.250000001,
					expected: [
						{startBeat: 0.00, note: 60},
						{startBeat: 0.25, note: 64},
					],
				},

				{
					name: 'exact length of clip',
					start: 0.00, end: 2.00,
					expected: [
						{startBeat: 0.0, note: 60},
						{startBeat: 0.25, note: 64},
						{startBeat: 1.0, note: 67},
						{startBeat: 1.5, note: 71},
						{startBeat: 1.99, note: 72},
					],
				},
				{
					name: 'half length, start halfway',
					start: 1.00, end: 2.00,
					expected: [
						{startBeat: 1.0, note: 67},
						{startBeat: 1.5, note: 71},
						{startBeat: 1.99, note: 72},
					],
				},
				// {
				// 	name: 'exact length, 1st loop',
				// 	start: 2.00, end: 4.00,
				// 	expected: [
				// 		{startBeat: 0.0, note: 60},
				// 		{startBeat: 0.25, note: 64},
				// 		{startBeat: 1.0, note: 67},
				// 		{startBeat: 1.5, note: 71},
				// 		{startBeat: 1.99, note: 72},
				// 	],
				// },
				// {
				// 	name: 'exact length, start halfway',
				// 	start: 1.00, end: 3.00,
				// 	expected: [
				// 		{startBeat: 1.0, note: 67},
				// 		{startBeat: 1.5, note: 71},
				// 		{startBeat: 1.99, note: 72},
				// 		{startBeat: 0.0, note: 60},
				// 		{startBeat: 0.25, note: 64},
				// 	],
				// },
				// {
				// 	name: 'twice length of clip',
				// 	start: 0.00, end: 4.00,
				// 	expected: [
				// 		{startBeat: 0.0, note: 60},
				// 		{startBeat: 0.25, note: 64},
				// 		{startBeat: 1.0, note: 67},
				// 		{startBeat: 1.5, note: 71},
				// 		{startBeat: 1.99, note: 72},
				// 		{startBeat: 2.00, note: 71},
				// 		{startBeat: 0.0, note: 60},
				// 		{startBeat: 0.25, note: 64},
				// 		{startBeat: 1.0, note: 67},
				// 		{startBeat: 1.5, note: 71},
				// 		{startBeat: 1.99, note: 72},
				// 	],
				// },
			] as Tests
		)
			.forEach(({name, start, end, expected}) => {
				it(name, () => {
					const result = new NoteScheduler(testClip)
						.getNotes(new Range(start, end))
						.toArray()

					expect(result).to.deep.equal(expected)
				})
			})
	})
})
