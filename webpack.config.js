const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const FlowWebpackPlugin = require('flow-webpack-plugin');

const OPTIONS = {
  prod: ['PRODUCTION', 'DEVELOPMENT'],
  rpi: ['Raspberry Pi', 'Web']
};

const baseConfig = (env) => ({
  context: __dirname,

  entry: './frontend/src/index.jsx',
  mode: env.prod ? 'production' : 'development',
  devtool: env.prod ? 'source-maps' : '#eval-source-map',
  output: {
    path: path.resolve('./frontend/dist'),
    filename: 'index_bundle.js'
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Callblocker',
      template: './frontend/public/index.html'
    })
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

const webConfig = (env) => ({
  ...baseConfig(env),
  plugins: baseConfig(env).plugins.concat(new FlowWebpackPlugin())
});

// Flow does not work on the Raspberry Pi, so we disable it. It's not necessary anyways as
// the CI server will be the one handling flow checks and tests.
const rpi4Config = (env) => ({
  ...baseConfig(env)
});

function formatOpts(config) {
  return (
    Object.entries(OPTIONS)
      .map(([option, settings]) => config[option] ? settings[0] : settings[1])
      .join(', ')
  )
}

module.exports = function(env={}, argv) {
  console.log(`Running a <<${formatOpts(env)}>> build.`);
  return (env.rpi ? rpi4Config : webConfig)(env);
};