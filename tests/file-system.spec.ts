import test from 'japa'
import { mkdirSync, readFileSync, rmdirSync, unlinkSync, writeFileSync, existsSync } from 'fs'
import { ClientError, FileSystem } from '../src/file-system'
import { join } from 'path'

test.group('ClinetError', () => {
  test('inherit from Error', async (assert) => {
    assert.instanceOf(new ClientError(), Error)
  })

  test('"name" property equal to ClientError', async (assert) => {
    assert.equal(new ClientError().name, 'ClientError')
  })
})

test.group('FileSystem | cd', (group) => {
  let fs: FileSystem

  group.beforeEach(() => {
    fs = new FileSystem()
    fs.setTesting()
  })

  test('cd method changes the current directory', async (assert) => {
    assert.equal(fs.currentDir, '')

    fs.cd('foobar/foo')
    assert.equal(fs.currentDir.replace(/\\/g, '/'), 'foobar/foo')

    fs.cd('../bar')
    assert.equal(fs.currentDir.replace(/\\/g, '/'), 'foobar/bar')
  })
})

test.group('FileSystem | cdProjectRootDir', (group) => {
  let rootPkg: Buffer
  let fs: FileSystem

  group.beforeEach(() => {
    fs = new FileSystem()
    fs.setTesting()
  })

  group.before(() => {
    rootPkg = readFileSync('package.json')
    unlinkSync('package.json')
  })

  group.after(() => {
    writeFileSync('package.json', rootPkg)
  })

  group.beforeEach(() => {
    mkdirSync('test-generators')
    mkdirSync('test-generators/dd')
    mkdirSync('test-generators/dd/foo')
    mkdirSync('test-generators/dd/foo/bar')
  })

  group.afterEach(() => {
    if (existsSync('test-generators/dd/package.json')) {
      unlinkSync('test-generators/dd/package.json')
    }

    rmdirSync('test-generators/dd/foo/bar')
    rmdirSync('test-generators/dd/foo')
    rmdirSync('test-generators/dd')
    rmdirSync('test-generators')
  })

  test('throw a ClienError if the package.json is not a valid JSON', async (assert) => {
    writeFileSync('test-generators/dd/package.json', 'hello-world', 'utf8')

    fs.cd('foo/bar')

    try {
      fs.cdProjectRootDir()
    } catch (error) {
      assert.equal(
        error.message,
        'The file package.json is not a valid JSON. Unexpected token h in JSON at position 0'
      )
    }
  })

  test('throw a ClienError if the package.json found does not have @smoothjs/smooth as dependency', async (assert) => {
    writeFileSync('test-generators/dd/package.json', JSON.stringify({}), 'utf8')

    fs.cd('foo/bar')
    try {
      fs.cdProjectRootDir()
    } catch (error) {
      assert.equal(
        error.message,
        'This project is not a SmoothJS project. The dependency @smoothjs/smooth is missing in package.json.'
      )
    }
  })

  test('throw a ClientError if no package.json is found', async (assert) => {
    fs.cd('foo/bar')
    try {
      fs.cdProjectRootDir()
    } catch (error) {
      assert.equal(error.message, 'This project is not a SmoothJS project. No package.json found.')
    }
  })
})

test.group('FileSystem | exists', (group) => {
  let fs: FileSystem

  group.beforeEach(() => {
    fs = new FileSystem()
    fs.setTesting()
  })

  group.beforeEach(() => {
    mkdirSync('test-generators')
    mkdirSync('test-generators/dd')
    writeFileSync('test-generators/dd/foo.txt', Buffer.alloc(3))
  })

  group.afterEach(() => {
    unlinkSync('test-generators/dd/foo.txt')
    rmdirSync('test-generators/dd')
    rmdirSync('test-generators')
  })

  test('return true if the file or directory exists', async (assert) => {
    assert.isTrue(fs.exists('foo.txt'))
  })

  test('return false if the file or directory does not exist', async (assert) => {
    assert.isFalse(fs.exists('bar.txt'))
  })
})

test.group('FileSystem | ensureDir', (group) => {
  let fs: FileSystem

  group.beforeEach(() => {
    fs = new FileSystem()
    fs.setTesting()
  })

  group.beforeEach(() => {
    mkdirSync('test-generators')
    mkdirSync('test-generators/dd')
  })

  group.afterEach(() => {
    rmdirSync('test-generators/dd')
    rmdirSync('test-generators')
  })

  test('create the directory if it does not exist', async (assert) => {
    fs.ensureDir('bar')

    assert.isTrue(existsSync('test-generators/dd/bar'))

    rmdirSync('test-generators/dd/bar')
  })

  test('create all intermediate directories', async (assert) => {
    fs.ensureDir('bar/js/smooth')

    assert.isTrue(existsSync('test-generators/dd/bar/js/smooth'))

    rmdirSync('test-generators/dd/bar/js/smooth')
    rmdirSync('test-generators/dd/bar/js')
    rmdirSync('test-generators/dd/bar')
  })
})

