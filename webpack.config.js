const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const FlowWebpackPlugin = require('flow-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const webpack = require('webpack');

const baseConfig = (env) => ({
  context: __dirname,

  entry: './frontend/src/index.jsx',
  mode: 'development',
  devtool: 'eval-source-map',
  output: {
    path: path.resolve('./frontend/dist'),
    filename: 'index_bundle.js'
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Callblocker',
      template: './frontend/public/index.html'
    }),
    // Ugh, moment.js locales are enormous!
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
  ],
  devServer: {
    contentBase: './frontend/dist',
    historyApiFallback: true,
    host: '0.0.0.0',
    proxy: {
      '/api': 'http://0.0.0.0:8000'
    }
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      },
      {
        test: /\.css$/,
        exclude: /node_modules/,
        use: [
          'style-loader',
          'css-loader'
        ]
      }
    ]
  }
});

const IDENTITY = (base) => base

const OPTIONS = {
  // Uses different source maps in production.
  prod: {
    set: 'PRODUCTION',
    unset: 'DEVELOPMENT',
    apply_set: (base) => ({
      ...base,
      mode: 'production',
      devtool: 'source-map'
    }),
    apply_unset: IDENTITY
  },
  // Disables flow when building in the Raspberry Pi.
  rpi: {
    set: 'Raspberry Pi',
    unset: 'Web',
    apply_set: IDENTITY,
    apply_unset: (base) => ({
      ...base,
      plugins: base.plugins.concat(new FlowWebpackPlugin())
    })
  },
  // Disables bundle size analysis unless requested.
  sizes: {
    set: 'with Bundle Size Analysis',
    unset: 'without Bundle Size Analysis',
    apply_set: (base) => ({
      ...base,
      plugins: base.plugins.concat(new BundleAnalyzerPlugin())
    }),
    apply_unset: IDENTITY
  }
};

function formatOpts(env) {
  return (
    Object.entries(OPTIONS)
      .map(([option, settings]) => env[option] ? settings.set : settings.unset)
      .join(', ')
  )
}

const applyConfig = (env) => Object
  .entries(OPTIONS)
  .reduce((config, [option, setting]) => {
      return env[option] ? setting.apply_set(config) : setting.apply_unset(config)
    },
    baseConfig(env)
  );

module.exports = function (env = {}, argv) {
  console.log(`Running a <<${formatOpts(env)}>> build.`);
  return applyConfig(env);;
};