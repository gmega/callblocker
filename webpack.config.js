const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {

    context: __dirname,

    entry: './frontend/src/index.jsx',
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
        host: '0.0.0.0'
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
};