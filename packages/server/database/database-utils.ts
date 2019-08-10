import {Collection, IndexSpecification} from 'mongodb'
import {ClassType} from 'class-transformer/ClassTransformer'
import {transformAndValidateDbResult} from '@corgifm/common/validation'

export async function sumField<T>(
	collection: Collection<T>,
	$match: Partial<T>,
	sumField: keyof T,
): Promise<number> {
	const result = await collection.aggregate<{sum: unknown}>([{
		$match,
	}, {
		$group: {
			_id: null,
			sum: {
				$sum: '$' + sumField,
			},
		},
	}]).toArray()

	const sum = result[0].sum

	if (typeof sum !== 'number') throw new Error('expected number: ' + {sum})

	return sum
}

export async function insertOne<T>(
	collection: Collection<T>,
	document: T,
): Promise<void> {
	const result = await collection.insertOne(document)

	if (result.insertedCount !== 1) {
		throw new Error(
			'expected 1 inserted: ' + JSON.stringify(result, null, 2))
	}
}

export async function upsertOneWhole<T, U extends T>(
	collection: Collection<T>,
	filter: Partial<U>,
	document: U,
): Promise<void> {
	await collection.updateOne(
		filter,
		{$set: document},
		{upsert: true})
}

export async function findOne<T extends object, U extends T>(
	collection: Collection<T>,
	filter: Partial<U>,
	targetClass: ClassType<T>,
): Promise<T | null> {
	const result = await collection.findOne(filter)

	if (result === null) return null

	return transformAndValidateDbResult(targetClass, result)
}

export interface CorgiIndexes<TSchema> extends IndexSpecification {
	key: {[key in keyof TSchema]?: 1 | -1}
}
