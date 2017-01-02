const nodeExternals = require('webpack-node-externals');
const Dotenv = require('dotenv-webpack');

module.exports = {
  entry: './src/handler.js',
  target: 'node',
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel'
      },
      {
        test: /\.css$/,
        loader: 'style!css?modules',
        include: /flexboxgrid/,
      }
    ]
  },
  externals:[
      nodeExternals(),
      {
          'aws-ask': true,
          'imagemagick': true
      }
  ],
  plugins: [
    new Dotenv({ path: './.env', safe: false })
  ]
}
