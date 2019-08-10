import {Db} from 'mongodb'
import {Upload} from '@corgifm/common/models/OtherModels'
import {sumField, insertOne, CorgiIndexes} from './database-utils'

export const uploadsQueries = async (db: Db) => {
	const uploadsCollection = db.collection<Upload>('uploads')

	await uploadsCollection.createIndexes([{
		key: {ownerUid: 1},
		background: true,
	}] as CorgiIndexes<Upload>[])

	return {
		collectionName: uploadsCollection.collectionName,

		async put(upload: Upload): Promise<void> {
			return insertOne(uploadsCollection, upload)
		},

		async getTotalUploadBytesForUser(ownerUid: Id): Promise<number> {
			return sumField(uploadsCollection, {ownerUid}, 'sizeBytes')
		},
	} as const
}
