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
		const columnWidth = 128
		const rowHeight = 192

		// Center root node
		mutablePositions.update(MASTER_AUDIO_OUTPUT_TARGET_ID, x => ({...x, x: 0, y: 0}))

		const calculatePosition = (parentX = 0, parentRow = 0) => (connectionToParent: IConnection, currentRow: number) => {
			const currentId = connectionToParent.sourceId

			const currentPosition = mutablePositions.get(currentId)!

			const newX = Math.min(parentX - currentPosition.width - columnWidth, currentPosition.x)

			mutablePositions.set(
				currentId,
				{
					...currentPosition,
					x: newX,
					y: (currentRow * rowHeight) + (parentRow * rowHeight) - (currentPosition.height / 2),
				},
			)

			selectConnectionsWithTargetIds2(connections, [currentId])
				.toList()
				.forEach(calculatePosition(newX, currentRow))
		}

		connectionsToMasterAudioOutput.forEach(calculatePosition(mutablePositions.get(MASTER_AUDIO_OUTPUT_TARGET_ID)!.width - columnWidth, 0))
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
