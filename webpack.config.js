var webpack = require('webpack');
const path = require('path');

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
        ],
    },
    mode: 'development',
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
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    plugins: [require('tailwindcss'), require('autoprefixer'), definePlugin],
};