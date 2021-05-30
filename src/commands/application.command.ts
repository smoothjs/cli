import { spawn, SpawnOptions } from 'child_process'
import { red } from 'colors/safe'
import { Command, Option, Arguments } from '../decorators'
import { FileSystem } from '../file-system'
import { rmdirSync } from 'fs'
import { getNames, log, logCommand, isYarnInstalled, execute } from '../utils'
import * as path from 'path'
export class ApplicationCommand {
  @Command({
    name: 'new <name>',
    description: 'Create a new SmoothJS application.',
    arguments: {
      name: `Application's folder.`,
    },
  })
  async create(
    @Option({
      name: 'branch',
      flag: '-b, --branch <branch>',
      description: 'Clone a specific branch.',
      defaultValue: 'master',
      required: false,
    })
    branch: string | undefined,

    @Option({
      name: 'blueprint',
      flag: '-r, --blueprint <blueprint>',
      description: 'A specific github url.',
      defaultValue: 'smoothjs/smooth-app',
      required: false,
    })
    blueprint: string | undefined,

    @Option({
      name: 'autoInstall',
      flag: '-a, --auto-install <autoInstall>',
      description: 'Auto install npm dependencies.',
      defaultValue: true,
      required: false,
    })
    autoInstall: boolean,

    @Arguments()
    args: string[]
  ) {
    const [name] = args

    const names = getNames(name)
    const isGitUrl = require('is-git-url')
    const fs = new FileSystem()

    if (fs.exists(names.kebabName)) {
      log(`${red('Error:')} The target directory "${names.kebabName}" already exists.`)
      return
    }

    log('📂 Creating files...')

    let cloneCommand = 'git clone --depth=1'

    if (branch) {
      cloneCommand = `${cloneCommand} --branch ${branch}`
    }

    if (isGitUrl(blueprint)) {
      cloneCommand = `${cloneCommand} ${blueprint} "${names.kebabName}"`
    } else {
      cloneCommand = `${cloneCommand} https://github.com/${blueprint}.git "${names.kebabName}"`
    }

    try {
      await execute(cloneCommand)
    } catch (error) {
      log(`${red('Error:')} Unable to clone ${blueprint}.`)
      return
    }

    fs.cd(names.kebabName)

    rmdirSync(path.resolve(process.cwd(), `${names.kebabName}/.git`), {
      recursive: true
    })

    if (autoInstall) {
      const packageManager = isYarnInstalled() ? 'yarn' : 'npm'

      const spinner = log(`%s 📦 Installing dependencies (${packageManager})...`, true)

      const args = ['install']
      const options: SpawnOptions = {
        cwd: names.kebabName,
        shell: true,
        stdio: 'ignore',
      }

      const success = await new Promise((resolve) => {
        spawn(packageManager, args, options).on('close', (code: number) => resolve(code === 0))
      })

      if (spinner) {
        spinner.stop(true)
      }

      if (!success) {
        log(`❗ Installing dependencies (${packageManager})...`)
        log(`${red('Error:')} A problem occurred during the installation of`)
        log('the dependencies. Try installing them manually by running')
        log('the following commands:')
        logCommand(`cd ${names.kebabName}`)
        logCommand(`${packageManager} install`)
        return
      } else {
        log(`📦 Installing dependencies (${packageManager})...`)
      }
    }

    log('✨ Project successfully created.')
    log('👉 Here are the next steps:')

    logCommand(`cd ${names.kebabName}`)
    if (!autoInstall) {
      logCommand('npm install')
    }
    logCommand('npm run build')
  }
}