test.group('FileSystem | ensureDirOnlyIf', (group) => {
  let fs: FileSystem

  group.beforeEach(() => {
    fs = new FileSystem()
    fs.setTesting()
  })

  group.beforeEach(() => {
    mkdirSync('test-generators')
    mkdirSync('test-generators/dd')
  })

  group.afterEach(() => {
    rmdirSync('test-generators/dd')
    rmdirSync('test-generators')
  })

  test('create the directory if the condition is true', async (assert) => {
    fs.ensureDirOnlyIf(true, 'foo')

    assert.isTrue(existsSync('test-generators/dd/foo'))

    rmdirSync('test-generators/dd/foo')
  })

  test('create the directory if the condition is false', async (assert) => {
    fs.ensureDirOnlyIf(false, 'foo')

    assert.isFalse(existsSync('test-generators/dd/foo'))
  })
})

test.group('FileSystem | ensureFile', (group) => {
  let fs: FileSystem

  group.beforeEach(() => {
    fs = new FileSystem()
    fs.setTesting()
  })

  group.beforeEach(() => {
    mkdirSync('test-generators')
    mkdirSync('test-generators/dd')
    writeFileSync('test-generators/dd/foo.txt', 'hello', 'utf8')
  })

  group.afterEach(() => {
    if (existsSync('test-generators/dd/bar.txt')) {
      unlinkSync('test-generators/dd/bar.txt')
    }

    unlinkSync('test-generators/dd/foo.txt')
    rmdirSync('test-generators/dd')
    rmdirSync('test-generators')
  })

  test('create the file if it does not exist', async (assert) => {
    fs.ensureFile('bar.txt')

    assert.isTrue(existsSync('test-generators/dd/bar.txt'))
  })

  test(`don't erase the file if it exists`, async (assert) => {
    fs.ensureFile('foo.txt')

    assert.equal(readFileSync('test-generators/dd/foo.txt', 'utf8'), 'hello')
  })
})

test.group('FileSystem | copy', (group) => {
  let fs: FileSystem

  group.beforeEach(() => {
    fs = new FileSystem()
    fs.setTesting()
  })

  const templatePath = join(__dirname, '..', 'src/templates/tpl.txt')

  group.beforeEach(() => {
    mkdirSync('test-generators')
    mkdirSync('test-generators/dd')
    writeFileSync(templatePath, 'hello', 'utf8')
  })

  group.afterEach(() => {
    unlinkSync(templatePath)

    if (existsSync('test-generators/dd/hello.txt')) {
      unlinkSync('test-generators/dd/hello.txt')
    }

    rmdirSync('test-generators/dd')
    rmdirSync('test-generators')
  })

  test('copy the file from the `templates` directory', async (assert) => {
    fs.copy('tpl.txt', 'hello.txt')

    assert.equal(readFileSync('test-generators/dd/hello.txt', 'utf8'), 'hello')
  })

  test('throw an error if the template does not exist', async (assert) => {
    try {
      fs.copy('foobar.txt', 'hello.txt')
    } catch (error) {
      assert.equal(error.message, 'The template "foobar.txt" does not exist.')
    }
  })
})

test.group('FileSystem | copyOnlyIf', (group) => {
  let fs: FileSystem

  group.beforeEach(() => {
    fs = new FileSystem()
    fs.setTesting()
  })

  const templatePath = join(__dirname, '..', 'src/templates/tpl.txt')

  group.beforeEach(() => {
    mkdirSync('test-generators')
    mkdirSync('test-generators/dd')
    writeFileSync(templatePath, 'hello', 'utf8')
  })

  group.afterEach(() => {
    unlinkSync(templatePath)

    if (existsSync('test-generators/dd/hello.txt')) {
      unlinkSync('test-generators/dd/hello.txt')
    }

    rmdirSync('test-generators/dd')
    rmdirSync('test-generators')
  })

  test('copy the file from the `templates` directory', async (assert) => {
    fs.copyOnlyIf(true, 'tpl.txt', 'hello.txt')

    assert.isTrue(existsSync('test-generators/dd/hello.txt'))
  })

  test('copy the file from the `templates` directory', async (assert) => {
    fs.copyOnlyIf(false, 'tpl.txt', 'hello.txt')

    assert.isFalse(existsSync('test-generators/dd/hello.txt'))
  })
})

test.group('FileSystem | render', (group) => {
  let fs: FileSystem

  group.beforeEach(() => {
    fs = new FileSystem()
    fs.setTesting()
  })

  const templatePath = join(__dirname, '..', 'src/templates/tpl.txt')

  group.beforeEach(() => {
    mkdirSync('test-generators')
    mkdirSync('test-generators/dd')
    writeFileSync(templatePath, '/* foobar */ /* foobar */ /* barfoo */!', 'utf8')
  })

  group.afterEach(() => {
    unlinkSync(templatePath)

    if (existsSync('test-generators/dd/hello.txt')) {
      unlinkSync('test-generators/dd/hello.txt')
    }

    rmdirSync('test-generators/dd')
    rmdirSync('test-generators')
  })

  test('copy and render the template from the `templates` directory', async (assert) => {
    fs.render('tpl.txt', 'hello.txt', {
      barfoo: 'world',
      foobar: 'hello',
    })

    assert.equal(readFileSync('test-generators/dd/hello.txt', 'utf8'), 'hello hello world!')
  })

  test('throw an error if the template does not exist', async (assert) => {
    try {
      fs.render('foobar.txt', 'hello.txt', {})
    } catch (error) {
      assert.equal(error.message, 'The template "foobar.txt" does not exist.')
    }
  })
})

