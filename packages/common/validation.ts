import {plainToClass} from 'class-transformer'
import {validate, ValidationError} from 'class-validator'
import {ClassType} from 'class-transformer/ClassTransformer'
import {isClient} from '@corgifm/common/is-client-or-server'

export async function transformAndValidateDbResult<T extends object>(
	targetClass: ClassType<T>, data: unknown,
): Promise<T> {
	return transformAndValidate(targetClass, data)
		.catch(error => {
			throw new Error(
				'[transformAndValidateDbResult] error while validating data from DB: '
				+ JSON.stringify(error, null, 2))
		})
}

export async function transformAndValidate<T extends object>(
	targetClass: ClassType<T>, data: unknown,
): Promise<T> {
	return validateOrRejectCustom(
		plainToClass(targetClass, data))
}

async function validateOrRejectCustom<T>(object: T): Promise<T> {
	const errors = await validate(object, {
		validationError: {
			target: false,
			value: isClient(),
		},
		forbidUnknownValues: true,
		whitelist: true,
	})

	if (errors.length === 0) return object

	throw new CorgiValidationError(errors)
}

export async function transformAndValidateDbResultArray<T extends object>(
	targetClass: ClassType<T>, data: unknown[],
): Promise<T[]> {
	return transformAndValidateArray(targetClass, data)
		.catch(error => {
			throw new Error(
				'error while validating data from DB: '
				+ JSON.stringify(error, null, 2))
		})
}

export async function transformAndValidateArray<T extends object>(
	targetClass: ClassType<T>, data: unknown[],
): Promise<T[]> {
	return validateOrRejectCustomArray(
		plainToClass(targetClass, data))
}

async function validateOrRejectCustomArray<T>(objects: T[]): Promise<T[]> {
	objects.forEach(async object => {
		await validateOrRejectCustom(object)
	})
	return objects
}

/** Message will be displayed to user */
export class CorgiValidationError extends Error {
	public constructor(
		public readonly validationError: ValidationError[]
	) {
		super('validation error(s): ' + JSON.stringify(validationError, null, 2))
	}
}
