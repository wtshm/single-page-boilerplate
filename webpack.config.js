const webpack = require('webpack');
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const paths = {
    src: path.join(__dirname, 'src'),
    dist: path.join(__dirname, 'dist')
};

let config = {
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
                use: 'babel-loader'
            },
            {
                test: /\.sass$/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: [
                        'css-loader',
                        {
                            loader: 'postcss-loader',
                            options: {
                                plugins: () => {
                                    return [
                                        require('postcss-calc'),
                                        require('postcss-image-set-polyfill'),
                                        require('autoprefixer')({ browsers: 'last 2 versions' })
                                    ]
                                }
                            }
                        },
                        'sass-loader',
                    ],
                    publicPath: '../../'
                })
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
                                optimizationLevel: process.env.NODE_ENV === 'production' ? 7 : 1,
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

    plugins: [
        new ExtractTextPlugin('assets/styles/style.css'),
        new BrowserSyncPlugin({
            server: {
                baseDir: paths.dist
            }
        }),
        new HtmlWebpackPlugin({
            title: 'boilerplate',
            template: 'templates/index.pug'
        }),
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery'
        }),
        new webpack.DefinePlugin({
            config: JSON.stringify(require('./config.json'))
        })
    ]
};

if (process.env.NODE_ENV === 'production') {
    config.plugins.push(new UglifyJSPlugin());
    config.plugins.push(new webpack.optimize.AggressiveMergingPlugin());
}

module.exports = config;
