import { getConfigPaths } from '~/services/config'
import { buildImage, getImageName } from '~/services/docker'
import { CommandPayload, CommandOptionsDefault } from '~/types'
import * as logger from '~/logger'

interface ActionOptions extends CommandOptionsDefault {
  tag?: string
  raw?: boolean
}

export default async function build({ options }: CommandPayload<ActionOptions>) {
  const configPaths = await getConfigPaths(options, true)

  const tagName = options.tag || (await getImageName({ configPath: configPaths.docker })).name

  logger.spinnerStart('Building Docker image')

  try {
    await buildImage({
      raw: !!options.raw,
      configPath: configPaths.docker,
      name: tagName,
      onLog(line) {
        if (options.raw) {
          logger.info(line)
        }
      },
    })
    logger.spinnerSucceed(`Built Docker image with name: ${tagName}`)
  } catch (error) {
    process.exitCode = 1

    logger.spinnerFail('Error building Docker image')
    logger.error(error)
  }
}