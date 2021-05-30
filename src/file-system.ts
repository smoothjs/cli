import { deepStrictEqual, strictEqual } from 'assert'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'fs'
import { dirname, join, parse } from 'path'
import { cyan, green } from 'colors/safe'

export class ClientError extends Error {
  readonly name = 'ClientError'
}

export class FileSystem {
  currentDir = ''

  private testing = false
  private readonly testDir = 'test-generators/dd'
  private logs = true

  /**
   * Do not show create and update logs.
   *
   * @returns {this}
   * @memberof FileSystem
   */
  hideLogs(): this {
    this.logs = false
    return this
  }

  /**
   * Changes the current working directory.
   *
   * @param {string} path - Relative path of the directory.
   * @returns {this}
   * @memberof FileSystem
   */
  cd(path: string): this {
    this.currentDir = join(this.currentDir, path)
    return this
  }

  /**
   * Changes the current working directory to the project root
   * directory.
   *
   * It searches for the closer package.json containing @smoothjs/smooth
   * as dependency.
   *
   * @returns {this}
   * @memberof FileSystem
   */
  cdProjectRootDir(): this {
    // "/" on Unix, C:\ on Windows
    const root = parse(process.cwd()).root

    while (!this.exists('package.json')) {
      if (join(process.cwd(), this.parse('.')) === root) {
        throw new ClientError('This project is not a SmoothJS project. No package.json found.')
      }
      this.cd('..')
    }
    const content = readFileSync(this.parse('package.json'), 'utf8')

    let pkg: any
    try {
      pkg = JSON.parse(content)
    } catch (error) {
      throw new ClientError(`The file package.json is not a valid JSON. ${error.message}`)
    }

    if (!pkg.dependencies || !pkg.dependencies['@smoothjs/smooth']) {
      throw new ClientError(
        'This project is not a SmoothJS project. The dependency @smoothjs/smooth is missing in package.json.'
      )
    }

    return this
  }

  /**
   * Checks if a file or directory exists.
   *
   * @param {string} path - The path relative to the client directory.
   * @returns {boolean}
   * @memberof FileSystem
   */
  exists(path: string): boolean {
    return existsSync(this.parse(path))
  }

  /**
   * Recursively ensures that a directory exists. If the directory structure does not
   * exist, it is created.
   *
   * @param {string} path - The path relative to the client directory.
   * @returns {this}
   * @memberof FileSystem
   */
  ensureDir(path: string): this {
    const dir = dirname(path)
    if (dir !== '.') {
      this.ensureDir(dir)
    }
    if (!existsSync(this.parse(path))) {
      mkdirSync(this.parse(path))
    }
    return this
  }

  /**
   * Recursively ensures that a directory exists if the condition is true.
   * If the directory structure does not exist, it is created.
   *
   * @param {boolean} condition - The condition.
   * @param {string} path - The path relative to the client directory.
   * @returns {this}
   * @memberof FileSystem
   */
  ensureDirOnlyIf(condition: boolean, path: string): this {
    if (condition) {
      this.ensureDir(path)
    }
    return this
  }

  /**
   * Ensures that the file exists. If the file does not exist, it is created.
   *
   * @param {string} path - The path relative to the client directory.
   * @returns {this}
   * @memberof FileSystem
   */
  ensureFile(path: string): this {
    if (!existsSync(this.parse(path))) {
      this.logCreate(path)
      writeFileSync(this.parse(path), '', 'utf8')
    }
    return this
  }

  /**
   * Copies a file from the `templates` directory.
   *
   * @param {string} src - The source path relative to the `templates/` directory.
   * @param {string} dest - The destination path relative to the client directory.
   * @returns {this}
   * @memberof FileSystem
   */
  copy(src: string, dest: string): this {
    const templatePath = join(__dirname, 'templates', src)
    if (!existsSync(templatePath)) {
      throw new Error(`The template "${src}" does not exist.`)
    }
    this.logCreate(dest)
    copyFileSync(templatePath, this.parse(dest))
    return this
  }

