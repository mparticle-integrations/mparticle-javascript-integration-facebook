import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default [{
    input: 'src/FacebookEventForwarder.js',
    output: {
        file: 'FacebookEventForwarder.js',
        format: 'umd',
        exports: 'named',
        name: 'mp-facebookl-kit',
        strict: false
    },
    plugins: [
        resolve({
            browser: true
        }),
        commonjs()
    ]
},
{
    input: 'src/FacebookEventForwarder.js',
    output: {
        file: 'dist/FacebookEventForwarder.js',
        format: 'umd',
        exports: 'named',
        name: 'mp-facebookl-kit',
        strict: false
    },
    plugins: [
        resolve({
            browser: true
        }),
        commonjs()
    ]
}
] 