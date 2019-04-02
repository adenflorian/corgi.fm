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
    "plugins": [
        "react-hooks"
    ],
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
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn"
    },
};