  /**
   * Copies a file from the `templates` directory if the condition is true.
   *
   * @param {boolean} condition - The condition.
   * @param {string} src - The source path relative to the `templates/` directory.
   * @param {string} dest - The destination path relative to the client directory.
   * @returns {this}
   * @memberof FileSystem
   */
  copyOnlyIf(condition: boolean, src: string, dest: string): this {
    if (condition) {
      this.copy(src, dest)
    }
    return this
  }

  /**
   * Copies and renders a template from the `templates` directory.
   *
   * @param {string} src - The source path relative to the `templates/` directory.
   * @param {string} dest - The destination path relative to the client directory.
   * @param {*} locals - The template variables.
   * @returns {this}
   * @memberof FileSystem
   */
  render(src: string, dest: string, locals: any): this {
    const templatePath = join(__dirname, 'templates', src)
    if (!existsSync(templatePath)) {
      throw new Error(`The template "${src}" does not exist.`)
    }
    let content = readFileSync(templatePath, 'utf8')
    for (const key in locals) {
      content = content.split(`/* ${key} */`).join(locals[key])
    }
    this.logCreate(dest)
    writeFileSync(this.parse(dest), content, 'utf8')
    return this
  }

  /**
   * Copies and renders a template from the `templates` directory if the condition is true.
   *
   * @param {boolean} condition - The condition.
   * @param {string} src - The source path relative to the `templates/` directory.
   * @param {string} dest - The destination path relative to the client directory.
   * @param {*} locals - The template variables.
   * @returns {this}
   * @memberof FileSystem
   */
  renderOnlyIf(condition: boolean, src: string, dest: string, locals: any): this {
    if (condition) {
      this.render(src, dest, locals)
    }
    return this
  }

  /**
   * Reads and modifies the content of a file.
   *
   * @param {string} path - The path relative to the client directory.
   * @param {(content: string) => string} callback - The callback that modifies the content.
   * @returns {this}
   * @memberof FileSystem
   */
  modify(path: string, callback: (content: string) => string): this {
    if (!existsSync(this.parse(path))) {
      throw new ClientError(`Impossible to modify "${path}": the file does not exist.`)
    }
    const content = readFileSync(this.parse(path), 'utf8')
    this.logUpdate(path)
    writeFileSync(this.parse(path), callback(content), 'utf8')
    return this
  }

  /**
   * Reads and modifies the content of a file if the condition is true.
   *
   * @param {boolean} condition - The condition.
   * @param {string} path - The path relative to the client directory.
   * @param {(content: string) => string} callback - The callback that modifies the content.
   * @returns {this}
   * @memberof FileSystem
   */
  modifyOnlyfIf(condition: boolean, path: string, callback: (content: string) => string): this {
    if (condition) {
      this.modify(path, callback)
    }
    return this
  }

  /**
   * Returns true if the project package.json has this dependency.
   * Returns false otherwise.
   *
   * @param {string} name - The name of the dependency.
   * @returns {boolean}
   * @memberof FileSystem
   */
  projectHasDependency(name: string): boolean {
    const initialCurrentDir = this.currentDir

    this.cdProjectRootDir()
    const pkg = JSON.parse(readFileSync(this.parse('package.json'), 'utf8'))

    this.currentDir = initialCurrentDir
    return pkg.dependencies.hasOwnProperty(name)
  }

  private isTestingEnvironment(): boolean {
    return this.testing
  }

  public setTesting() {
    this.testing = true
  }

  private parse(path: string) {
    if (this.isTestingEnvironment()) {
      return join(this.testDir, this.currentDir, path)
    }
    return join(this.currentDir, path)
  }

  private logCreate(path: string) {
    path = join(this.currentDir, path)
    //  && !this.options.noLogs
    if (!this.isTestingEnvironment() && this.logs) {
      console.log(`${green('CREATE')} ${path}`)
    }
  }

  private logUpdate(path: string) {
    //  && !this.options.noLogs
    path = join(this.currentDir, path)
    if (!this.isTestingEnvironment() && this.logs) {
      console.log(`${cyan('UPDATE')} ${path}`)
    }
  }
}
