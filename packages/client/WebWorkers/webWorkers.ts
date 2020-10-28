import {ImpulseBuildRequest, ImpulseBuilderResponse} from '@corgifm/common/common-types';

const timeoutSeconds = 5

export class ImpulseBuilder {
	public async build(request: ImpulseBuildRequest): Promise<ImpulseBuilderResponse> {
		return new Promise((resolve, reject) => {
			const worker = new Worker(getWorkerPath('impulseBuilderWorker'));

			worker.postMessage(request)

			worker.onmessage = function (event) {
				if (event.data.id === request.id) {
					resolve(event.data)
				}
			}

			setTimeout(() => {
				reject(`worker exceeded timeout of ${timeoutSeconds} seconds: ${{request}}`)
			}, timeoutSeconds * 1000)
		})
	}
}

export const impulseBuilder = new ImpulseBuilder()

function getWorkerPath(name: string) {
	return `WebWorkers/Workers/${name}.js`
}
