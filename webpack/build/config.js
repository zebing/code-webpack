const path = require('path');
const MyPlugin = require('./plugins/MyPlugin');

module.exports = {
  entry: {
    index: path.resolve('./src/index.js'),
    test: path.resolve('./src/test/index.js'),
  },
  output: {
    path: path.resolve('./dist'),
    file: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ['babel-loader']
      },
      {
        test: /\.vue$/,
        use: ['vue-loader']
      },
      {
        test: /\.css$/,
        use: [
          'style-loader', 
          {
            loader: "css-loader",
            options: { 
                  modules: true,
                  //other options
            }
          }, 
          'postcss-loader'
        ]
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 
          {
            ident: "clonedRuleSet-3.use[1]",
            loader: "css-loader",
            options: { 
                  modules: true,
                  //other options
            }
          }, 
          'postcss-loader', 
          'sass-loader'
        ]
      },
    ]
  },
  plugins: [
    new MyPlugin()
  ]
}