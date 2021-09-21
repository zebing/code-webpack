class MyPlugin {
  apply (compiler) {
    compiler.hooks.initialize.tap('MyPlugin', () => {
      console.log('compiler 调用 initialize 钩子\n')
    })

    compiler.hooks.entryOption.tap('MyPlugin', () => {
      console.log('compiler 调用 entryOption 钩子\n')
    })

    compiler.hooks.afterPlugins.tap('MyPlugin', () => {
      console.log('compiler 调用 afterPlugins 钩子\n')
    })

    compiler.hooks.run.tap('MyPlugin', () => {
      console.log('compiler 调用 run 钩子\n')
    })

    compiler.hooks.compile.tap('MyPlugin', () => {
      console.log('compiler 调用 compile 钩子\n')
    })

    compiler.hooks.compilation.tap('MyPlugin', () => {
      console.log('compiler 调用 compilation 钩子\n')
    })

    compiler.hooks.make.tap('MyPlugin', (compilation) => {
      console.log('compiler 调用 make 钩子\n')

      compilation.hooks.addEntry.tap('MyPlugin', () => {
        console.log('compilation 调用 addEntry 钩子\n')
      })

      compilation.hooks.buildModule.tap('MyPlugin', () => {
        console.log('compilation 调用 buildModule 钩子\n')
      })

      compilation.hooks.succeedModule.tap('MyPlugin', () => {
        console.log('compilation 调用 succeedModule 钩子\n')
      })

      compilation.hooks.finishModules.tap('MyPlugin', () => {
        console.log('compilation 调用 finishModules 钩子\n')
      })
    })

    compiler.hooks.emit.tap('MyPlugin', () => {
      console.log('compiler 调用 emit 钩子\n')
    })
  }
}

module.exports = MyPlugin;