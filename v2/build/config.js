const path = require('path');

module.exports = {
  entry: path.resolve('./src/index.js'),
  output: path.resolve('./dist/bundle.js'),
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ['babel-lodaer']
      }
    ]
  }
}