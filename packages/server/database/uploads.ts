import {Db} from 'mongodb'
import {SampleUpload} from '@corgifm/common/models/OtherModels'
import {sumField, insertOne, CorgiIndexes, findMany} from './database-utils'

export const uploadsQueries = async (db: Db) => {
	const uploadsCollection = db.collection<SampleUpload>('uploads')

	await uploadsCollection.createIndexes([{
		key: {ownerUid: 1},
		background: true,
	}] as CorgiIndexes<SampleUpload>[])

	return {
		collectionName: uploadsCollection.collectionName,

		async put(upload: SampleUpload): Promise<void> {
			return insertOne(uploadsCollection, upload)
		},

		async getTotalUploadBytesForUser(ownerUid: Id): Promise<number> {
			return sumField(uploadsCollection, {ownerUid}, 'sizeBytes')
		},

		async getByOwnerId(ownerUid: Id): Promise<SampleUpload[]> {
			return findMany(uploadsCollection, {ownerUid}, SampleUpload)
		},
	} as const
}
