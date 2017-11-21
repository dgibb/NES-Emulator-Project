const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './Client/app.js',
  output: { path: __dirname + '/Client', filename: 'app.min.js' },
  watch: true,

  module: {
    loaders: [
      {
        test: /.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['es2015', 'react'],
        },
      },
    ],
  },
};
