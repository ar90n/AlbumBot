const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  context: `${__dirname}/src`,
  entry: {
    typescript: './index.tsx',
  },

  output: {
    path: `${__dirname}/dist`,
    publicPath: 'http://localhost:3000/',
    filename: 'bundle.js',
  },

  // Configuration for dev server
  devServer: {
    contentBase: 'dist',
    port: 3000,
  },

  devtool: 'eval',
  plugins: [
    new CopyWebpackPlugin([{ from: './index.html', to: '../dist/index.html' }]),
    new webpack.DefinePlugin({
      'process.env.API_HOST': JSON.stringify(process.env.API_HOST || 'api.album-bot.ar90n.net'),
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
  ],
  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.json'],
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader',
      },
      {
        test: /\.json$/,
        loaders: ['json-loader'],
      },
      {
        test: /\.html$/,
        loader: 'file-loader?name=[path][name].[ext]',
      },
      {
        test: /\.tsx?$/,
        loaders: ['react-hot-loader/webpack', 'ts-loader'],
        include: path.join(__dirname, 'src'),
      },
    ],
  },
};
