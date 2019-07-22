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
		const transformed = plainToClass(targetClass, ctx.request.body)

		await validateOrRejectCustom(transformed)

		return callback(ctx, transformed)
	}
}

async function validateOrRejectCustom(object: object) {
	await validateOrReject(object, {
		validationError: {
			target: false,
		},
		forbidUnknownValues: true,
	})
}
