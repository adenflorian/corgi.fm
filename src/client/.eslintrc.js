module.exports = {
    "env": {
        "browser": true,
        "es6": true,
    },
    "extends": "eslint:recommended",
    "globals": {
        "io": true,
    },
    "parserOptions": {
        "sourceType": "module",
    },
    "rules": {
        "indent": [
            "error",
            "tab",
        ],
        "linebreak-style": [
            "error",
            "unix",
        ],
        "no-console": "off",
        "quotes": [
            "error",
            "single",
        ],
        "semi": [
            "error",
            "never",
        ],
    },
};
