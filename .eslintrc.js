module.exports = {
      "ecmaVersion": 6,
      "extends": "standard",
      "installedESLint": true,
      "plugins": [
        "standard"
      ],
      "env": {
        "node": true,
        "browser": true
      },
      "rules": {
        "comma-style": [
          "error"
          , "first"
        ]
        , "one-var": ["error", {
          "var": "always",
          "let": "always",
          "const": "always"
        }]
        , "space-before-function-paren": ["error",
          {"anonymous": "always", "named": "never"}]
      }
};