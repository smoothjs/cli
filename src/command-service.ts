import { getMetadata, getMethods, isFunction, isObject } from '@smoothjs/smooth'
import { Command } from 'commander'
import { CommandParamTypes } from './enums'
import { CommandOption, CommandOptionsOption } from './interfaces'

export class CommandService {
  private commander: any

  constructor(private commands: object[]) {
    this.commander = new Command()
  }

  public async create() {
    this.commander.version('0.1.5', '-v, --version', 'Output the current CLI version')

    this.commands.forEach((command: object) => {
      this.registerCommand(command)
    })

    await this.commander.parseAsync()

    return this.commander
  }

  private registerCommand(command: object) {
    const methods: string[] = getMethods(command)

    methods.forEach((method: string) => {
      const commandOptions: CommandOption = this.getCommandHandlerMetadataValue(command, method)

      if (!commandOptions) {
        return
      }

      const commandInstance = this.commander
        .command(commandOptions.name)
        .description(commandOptions.description, commandOptions.arguments || {})

      this.generateCommandBuilder(
        this.getCommandArgsMetadataValue(command, method),
        commandInstance
      )

      commandInstance.action((...options) => {
        const params = this.generateCommandHandlerParams(
          this.getCommandArgsMetadataValue(command, method),
          this.getOptionsFromArgv(options)
        )

        if (!isFunction(command[method])) {
          // TODO DISPLAY ERROR
          return
        }

        command[method](...params)
      })
    })
  }

  private iteratorParamMetadata(params: any, callback: (item: any, key: string) => void) {
    if (!params) {
      return
    }

    Object.keys(params).forEach((key) => {
      const param: any[] = params[key]
      if (!param || !Array.isArray(param)) {
        return
      }

      param.forEach((metadata) => callback(metadata, key))
    })
  }

  private generateCommandBuilder(params: CommandOptionsOption[], commandInstance: Command) {
    const list: any = []

    this.iteratorParamMetadata(params, (item, key) => {
      switch (key) {
        case CommandParamTypes.OPTION:
          commandInstance[
            (item.option as CommandOptionsOption).required ? 'requiredOption' : 'option'
          ](
            (item.option as CommandOptionsOption).flag,
            (item.option as CommandOptionsOption).description,
            (item.option as CommandOptionsOption).defaultValue
          )
          break
        default:
          break
      }
    })

    return list
  }

  private generateCommandHandlerParams(params: CommandOptionsOption[], argv: object) {
    const list: any = []

    this.iteratorParamMetadata(params, (item, key) => {
      switch (key) {
        case CommandParamTypes.OPTION:
          list[item.index] = argv[(item.option as CommandOptionsOption).name]
          break

        case CommandParamTypes.ARGV:
          list[item.index] = this.commander.args.splice(1)
          break
        default:
          break
      }
    })

    return list
  }

  private getOptionsFromArgv(
    argv: any[]
  ): object {
    let list: object = {}
    
    argv.forEach((arg) => {
      if (isObject(arg) && !(arg instanceof Command)) {
        list = arg
      }
    })

    return list
  }

  private getCommandHandlerMetadataValue(command: object, method: string) {
    return getMetadata('COMMAND_HANDLER_METADATA', command, method) || false
  }

  private getCommandArgsMetadataValue(command: object, method: string) {
    return getMetadata('COMMAND_ARGS_METADATA', command.constructor, method) || []
  }
}
