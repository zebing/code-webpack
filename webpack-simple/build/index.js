const Webpack = require('./webpack');

const compiler = new Webpack({
  entry: './src/index.js',
  output: './dist/index.js'
});
compiler.run();
