import { CommandParamMetadata } from "../utils";
import { CommandOption } from "./command-option";
import { CommandOptionsOption } from "./command-options-option";

export interface CommandMetadata {
    params: CommandParamMetadata<CommandOptionsOption>;
    option: CommandOption;
}