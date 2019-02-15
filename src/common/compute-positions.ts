import {
	calculateExtremes, IConnection, IConnections,
	IPositions, MASTER_AUDIO_OUTPUT_TARGET_ID, MASTER_CLOCK_SOURCE_ID,
	selectConnectionsWithTargetIds2,
} from './redux'

// TODO Take position width and height into account
export function calculatePositionsGivenConnections(positions: IPositions, connections: IConnections) {
	const originalPositions = positions

	const connectionsToMasterAudioOutput = selectConnectionsWithTargetIds2(connections, [MASTER_AUDIO_OUTPUT_TARGET_ID]).toList()

	const newPositions = originalPositions.withMutations(mutablePositions => {
		const xSpacing = 128
		const ySpacing = 192

		mutablePositions.update(MASTER_AUDIO_OUTPUT_TARGET_ID, x => ({...x, x: 0, y: 0}))

		const calculatePosition = (prevX = 0, prevY = 0) => (connection: IConnection, i: number) => {
			const position = mutablePositions.get(connection.sourceId)!
			const newX = Math.min(prevX - position.width - xSpacing, position.x)
			mutablePositions.update(
				connection.sourceId,
				z => ({
					...z,
					x: newX,
					y: (i * ySpacing) + (prevY * ySpacing) - (position.height / 2),
				}),
			)
			selectConnectionsWithTargetIds2(connections, [connection.sourceId])
				.toList()
				.forEach(calculatePosition(newX, i))
		}

		connectionsToMasterAudioOutput.forEach(calculatePosition(mutablePositions.get(MASTER_AUDIO_OUTPUT_TARGET_ID)!.width - xSpacing, 0))
	})

	// Centering graph
	const {leftMost, rightMost, topMost, bottomMost} = calculateExtremes(newPositions)
	const adjustX = -(leftMost + rightMost) / 2
	const adjustY = -(topMost + bottomMost) / 2

	// Center audio output (root node) vertically
	return newPositions
		.map(x => ({...x, x: x.x + adjustX, y: x.y + adjustY}))
		.update(MASTER_AUDIO_OUTPUT_TARGET_ID, x => ({...x, y: 0}))
		.update(MASTER_CLOCK_SOURCE_ID, x => ({...x, y: 0}))
}
