

module.exports = [
    { ignores: ["node_modules/**"] },
    {
        files: ["**/*.js"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                window: "readonly",
                document: "readonly",
                navigator: "readonly",
                module: "readonly",
                process: "readonly",
                console: "readonly",
            },
        },
        rules: {
            indent: [
                "error",
                2,
                { SwitchCase: 1 }
            ],
            quotes: [
                "error",
                "single"
            ],
            semi: [
                "error",
                "always"
            ],
            "comma-dangle": [
                "error",
                {
                    arrays: "never",
                    objects: "always-multiline",
                    imports: "never",
                    exports: "never",
                    functions: "never",
                }
            ],
            "eol-last": [
                "error",
                "always"
            ],
            "no-multiple-empty-lines": [
                "error",
                {
                    max: 2,
                    maxEOF: 0,
                }
            ],
            "padding-line-between-statements": [
                "error",
                {
                    blankLine: "always",
                    prev: "var",
                    next: "return",
                }
            ],
            camelcase: [
                "error",
                {
                    properties: "always",
                }
            ],
            "space-infix-ops": "error",
            "arrow-spacing": "error",
        },
    },
];