test.group('FileSystem | renderOnlyIf', (group) => {
  let fs: FileSystem

  group.beforeEach(() => {
    fs = new FileSystem()
    fs.setTesting()
  })

  const templatePath = join(__dirname, '..', 'src/templates/tpl.txt')

  group.beforeEach(() => {
    mkdirSync('test-generators')
    mkdirSync('test-generators/dd')
    writeFileSync(templatePath, 'hello', 'utf8')
  })

  group.afterEach(() => {
    unlinkSync(templatePath)

    if (existsSync('test-generators/dd/hello.txt')) {
      unlinkSync('test-generators/dd/hello.txt')
    }

    rmdirSync('test-generators/dd')
    rmdirSync('test-generators')
  })

  test('copy and render the file from the `templates` directory', async (assert) => {
    fs.renderOnlyIf(true, 'tpl.txt', 'hello.txt', {})

    assert.isTrue(existsSync('test-generators/dd/hello.txt'))
  })

  test('copy and render the file from the `templates` directory', async (assert) => {
    fs.renderOnlyIf(false, 'tpl.txt', 'hello.txt', {})

    assert.isFalse(existsSync('test-generators/dd/hello.txt'))
  })
})

test.group('FileSystem | modify', (group) => {
  let fs: FileSystem

  group.beforeEach(() => {
    fs = new FileSystem()
    fs.setTesting()
  })

  group.beforeEach(() => {
    mkdirSync('test-generators')
    mkdirSync('test-generators/dd')
    writeFileSync('test-generators/dd/hello.txt', 'hello', 'utf8')
  })

  group.afterEach(() => {
    unlinkSync('test-generators/dd/hello.txt')
    rmdirSync('test-generators/dd')
    rmdirSync('test-generators')
  })

  test('modify the file with the given callback', async (assert) => {
    fs.modify('hello.txt', (content) => content + ' world!')

    assert.equal(readFileSync('test-generators/dd/hello.txt', 'utf8'), 'hello world!')
  })

  test('throw a ClientError if the file does not exist', async (assert) => {
    try {
      fs.modify('test-file-system/foobar.txt', (content) => content)
      throw new Error('An error should have been thrown')
    } catch (error) {
      assert.equal(
        error.message,
        'Impossible to modify "test-file-system/foobar.txt": the file does not exist.'
      )
    }
  })
})

test.group('FileSystem | modifyOnlyIf', (group) => {
  let fs: FileSystem

  group.beforeEach(() => {
    fs = new FileSystem()
    fs.setTesting()
  })

  group.beforeEach(() => {
    mkdirSync('test-generators')
    mkdirSync('test-generators/dd')
    writeFileSync('test-generators/dd/hello.txt', 'hello', 'utf8')
  })

  group.afterEach(() => {
    unlinkSync('test-generators/dd/hello.txt')
    rmdirSync('test-generators/dd')
    rmdirSync('test-generators')
  })

  test('modify the file with the given callback if the condition is true', async (assert) => {
    fs.modifyOnlyfIf(true, 'hello.txt', (content) => content + ' world!')
    assert.equal(readFileSync('test-generators/dd/hello.txt', 'utf8'), 'hello world!')
  })

  test(`don't modify the file with the given callback if the condition is false`, async (assert) => {
    fs.modifyOnlyfIf(false, 'hello.txt', (content) => content + ' world!')
    assert.equal(readFileSync('test-generators/dd/hello.txt', 'utf8'), 'hello')
  })
})

test.group('FileSystem | projectHasDependency', (group) => {
  let initialPkg: Buffer
  let fs: FileSystem

  group.beforeEach(() => {
    fs = new FileSystem()
    fs.setTesting()
  })

  group.beforeEach(() => {
    mkdirSync('test-generators')
    mkdirSync('test-generators/dd')
    initialPkg = readFileSync('package.json')
    writeFileSync(
      'package.json',
      JSON.stringify({
        dependencies: {
          '@smoothjs/smooth': '0.2.1',
          'bar': 'world',
        },
      }),
      'utf8'
    )
  })

  group.afterEach(() => {
    writeFileSync('package.json', initialPkg)
    rmdirSync('test-generators/dd')
    rmdirSync('test-generators')
  })

  test('return true if the project has the dependency in its package.json', async (assert) => {
    assert.isTrue(fs.projectHasDependency('bar'))
  })

  test('return false if the project does not have the dependency in its package.json', async (assert) => {
    assert.isFalse(fs.projectHasDependency('foo'))
  })

  test(`don't change the current working directory`, async (assert) => {
    fs.projectHasDependency('commander')

    assert.equal(fs.currentDir, '')
  })
})
