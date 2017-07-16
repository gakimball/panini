'use strict';

const path = require('path');
const chai = require('chai');
const chaiStream = require('chai-stream-es6').default;
const File = require('vinyl');
const tempy = require('tempy');
const Panini = require('..').Panini;
const PugEngine = require('../engines/pug');

const expect = chai.expect;
chai.use(chaiStream);

describe('Panini class', () => {
  describe('constructor()', () => {
    let panini;

    before(() => {
      panini = new Panini({
        input: 'src'
      });
    });

    it('creates a new instance of Panini', () => {
      expect(panini).to.be.an.instanceOf(Panini);
    });

    it('assigns options', () => {
      expect(panini.options).to.have.property('input', 'src');
    });

    it('throws an error if no input option is set', () => {
      expect(() => new Panini()).to.throw(Error);
    });

    it('allows the engine to be changed', () => {
      const p = new Panini({
        input: 'src',
        engine: 'pug'
      });
      expect(p.engine).to.be.an.instanceOf(PugEngine);
    });

    it('throws an error if engine is invalid', () => {
      expect(() => new Panini({
        input: 'src',
        engine: 'nope'
      })).to.throw(Error);
    });
  });

  describe('getPageData()', () => {
    const p = new Panini({
      input: 'src'
    });
    const file = new File({
      base: path.join(process.cwd(), 'src/pages'),
      path: path.join(process.cwd(), 'src/pages/index.hbs')
    });

    it('returns an object', () => {
      expect(p.getPageData(file, {})).to.be.an('object');
    });

    it('includes global data', () => {
      const p = new Panini({
        input: 'src'
      });
      p.engine.data = {kittens: true};
      expect(p.getPageData(file, {})).to.have.property('kittens', true);
    });

    it('includes page Front Matter', () => {
      expect(p.getPageData(file, {kittens: true})).to.have.property('kittens', true);
    });

    it('deeply merges Front Matter with global data', () => {
      const p = new Panini({
        input: 'src'
      });
      p.engine.data = {
        kittens: {
          one: 'one'
        }
      };
      const fileData = {
        kittens: {
          two: 'two'
        }
      };
      expect(p.getPageData(file, fileData)).to.have.property('kittens').that.eql({
        one: 'one',
        two: 'two'
      });
    });

    it('includes the page name', () => {
      expect(p.getPageData(file, {})).to.have.property('page', 'index');
    });

    it('assigns the default layout if the page does not define one', () => {
      expect(p.getPageData(file, {})).to.have.property('layout', 'default');
    });

    it('assigns a layout based on folder', () => {
      const p = new Panini({
        input: 'src',
        pageLayouts: {about: 'about'}
      });
      const file = new File({
        base: path.join(process.cwd(), 'src/pages'),
        path: path.join(process.cwd(), 'src/pages/about/index.hbs')
      });
      expect(p.getPageData(file, {})).to.have.property('layout', 'about');
    });

    it('assigns an empty root prefix for pages at the root', () => {
      expect(p.getPageData(file, {})).to.have.property('root', '');
    });

    it('assigns a relative root prefix for pages in subdirectories', () => {
      const file = new File({
        base: path.join(process.cwd(), 'src/pages'),
        path: path.join(process.cwd(), 'src/pages/about/index.hbs')
      });
      expect(p.getPageData(file, {})).to.have.property('root', '../');
    });

    it('includes template helpers', () => {
      expect(p.getPageData(file, {})).to.have.property('currentPage').that.is.a('function');
    });

    it('can omit template helpers', () => {
      const p = new Panini({
        input: 'src',
        builtins: false
      });
      expect(p.getPageData(file, {})).to.not.have.property('currentPage');
    });

    it('inserts a parsing error for later use', () => {
      expect(p.getPageData(file, {}, 'error')).to.have.property('_paniniError', 'error');
    });
  });

  describe('compile()', () => {
    let tempDir;

    before(() => {
      tempDir = tempy.directory();
    });

    it('returns a stream', () => {
      const panini = new Panini({input: 'src'});
      const stream = panini.compile(tempDir);
      expect(stream).to.be.a.ReadableStream;
      expect(stream).to.be.a.WritableStream;
    });
  });
});