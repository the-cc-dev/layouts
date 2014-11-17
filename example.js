'use strict';

var path = require('path');
var util = require('util');
var Options = require('option-cache');
var slice = require('array-slice');
var layout = require('./index2');
var _ = require('lodash');
var extend = _.extend;

/**
 * Example application using load-templates
 *
 * ```js
 * var Engine = require('engine');
 * var engine = new Engine();
 * ```
 *
 * @param {[type]} options
 */

function Engine(options) {
  Options.call(this, options);
  this.cache = {};
  this.defaultTemplates();
  this.defaultOptions();

  if (this.enabled('debug')) {
    this.debug();
  }
}

util.inherits(Engine, Options);

/**
 * Add some default template "types"
 */

Engine.prototype.defaultOptions = function () {
  this.option('delims', {
    content: ['<%', '%>'],
    // layout: /\{%([\s\S]+?)%}/g,
    // layout: '{%([\\s\\S]+?)%}',
    layout: ['{%', '%}'],
  });

  this.disable('debug');
};

/**
 * Add some default template "types"
 */

Engine.prototype.debug = function () {
  this.enable('debugLayouts');
  this.enable('debugEngines');
};


/**
 * Add some default template "types"
 */

Engine.prototype.defaultTemplates = function () {
  this.create('page', 'pages', { isRenderable: true , delims: {layout: ['<%', '%>']}});
  this.create('partial', 'partials', { isPartial: true });
  this.create('layout', 'layouts', { isLayout: true });
};

/**
 * Normalize values and return a template object.
 *
 * @param {String} `key`
 * @param {Object} `value`
 * @param {Object} `locals`
 * @param {Object} `options`
 * @return {Object}
 * @api private
 */

Engine.prototype.load = function (key, value, locals, options) {
  if (typeof value === 'string') {
    value = {content: value};
  }

  var o = value || {};
  o.locals = locals || {};
  o.options = _.extend({}, options);
  o.layout = o.layout || o.locals.layout || o.options.layout;
  return o;
};


/**
 * Given an object of `layouts`, and the `name` of a starting layout,
 * build the layout stack for the given `string`, then wrap and return
 * the string.
 *
 * @param {String} `str` The content string that should be wrapped with a layout.
 * @param {String} `name` The name of the layout to use.
 * @param {Object} `layouts` Object of layouts. `name` should be a key on this object.
 * @return {String} Returns the original string, wrapped with a layout, or layout stack.
 * @api public
 */

Engine.prototype.applyLayout = function (name, collection) {
  var template = this.cache[collection][name];
  var name = template.layout || template.locals.layout;

  // generate delimiters to use to layouts
  var opts = extend({}, this.options, template.options);
  opts.delims = opts.delims && opts.delims.layout;

  return layout(template.content, name, this.cache.layouts, opts);
};

/**
 * Create template "types"
 *
 * @param  {String} `type` The singular name of the type, e.g. `page`
 * @param  {String} `plural` The plural name of the type, e.g. `pages.
 * @return {String}
 */

Engine.prototype.create = function (type, plural, options) {
  this.cache[plural] = this.cache[plural] || {};

  Engine.prototype[type] = function (key, value, locals, opt) {
    return this[plural].apply(this, arguments);
  };

  Engine.prototype[plural] = function (key, value, locals, opt) {
    this.cache[plural][key] = this.load.apply(this, arguments);
    return this;
  };

  return this;
};

var engine = new Engine();

engine
  .layout('default', '[default]{% body %}[default]', {name: 'Brian Woodward'})
  .layout('aaa', '[aaa]{% body %}[aaa]', {layout: 'bbb'})
  .layout('bbb', '[bbb]{% body %}[bbb]', {layout: 'ccc'})
  .layout('ccc', '[ccc]{% body %}[ccc]', {layout: 'default'})
  .layout('ddd', '[ddd]<% body %>[ddd]', {delims: {layout: ['<%', '%>']}})
  .layout('eee', '[eee]{% body %}[eee]')

engine.partial('sidebar1', 'This is sidebar 1.', {layout: 'ddd'});
engine.partial('sidebar2', 'This is sidebar 2.', {layout: 'eee'});
engine.page('home', {content: 'This is content', layout: 'aaa'}, { engine: 'lodash' });
engine.page('about', {content: 'This is content', layout: 'ccc'}, { engine: 'hbs' });
engine.page('contact', {content: 'This is content', layout: 'default'}, { engine: 'hbs' });


Object.keys(engine.cache.partials).forEach(function(name) {
  console.log(engine.applyLayout(name, 'partials'))
});

Object.keys(engine.cache.pages).forEach(function(name) {
  console.log(engine.applyLayout(name, 'pages'))
});


// console.log(util.inspect(engine, null, 10));
