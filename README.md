licensee.js
===========

[![npm version](https://img.shields.io/npm/v/licensee.svg)](https://www.npmjs.com/package/licensee)
[![license](https://img.shields.io/badge/license-Apache--2.0-303284.svg)](http://www.apache.org/licenses/LICENSE-2.0)
[![build status](https://img.shields.io/travis/jslicense/licensee.js.svg)](http://travis-ci.org/jslicense/licensee.js)

Check npm package licenses against a set of rules.

At the command line:

```bash
npm --global install licensee
cd /your/package/path
licensee
```

With Node.js:

```js
var licensee = require('licensee');
var path = '/your/package/path';
var configuration = {
  link: '(MIT OR ISC OR Apache-2.0)'
};
licensee(path, configuration, function(error, problems) {
  console.error(problems);
});
```

`licensee` checks `license` properties in `package.json` metadata. Licensing of packages with `private: true` is ignored.
