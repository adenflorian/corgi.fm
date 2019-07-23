import {Context} from 'koa'
import {ClassType} from 'class-transformer/ClassTransformer'
import {plainToClass} from 'class-transformer'
import {validateOrReject} from 'class-validator'

type ValidateCB<T> = (ctx: Context, x: T) => Promise<any>

/** Returns middleware that will transform and validate the request body.
 * Validation errors will cause a rejection that you can handle in higher
 * up middleware. */
export function validate<T extends object>(
	targetClass: ClassType<T>, callback: ValidateCB<T>
) {
	return async (ctx: Context): Promise<T> => {
		return callback(
			ctx,
			await transformAndValidate(targetClass, ctx.request.body))
	}
}

export async function transformAndValidate<T extends object>(
	targetClass: ClassType<T>, data: any,
): Promise<T> {
	return validateOrRejectCustom(
		plainToClass(targetClass, data))
}

async function validateOrRejectCustom<T>(object: T): Promise<T> {
	await validateOrReject(object, {
		validationError: {
			target: false,
		},
		forbidUnknownValues: true,
		// forbidNonWhitelisted: true,
		whitelist: true,
	})

	return object
}
