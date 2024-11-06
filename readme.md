# Panini

[![Build Status](https://travis-ci.org/foundation/panini.svg?branch=master)](https://travis-ci.org/foundation/panini) [![npm version](https://badge.fury.io/js/panini.svg)](https://badge.fury.io/js/panini) [![Dependency Status](https://david-dm.org/foundation/panini.svg)](https://david-dm.org/foundation/panini)

A super simple flat file generator for use with Gulp. It compiles a series of HTML **pages** using a common **layout**. These pages can also include HTML **partials**, external Handlebars **helpers**, or external **data** as JSON or YAML.

Panini isn't a full-fledged static site generator&mdash;rather, it solves the very specific problem of assembling flat files from common elements, using a templating language.

## Installation

```bash
npm install panini --save-dev
```

## Usage

Feed Panini a stream of HTML files, and get a delicious flattened site out the other end.

```js
var gulp = require('gulp');
var panini = require('panini');

gulp.task('default', function() {
  gulp.src('pages/**/*.html')
    .pipe(panini({
      root: 'pages/',
      layouts: 'layouts/',
      partials: 'partials/',
      helpers: 'helpers/',
      data: 'data/'
    }))
    .pipe(gulp.dest('build'));
});
```

Note that Panini loads layouts, partials, helpers, and data files once on first run. Whenever these files change, call `panini.refresh()` to get it up to date. You can easily do this inside a call to `gulp.watch()`:

```js
gulp.watch(['./src/{layouts,partials,helpers,data}/**/*'], [panini.refresh]);
```

## Options

### `root`

**Type:** `String`

Path to the root folder all pages live in. This option does not pull in the files themselves for processing&mdash;that's what `gulp.src()` is for. This setting tells Panini what the common root of your site's pages is.

### `layouts`

**Type:** `String`

Path to a folder containing layouts. Layout files can have the extension `.html`, `.hbs`, or `.handlebars`. One layout must be named `default`. To use a layout other than the default on a specific page, override it in the Front Matter on that page.

```html
---
layout: post
---

<!-- Uses layouts/post.html as the template -->
```

All layouts have a special Handlebars partial called `body` which contains the contents of the page.

```html
<!-- Header up here -->
{{> body}}
<!-- Footer down here -->
```

### `pageLayouts`

**Type:** `Object`

A list of presets for page layouts, grouped by folder. This allows you to automatically set all pages within a certain folder to have the same layout.

```js
panini({
  root: 'src/pages/',
  layouts: 'src/layouts/',
  pageLayouts: {
    // All pages inside src/pages/blog will use the blog.html layout
    'blog': 'blog'
  }
})
```

### `partials`

**Type:** `String`

Path to a folder containing HTML partials. Partial files can have the extension `.html`, `.hbs`, or `.handlebars`. Each will be registered as a Handlebars partial which can be accessed using the name of the file. (The path to the file doesn't matter&mdash;only the name of the file itself is used.)

```html
<!-- Renders partials/header.html -->
{{> header}}
```

### `inlinelayout`

**Type:** `String`

Inline partial name prefix, if not set - the default prefix will be `layout-`. Page Inline Partials to be used within layout pages.

```html
{{#*inline "layout-inline-partial-bot"}}
  <!-- Replace Header -->
{{/inline}}
{{#*inline "layout-inline-partial-top"}}
  <!-- Replace Footer -->
{{/inline}}
<!-- Body Content -->
```

The page inline partials with `inlinelayout` prefix can be used within the layouts.  If there is not a corresponding inline partial on the page, then the default content will be displayed.  Note: the default content can be made empty.

```html
{{#> layout-inline-partial-top}}
  <!-- Default Header up here -->
{{/layout-inline-partial-top}}
{{> body}}
{{#> layout-inline-partial-bot}}
  <!-- Footer down here -->
{{/layout-inline-partial-bot}}
```

To use an `inlinelayout` other than the default `layout-` prefix or `panini.options.inlinelayout` prefix on a specific page, override it in the Front Matter on that page.

```html
---
inlinelayout: alt-inlinelayout-
---
{{#*inline "alt-inlinelayout-inline-partial-bot"}}
  <!-- Replace Header -->
{{/inline}}
{{#*inline "alt-inlinelayout-inline-partial-top"}}
  <!-- Replace Footer -->
{{/inline}}
<!-- Body Content -->
```
layout
```html
{{#> alt-inlinelayout-inline-partial-top}}
  <!-- Default Header up here -->
{{/alt-inlinelayout-inline-partial-top}}
{{> body}}
{{#> alt-inlinelayout-inline-partial-bot}}
  <!-- Footer down here -->
{{/alt-inlinelayout-inline-partial-bot}}
```

### `helpers`

**Type:** `String`

Path to a folder containing Handlebars helpers. Handlebars helpers are `.js` files which export a function via `module.exports`. The name used to register the helper is the same as the name of the file.

For example, a file named `markdown.js` that exports this function would add a Handlebars helper called `{{markdown}}`.

```js
var marked = require('marked');

module.exports = function(text) {
  return marked(text);
}
```

### `data`

**Type:** `String`

Path to a folder containing external data, which will be passed in to every page. Data can be formatted as JSON (`.json`) or YAML (`.yml`). Within a template, the data is stored within a variable with the same name as the file it came from.

For example, a file named `contact.json` with key/value pairs such as the following:

```js
{
    "name": "John Doe",
    "email": "john.doe@gmail.com",
    "phone": "555-1212"
}
```

Could be used to output the value of John Doe within a template using the Handlebars syntax of `{{contact.name}}`.

Data can also be a `.js` file with a `module.exports`. The data returned by the export function will be used.

Data can also be inserted into the page itself with a Front Matter template at the top of the file.

Lastly, the reserved `page` variable is added to every page template as it renders. It contains the name of the page being rendered, without the extension.

## CLI

You can also use panini via the CLI.

```
Usage: panini --layouts=[layoutdir] --root=[rootdir] --output=[destdir] [other options] 'pagesglob'

Options:
  --layouts  (required) path to a folder containing layouts
  --root     (required) path to the root folder all pages live in
  --output     (required) path to the folder compiled pages should get sent to
  --partials            path to root folder for partials
  --helpers             path to folder for additional helpers
  --data                path to folder for additional data

the argument pagesglob should be a glob describing what pages you want to apply panini to.

Example: panini --root=src/pages --layouts=src/layouts --partials=src/partials --data=src/data --output=dist 'src/pages/**/*.html'
```

## Local Development

```bash
git clone https://github.com/foundation/panini
cd panini
npm install
```

Use `npm test` to run tests.
