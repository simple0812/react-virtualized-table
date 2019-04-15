/**
 * @author 黄东海
 * @description 移动端组件库配置文件
 * date 17.12.18
 */

//  引入库
const webpack = require('webpack');
const path = require('path');
const merge = require('webpack-merge');
const webpackBaseConfig = require('./webpack.config.base');
const CompressionPlugin = require('compression-webpack-plugin');

// 确定生产环境
process.env.NODE_ENV = 'production';

module.exports = merge(webpackBaseConfig, {
  entry: {
    main: path.resolve(__dirname, '../src/pack/index.js'),
  },
  output: {
    path: path.resolve(__dirname, '../lib'),
    publicPath: '/lib/',
    filename: 'pack.js',
    library: 'pack',
    libraryTarget: 'umd',
    umdNamedDefine: true,
  },
  externals: {
    react: {
      root: 'React',
      commonjs2: 'react',
      commonjs: 'react',
      amd: 'react',
    },
    'react-dom': {
      root: 'ReactDOM',
      commonjs2: 'react-dom',
      commonjs: 'react-dom',
      amd: 'react-dom',
    },
    moment: {
      root: 'moment',
      commonjs2: 'moment',
      commonjs: 'moment',
      amd: 'moment',
    },
    antd: {
      root: 'antd',
      commonjs2: 'antd',
      commonjs: 'antd',
      amd: 'antd',
    },
    axios: {
      root: 'axios',
      commonjs2: 'axios',
      commonjs: 'axios',
      amd: 'axios',
    },
    lodash: {
      root: 'lodash',
      commonjs2: 'lodash',
      commonjs: 'lodash',
      amd: 'lodash',
    },
    'highcharts/highmaps': {
      root: 'Highcharts',
      commonjs2: 'highcharts/highmaps',
      commonjs: 'highcharts/highmaps',
      amd: 'highcharts/highmaps',
    },
    'highcharts/highstock': {
      root: 'Highcharts',
      commonjs2: 'highcharts/highstock',
      commonjs: 'highcharts/highstock',
      amd: 'highcharts/highstock',
    },
    highcharts: {
      root: 'Highcharts',
      commonjs2: 'highcharts',
      commonjs: 'highcharts',
      amd: 'highcharts',
    },
    numeral: {
      root: 'numeral',
      commonjs2: 'numeral',
      commonjs: 'numeral',
      amd: 'numeral',
    },
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"',
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
        comparisons: false,
      },
      mangle: {
        safari10: true,
      },
      output: {
        comments: false,
        ascii_only: true,
      },
    }),
    new CompressionPlugin({
      asset: '[path].gz[query]',
      algorithm: 'gzip',
      test: /\.(js|css)$/,
      threshold: 10240,
      minRatio: 0.8,
    }),
  ],
});
