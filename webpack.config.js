const webpack = require('webpack');
const path = require('path');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

const paths = {
    src: path.join(__dirname, 'src'),
    dist: path.join(__dirname, 'dist')
};

module.exports = (env, argv) => ({
    context: paths.src,

    entry: path.join(paths.src, 'scripts/main.js'),

    output: {
        path: paths.dist,
        filename: 'assets/scripts/main.js',
    },

    devServer: {
        contentBase: paths.dist,
        port: 3000
    },

    devtool: 'source-map',

    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                    }
                }
            },
            {
                test: /\.sass$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'postcss-loader',
                    'sass-loader',
                ]
            },
            {
                test: /\.pug$/,
                use: {
                    loader: 'pug-loader'
                }
            },
            {
                test: /\.(png|jpg|svg)$/,
                use: [
                    {
                        loader: 'file-loader',
                        query: {
                            name: '[name].[ext]',
                            outputPath: 'assets/images/'
                        }
                    },
                    {
                        loader: 'image-webpack-loader',
                        options: {
                            mozjpeg: {
                                progressive: true,
                            },
                            gifsicle: {
                                interlaced: false,
                            },
                            optipng: {
                                optimizationLevel: argv.mode === 'production' ? 7 : 1,
                            },
                            pngquant: {
                                quality: '75-90',
                                speed: 3,
                            },
                            svgo:{
                                plugins: [
                                    {
                                        removeViewBox: false
                                    },
                                    {
                                        removeEmptyAttrs: true
                                    }
                                ]
                            }

                        },
                    }
                ]
            },
            {
                test: /\.(eot|otf|ttf|woff2?)$/,
                use: {
                    loader: 'file-loader',
                    options: {
                        name: '[name].[ext]',
                        outputPath: 'assets/fonts/'
                    }
                }

            }
        ]
    },

    optimization: {
        minimizer: argv.mode === 'production' ? [
            new UglifyJSPlugin({
                cache: true,
                parallel: true,
                uglifyOptions: {
                    compress: {
                        drop_console: true
                    },
                    output: {
                        comments: /^\**!|@preserve|@license|@cc_on/
                    },
                }
            }),
            new OptimizeCSSAssetsPlugin({}),
        ] : []
    },

    plugins: [
        new BrowserSyncPlugin({
            server: {
                baseDir: paths.dist
            }
        }),
        new HtmlWebpackPlugin({
            title: 'boilerplate',
            template: 'templates/index.pug'
        }),
        new MiniCssExtractPlugin({
            filename: "assets/styles/style.css"
        }),
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery'
        }),
        new webpack.DefinePlugin({
            config: JSON.stringify(require('./config.json'))
        })
    ]
});
