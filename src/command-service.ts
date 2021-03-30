import { getMetadata, getMethods, isFunction } from '@smoothjs/smooth'
import { Command } from 'commander'
import { CommandParamTypes } from './enums'
import { CommandOption, CommandOptionsOption } from './interfaces'

export class CommandService {
    private commander: any

    constructor(
        private commands: object[]
    ) {
      this.commander = new Command()
    }

    public create() {
        this.commander.version('0.0.1')

        this.commands.forEach((command: object) => {
            this.registerCommand(command)
        })
        
        this.commander.parse()
    }

    private registerCommand(command: object) {
        const methods: string[] = getMethods(command)

        methods.forEach((method: string) => {
            const commandOptions: CommandOption = this.getCommandHandlerMetadataValue(command, method)

            if (! commandOptions) {
              return;
            }

            const commandInstance = this.commander
              .command(commandOptions.name)
              .description(commandOptions.description, commandOptions.arguments || {})

            this.generateCommandBuilder(
              this.getCommandArgsMetadataValue(command, method),
              commandInstance
            )

            commandInstance.action(() => {
              const params = this.generateCommandHandlerParams(
                this.getCommandArgsMetadataValue(command, method),
                this.commander.opts()
              )

              if (! isFunction(command[method])) {
                // TODO DISPLAY ERROR
                return;
              }

              command[method](...params)
            })
        })
    }

    protected iteratorParamMetadata(
        params: any,
        callback: (item: any, key: string) => void
      ) {
        if (!params) {
          return;
        }
    
        Object.keys(params).forEach(key => {
          const param: any[] = params[key];
          if (!param || !Array.isArray(param)) {
            return;
          }
    
          param.forEach(metadata => callback(metadata, key));
        });
    }
    
    private generateCommandBuilder(
        params: CommandOptionsOption[],
        commandInstance: Command
    ) {
        const list: any = [];
    
        this.iteratorParamMetadata(params, (item, key) => {
          switch (key) {
            case CommandParamTypes.OPTION:
              commandInstance[(item.option as CommandOptionsOption).required ? 'requiredOption' : 'option'](
                    (item.option as CommandOptionsOption).flag,
                    (item.option as CommandOptionsOption).description,
                    (item.option as CommandOptionsOption).defaultValue
                )
              break;
            default:
              break;
          }
        });
    
        return list;
    }

    private generateCommandHandlerParams(
        params: CommandOptionsOption[],
        argv: any
      ) {
        const list: any = [];
    
        this.iteratorParamMetadata(params, (item, key) => {
          switch (key) {
            case CommandParamTypes.OPTION:
              list[item.index] = argv[(item.option as CommandOptionsOption).name];
              break;

            case CommandParamTypes.ARGV:
              list[item.index] = this.commander.args.splice(1);
              break;
            default:
              break;
          }
        });
    
        return list;
    }

    private getCommandHandlerMetadataValue(command: object, method: string) {
        return getMetadata('COMMAND_HANDLER_METADATA', command, method) || false
    }

    private getCommandArgsMetadataValue(command: object, method: string) {
        return getMetadata('COMMAND_ARGS_METADATA', command.constructor, method) || []
    }
}