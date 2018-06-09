module.exports = {
    env: {
        es6: true,
        node: true,
    },
    extends: "eslint:recommended",
    parserOptions: {
        ecmaFeatures: {
            experimentalObjectRestSpread: true,
        },
        sourceType: "module",
    },
    rules: {
        indent: [
            "error",
            "tab",
        ],
        "linebreak-style": [
            "error",
            "unix",
        ],
        "no-console": "off",
        "no-var": "error",
        quotes: [
            "error",
            "single",
        ],
        semi: [
            "error",
            "never",
        ],
    },
};
