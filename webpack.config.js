var webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackInlineSourcePlugin = require("@effortlessmotion/html-webpack-inline-source-plugin");

const commitHash = require('child_process').execSync('git rev-parse --short HEAD').toString();

const definePlugin = new webpack.DefinePlugin({
    'process.env.VERSION': JSON.stringify(process.env.npm_package_version),
    'process.env.COMMIT': JSON.stringify(commitHash),
})

module.exports = {
    entry: './src/index.ts',
    target: 'web',
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.wasm$/,
                type: 'javascript/auto',
                use: {
                    loader: 'file-loader',
                }
            },
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader']
            },
        ],
    },
    experiments: {
        asyncWebAssembly: true
    },
    mode: 'production',
    devServer: {
        hot: true,
    },
    resolve: {
        extensions: ['.ts', '.js'],
        fallback: {
            fs: require.resolve("browserify-fs"), // or 'empty' if you prefer an empty module
            crypto: require.resolve('crypto-browserify'),
            stream: require.resolve('stream-browserify'),
            util: false,
            path: false,
        }
    },
    output: {
        publicPath: '/',
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    plugins: [
        require('tailwindcss'),
        require('autoprefixer'),
        definePlugin,
        new MiniCssExtractPlugin({
            filename: 'output.css'
        }),
        new HtmlWebpackPlugin({
            template: './public/index.html',
            inject: 'body', // Ensure scripts are injected at the end of the body
            inlineSource: '.(js|css)$' // Inline all JavaScript and CSS files
        }),
        new HtmlWebpackInlineSourcePlugin()
    ],

};