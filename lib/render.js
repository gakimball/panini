var extend = require('deepmerge');
var fm = require('front-matter');
var path = require('path');
var through = require('through2');
var stripBom = require('strip-bom');
var processRoot = require('./processRoot');

module.exports = function() {
  return through.obj(render.bind(this));
}

/**
 * Renders a page with a layout. The page also has access to any loaded partials, helpers, or data.
 * @param {object} file - Vinyl file being parsed.
 * @param {string} enc - Vinyl file encoding.
 * @param {function} cb - Callback that passes the rendered page through the stream.
 */
function render(file, enc, cb) {
  try {
    // Get the HTML for the current page and layout
    var page = fm(stripBom(file.contents.toString()));
    var pageData;

    // Determine which layout to use
    var basePath = path.relative(this.options.root, path.dirname(file.path));
    var layout =
      page.attributes.layout ||
      (this.options.pageLayouts && this.options.pageLayouts[basePath]) ||
      'default';
    var layoutTemplate = this.layouts[layout];

    if (!layoutTemplate) {
      if (layout === 'default') {
        throw new Error('Panini error: you must have a layout named "default".');
      }
      else {
        throw new Error('Panini error: no layout named "'+layout+'" exists.');
      }
    }

    //remove partials starting with "layout-", assume added via inline to be used within layout.hbs
    //possible panini.options to add in a layouts-partial param for "layout-"
    var inlineLayoutPartialList = Object.keys(this.Handlebars.partials).filter(
      function (partial) {
        return (partial.indexOf('layout-') === 0);
      }
    );
    inlineLayoutPartialList.forEach(partial => delete this.Handlebars.partials[partial]);
    //add to Handlebars.partials any inline partials starting with "layout-"
    if (page.body.indexOf('{{#*inline') !== -1 || page.body.indexOf('{{~#*inline') !== -1) {
      var inlinePartialAndCommentRegex = /{{!--(?<comment>[.\s\S]*?)--}}|(?<partial>{{#\*inline[\s]+\"(?<name>layout-[0-9a-zA-Z_-]*)\"}}(?<body>[.\s\S]*?){{\/inline}}[\s]*)/gm;
      var replaceWith = '';
      var bodyText = page.body;
      var inlinePartialMatch;
      while (inlinePartialMatch = inlinePartialAndCommentRegex.exec(page.body)) {
        // Add inline partials from page.body starting with "layout-"
        if (typeof inlinePartialMatch.groups.partial !== 'undefined') {//hasOwnProperty not working?
          this.Handlebars.registerPartial(
            inlinePartialMatch.groups.name,
            this.Handlebars.compile(inlinePartialMatch.groups.body + '\n')
          );
          bodyText = bodyText.replace(inlinePartialMatch.groups.partial, replaceWith);
        }
      }
      page.body = bodyText;//amended body - removed inline partials starting with "layout-"
      //note: would not harm to use body with removed handlebars comments
    }

    // Now create Handlebars templates out of them
    var pageTemplate = this.Handlebars.compile(page.body + '\n');

    // Build page data with globals
    pageData = extend({}, this.data);

    // Add any data from stream plugins
    pageData = (file.data) ? extend(pageData, file.data) : pageData;

    // Add this page's front matter
    pageData = extend(pageData, page.attributes);

    // Finish by adding constants
    pageData = extend(pageData, {
      page: path.basename(file.path, path.extname(file.path)),
      layout: layout,
      root: processRoot(file.path, this.options.root)
    });

    // Add special ad-hoc partials for #ifpage and #unlesspage
    this.Handlebars.registerHelper('ifpage', require('../helpers/ifPage')(pageData.page));
    this.Handlebars.registerHelper('unlesspage', require('../helpers/unlessPage')(pageData.page));

    // Finally, add the page as a partial called "body", and render the layout template
    this.Handlebars.registerPartial('body', pageTemplate);
    file.contents = new Buffer.from(layoutTemplate(pageData));
  }
  catch (e) {
    if (layoutTemplate) {
      // Layout was parsed properly so we can insert the error message into the body of the layout
      this.Handlebars.registerPartial('body', 'Panini: template could not be parsed <br> \n <pre>{{error}}</pre>');
      file.contents = new Buffer.from(layoutTemplate({ error: e }));
    }
    else {
      // Not even once - write error directly into the HTML output so the user gets an error
      // Maintain basic html structure to allow Livereloading scripts to be injected properly
      file.contents = new Buffer.from('<!DOCTYPE html><html><head><title>Panini error</title></head><body><pre>'+e+'</pre></body></html>');
    }

    throw new Error('Panini: rendering error occured.\n' + e);
  }
  finally {
    // This sends the modified file back into the stream
    cb(null, file);
  }
}
