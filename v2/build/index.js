const path = require('path');
const Webpack = require(path.resolve('./webpack'));
const config = require('./config');

const compiler = new Webpack(config);
compiler.run();