/**
 * @author 黄东海
 * @description 组件库基础配置
 * date 17.12.09
 */

//  引入库
const webpack = require('webpack');
const path = require('path');
const package = require('../package.json');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;
const autoprefixer = require('autoprefixer');

// 确定Css导出路径
const cssFilename = '/css/main.css';
const shouldUseRelativeAssetPaths = './';
const extractTextPluginOptions = shouldUseRelativeAssetPaths
  ? { publicPath: Array(cssFilename.split('/').length).join('../') }
  : {};

/**
 * 输出路径
 * @param {String} dir 路径
 */
function resolve (dir) {
  return path.join(__dirname, '..', dir);
}

module.exports = {
  // loader
  module: {
    rules: [
      {
        test: /\.(js|jsx|mjs)$/,
        include: resolve('src'),
        loader: require.resolve('babel-loader'),
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract(
          Object.assign(
            {
              fallback: {
                loader: require.resolve('style-loader'),
                options: {
                  hmr: false,
                },
              },
              use: [
                {
                  loader: require.resolve('css-loader'),
                  options: {
                    importLoaders: 1,
                    minimize: true,
                  },
                },
                {
                  loader: require.resolve('postcss-loader'),
                  options: {
                    ident: 'postcss',
                    plugins: () => [
                      require('postcss-flexbugs-fixes'),
                      autoprefixer({
                        browsers: [
                          '>1%',
                          'last 4 versions',
                          'Firefox ESR',
                          'not ie < 9',
                        ],
                        flexbox: 'no-2009',
                      }),
                    ],
                  },
                },
              ],
            },
            extractTextPluginOptions
          )
        ),
      },
      {
        test: /\.less$/,
        loader: ExtractTextPlugin.extract(
          {
            fallback: {
              loader: require.resolve('style-loader'),
              options: {
                hmr: false,
              },
            },
            use: [
              {
                loader: require.resolve('postcss-loader'),
                options: {
                  ident: 'postcss',
                  plugins: () => [
                    require('postcss-flexbugs-fixes'),
                    autoprefixer({
                      browsers: [
                        '>1%',
                        'last 4 versions',
                        'Firefox ESR',
                        'not ie < 9',
                      ],
                      flexbox: 'no-2009',
                    }),
                  ],
                },
              },
              {
                loader: 'css-loader',
                options: {
                  sourceMap: true,
                },
              },
              {
                loader: 'less-loader',
                options: {
                  sourceMap: true,
                },
              },
            ],
          },
          extractTextPluginOptions
        ),
      },
      {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract(
          {
            fallback: {
              loader: require.resolve('style-loader'),
              options: {
                hmr: false,
              },
            },
            use: [
              {
                loader: 'css-loader',
                options: {
                  sourceMap: true,
                },
              },
              {
                loader: 'sass-loader',
                options: {
                  sourceMap: true,
                },
              },
            ],
          },
          extractTextPluginOptions
        ),
      },
      {
        test: /\.(gif|jpg|png|woff|svg|eot|ttf)\??.*$/,
        loader: 'url-loader?limit=8192',
      },
      { test: /\.(html|tpl)$/, loader: 'html-loader' },
    ],
  },
  // 忽略扩展名
  resolve: {
    extensions: ['.web.js', '.mjs', '.js', '.json', '.web.jsx', '.jsx'],
  },
  // 插件
  plugins: [
    // new BundleAnalyzerPlugin(),
    new webpack.optimize.ModuleConcatenationPlugin(),
    new webpack.DefinePlugin({
      'process.env.VERSION': `'${package.version}'`,
    }),
    new ExtractTextPlugin({
      filename: cssFilename,
      disable: false,
      allChunks: true,
    }),
  ],
};
