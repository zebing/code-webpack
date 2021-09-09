const path = require('path');
const MyPlugin = require('./plugins/MyPlugin');

module.exports = {
  entry: path.resolve('./src/index.js'),
  output: path.resolve('./dist/bundle.js'),
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ['babel-loader']
      }
    ]
  },
  plugins: [
    new MyPlugin()
  ]
}