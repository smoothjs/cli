import { execSync } from 'child_process'
import { Spinner } from 'cli-spinner'
import { red } from 'colors'
import { cyan } from 'colors/safe'
import { readdirSync, rmdirSync, statSync, unlinkSync } from 'fs'
import { join } from 'path'
import { CommandParamTypes } from './enums'
import { CommandParamMetadataItem } from './interfaces'

export type CommandParamMetadata<O> = {
  [type in CommandParamTypes]: CommandParamMetadataItem<O>[]
}

const exec = require('util').promisify(require('child_process').exec)

export function getNames(
  name: string
): { camelName: string; kebabName: string; upperFirstCamelName: string } {
  const camelName = name.replace(/-([a-z])/gi, (g) => g[1].toUpperCase())
  const kebabName = name.replace(/([a-z][A-Z])/g, (g) => `${g[0]}-${g[1].toLowerCase()}`)
  const upperFirstCamelName = camelName.charAt(0).toUpperCase() + camelName.slice(1)

  return { camelName, kebabName, upperFirstCamelName }
}

export function log(msg: string = '', spinner: boolean = false): any {
  if (spinner) {
    const spinner = new Spinner(msg)
    spinner.setSpinnerString(18)
    spinner.start()
    return spinner
  }

  console.log(msg)
}

export function logCommand(msg: string) {
  log(`$ ${cyan(msg)}`)
}

export function isYarnInstalled() {
  try {
    execSync('yarn --version', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

export function rmDirAndFiles(path: string) {
  const files = readdirSync(path)
  for (const file of files) {
    const stats = statSync(join(path, file))

    if (stats.isDirectory()) {
      rmDirAndFiles(join(path, file))
    } else {
      unlinkSync(join(path, file))
    }
  }

  rmdirSync(path)
}

export async function execute(command: string) {
  const { stdout } = await exec(command)
  return stdout
}

export function displayError(...lines: string[]): void {
  lines.forEach((line) => console.error(red(line)))
  process.exitCode = 1
}
