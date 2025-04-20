const path = require('path');
const SpinSdkPlugin = require("@fermyon/spin-sdk/plugins/webpack")
const WasiExtPlugin = require("@fermyon/wasi-ext/plugin")

module.exports = {
    entry: './src/index.ts',
    mode: 'production',
    stats: 'errors-only',
    experiments: {
        outputModule: true,
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        path: path.resolve(__dirname, './build'),
        filename: 'bundle.js',
        module: true,
        library: {
            type: "module",
        }
    },
    plugins: [
        new WasiExtPlugin(),
        new SpinSdkPlugin()
    ],
    optimization: {
        minimize: false
    },
    performance: {
        hints: false,
    }
};
