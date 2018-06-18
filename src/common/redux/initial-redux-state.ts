export function getInitialReduxState() {
	return {
		daw: {
			tracks: [
				{
					name: 'bass',
					notes: [
						{
							start: 0,
							duration: 1,
							note: 69,
						},
						{
							start: 0,
							duration: 1,
							note: 48,
						},
						{
							start: 1,
							duration: 0.5,
							note: 50,
						},
						{
							start: 2,
							duration: 0.5,
							note: 52,
						},
						{
							start: 2,
							duration: 0.5,
							note: 69,
						},
					],
				},
				{
					name: 'melody',
					notes: [
						{
							start: 0,
							duration: 1,
							note: 54,
						},
						{
							start: 0.5,
							duration: 0.5,
							note: 55,
						},
						{
							start: 1,
							duration: 1,
							note: 56,
						},
						{
							start: 3,
							duration: 0.75,
							note: 57,
						},
					],
				},
			],
		},
		// instruments: [
		// 	{
		// 		name: 'Basic-1',
		// 		type: 'BasicInstrument',
		// 		data: {
		// 			voiceCount: 10,
		// 			pan: 0,
		// 			oscillatorType: 'sawtooth',
		// 		},
		// 	},
		// ],
	}
}
