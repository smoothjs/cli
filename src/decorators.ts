import 'reflect-metadata'
import { setMetadata } from '@smoothjs/smooth'
import { CommandParamTypes } from './enums'
import { CommandOption, CommandOptionsOption } from './interfaces'

const createCommandParamDecorator = <O>(paramtype: CommandParamTypes) => {
  return (option?: O): ParameterDecorator => (target, key, index) => {
    const params = Reflect.getMetadata('COMMAND_ARGS_METADATA', target.constructor, key) || {}
    Reflect.defineMetadata(
      'COMMAND_ARGS_METADATA',
      {
        ...params,
        [paramtype]: [...(params[paramtype] || []), { index, option }],
      },
      target.constructor,
      key
    )
  }
}

export function Command(option: CommandOption): MethodDecorator {
  return (target: object, key: string | symbol) => {
    setMetadata('COMMAND_HANDLER_METADATA', target, option, key)
  }
}

export const Option = createCommandParamDecorator<CommandOptionsOption>(CommandParamTypes.OPTION)

export const Arguments = createCommandParamDecorator(CommandParamTypes.ARGV)
