var path = require('path');
var webpack = require('webpack');

module.exports = {
  context: __dirname + '/src',
  entry: {
      typescript: './index.tsx',
      html: './index.html'
  },

  output: {
      path: __dirname + '/dist',
      publicPath: 'http://localhost:3000/',
      filename: 'bundle.js'
  },

  // Configuration for dev server
  devServer: {
      contentBase: 'dist',
      port: 3000
  },

  devtool: 'eval',
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin()
  ],
  resolve: {
    extensions: ['', '.js', '.ts', '.tsx', '.json']
  },
  module: {
    loaders: [
      {
        test: /\.css$/,
        loader: "style!css"
      },
      {
        test: /\.json$/,
        loaders: ['json-loader']
      },
      {
          test: /\.html$/,
          loader: 'file?name=[path][name].[ext]'
      },
      {
        test: /\.tsx?$/,
        loaders: ['react-hot/webpack', 'ts-loader'],
        include: path.join(__dirname, 'src')
      }
    ]
  }
};
