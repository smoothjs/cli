import { getNames } from '../utils'
import { basename, dirname } from 'path'
import { FileSystem } from '../file-system'
import { Command, Arguments } from '../decorators'

export class MakeCommand {
  @Command({
    name: 'make:controller <name>',
    description: 'Create a new HTTP Controller.',
    arguments: {
      name: 'Controller class name.',
    },
  })
  async controller(
    @Arguments()
    args: string[]
  ) {
    const [name] = args

    const fs = new FileSystem()

    let root = ''
    if (fs.exists('app/controllers')) {
      root = 'app/controllers'
    } else if (fs.exists('controllers')) {
      root = 'controllers'
    }

    const names = getNames(basename(name))
    const subdir = dirname(name)
    const parentControllerPath = `${subdir === '.' ? 'app' : basename(subdir)}.controller.ts`

    const fileName = `${names.kebabName}.controller.ts`

    const className = `${names.upperFirstCamelName}Controller`

    fs.cd(root).ensureDir('.').cd('.').render('controller.empty.ts', fileName, names)
  }

  @Command({
    name: 'make:entity <name>',
    description: 'Create a new typeorm entity.',
    arguments: {
      name: 'Entity class name.',
    },
  })
  async entity(
    @Arguments()
    args: string[]
  ) {
    const [name] = args

    const fs = new FileSystem()

    let root = ''
    if (fs.exists('app/entities')) {
      root = 'app/entities'
    } else if (fs.exists('entities')) {
      root = 'entities'
    }

    const names = getNames(name)

    fs.cd(root).render('entity.empty.ts', `${names.kebabName}.entity.ts`, names)
  }

  @Command({
    name: 'make:hook <name>',
    description: 'Create a new hook.',
    arguments: {
      name: 'Hook file name.',
    },
  })
  async hook(
    @Arguments()
    args: string[]
  ) {
    const [name] = args

    const fs = new FileSystem()

    let root = ''
    if (fs.exists('app/hooks')) {
      root = 'app/hooks'
    } else if (fs.exists('hooks')) {
      root = 'hooks'
    }

    const names = getNames(name)

    fs.cd(root).render('hook.empty.ts', `${names.kebabName}.hook.ts`, names)
  }

  @Command({
    name: 'make:service <name>',
    description: 'Create a application service.',
    arguments: {
      name: 'Service class name.',
    },
  })
  async service(
    @Arguments()
    args: string[]
  ) {
    const [name] = args

    const fs = new FileSystem()

    let root = ''
    if (fs.exists('app/services')) {
      root = 'app/services'
    } else if (fs.exists('services')) {
      root = 'services'
    }

    const names = getNames(basename(name))
    const subdir = dirname(name)

    fs.cd(root)
      .ensureDir(subdir)
      .cd(subdir)
      .render('service.empty.ts', `${names.kebabName}.service.ts`, names)
  }
}
