const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const ServiceWorkerWebpackPlugin = require('serviceworker-webpack-plugin');
const cssnano = require('cssnano');
const Dotenv = require('dotenv-webpack');

module.exports = {
    entry: path.join(__dirname, '/src/index.js'),
    mode: 'development',
    output: {
        filename: 'bundle.[hash].js', // filename就是对应于entry里面生成出来的文件名
        path: path.join(__dirname, '/dist'), // 会自动打包成一个bundle.js文件 并在index.html里面引用
        publicPath: '/', // 用于cdn
        chunkFilename: 'js/[name].[chunkhash].js', // chunkname我的理解是未被列在entry中，却又需要被打包出来的文件命名配置  (在按需加载（异步）模块的时候用到)
    },
    module: {
        rules: [
            {
                test: /\.js|jsx$/,
                exclude: /node_modules/,
                use: ['babel-loader'],
            },
            {
                test: /\.css$/,
                use: [{
                    // loader : 模块转换器，用于把模块原内容按照需求转换成新内容
                    loader: MiniCssExtractPlugin.loader,
                    options: {
                        publicPath: '/dist',
                    },
                }, 'css-loader'], // use的顺序从右往左
            },
            {
                test: /\.(png|svg|jpg|gif|mp3)$/,
                use: [{
                    loader: 'url-loader',
                    options: {
                        // 具体配置见插件官网
                        limit: 15000, // 表示低于15000字节（15KB）的图片会以 base64编码, 大于则不打包,将图片拷贝到 dist 目录
                        name: '[name]-[hash:5].[ext]', // 输出的文件名称, 其中【ext】占位符是 表示文件的后缀名的
                        outputPath: 'img/', // outputPath所设置的路径，是相对于 webpack 的输出目录。
                        publicPath: 'img/', // publicPath 选项则被许多webpack的插件用于在生产模式下更新内嵌到css、html文件内的 url , 如CDN地址
                    },
                },
                {
                    loader: 'image-webpack-loader',
                    options: {
                        mozjpeg: {
                            progressive: true,
                            quality: 65,
                        },
                        // optipng.enabled: false will disable optipng
                        optipng: {
                            enabled: false,
                        },
                        pngquant: {
                            quality: [0.65, 0.90],
                            speed: 4,
                        },
                        gifsicle: {
                            interlaced: false,
                        },
                        // the webp option will enable WEBP, bug here!!!
                        // webp: {
                        //     quality: 70
                        // }
                    },
                }],
            },
            {
                // 字体
                test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
                loader: 'url-loader',
                options: {
                    // 文件大小小于limit参数，url-loader将会把文件转为DataUR
                    limit: 10000,
                    name: '[name]-[hash:5].[ext]',
                    output: 'fonts/',
                    // publicPath: '', 多用于CDN
                },
            },
        ],
    },
    // plugins : 扩展插件，在webpack构建流程中的特定时机注入扩展逻辑来改变构建结果或做你想要做的事情
    plugins: [
        // 打包html文件
        new HtmlWebpackPlugin({
            template: path.join(__dirname, './public/index.html'),
            favicon: './public/favicon.ico',
            minify: {
                removeComments: true, // 移除注释
                collapseWhitespace: true,
                removeRedundantAttributes: true,
                useShortDoctype: true,
                removeEmptyAttributes: true,
                removeStyleLinkTypeAttributes: true,
                keepClosingSlash: true,
                minifyJS: true, // 压缩文内js
                minifyCSS: true, // 压缩文内css
                minifyURLs: true,
            },
            chunksSortMode: 'dependency',
        }),
        new CleanWebpackPlugin(), // 每次打包前清空dist目录
        // 打包导出 CSS 到独立文件 main.css
        new MiniCssExtractPlugin({
            filename: 'css/[name].css',
            chunkFilename: 'css/[name].[chunkhash].css',
        }),
        // 压缩 CSS  即丑化代码
        new OptimizeCssAssetsPlugin({
            assetNameRegExp: /\.css$/g,
            cssProcessor: cssnano, // 引入cssnano配置压缩选项
        }),
        new ServiceWorkerWebpackPlugin({
            entry: path.join(__dirname, '/src/serviceworker/sw.js'),
            // 自定义的sw.js文件所在路径, ServiceWorkerWebpackPlugin 会把要cache的文件列表(其实即使dist目录所有文件)
            // 注入到生成的dist目录下的 sw.js 中
            // 这样子frontend/src/serviceworker/registerServiceWorker.js中的sw.js就会指向dist目录下的sw.js文件
            excludes: ['**/.*', '**/*.map', '*.html'],
        }),
        // 针对manifest.json 文件
        new ManifestPlugin(),
        // 环境变量
        new Dotenv({
            path: `./.env.${process.env.NODE_ENV === 'production' ? 'production' : 'development'}`,
        }),
    ],
    optimization: {
        minimize: true, // production 模式下，这里默认是 true
        minimizer: [
            // 压缩JS
            new TerserPlugin({
                cache: true,
                parallel: true,
                sourceMap: true,
            }),
        ],
    },
    // 下面这段代码 只用于本地开发时候，当放进docker容器之后 proxy的配置是从根目录下的nginx.conf读取出来的
    devServer: { // 本地开发环境（webpack-dev-server）对应于frontend/package.json  start命令行
        // contentBase: path.join(__dirname, '/dist'),
        historyApiFallback: true,
        compress: true,
        port: 8080, // Project is running at http://localhost:8080/   控制浏览器url的端口
        proxy: {
            '/v1/**': {
                target: 'http://localhost:4000/', // http://localhost:8080/v1/...会被代理到请求 http://localhost:4000/v1/...  不行改成google.com试下
            },
        },
    },
};
