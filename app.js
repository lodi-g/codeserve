#!/usr/bin/env node

const fs = require('fs');
const util = require('util');

const ArgumentParser = require('argparse').ArgumentParser;
const express = require('express');
const hl = require('highlight.js');
const serveIndex = require('serve-index');

const stylesheetPath = `${__dirname}/styles/%s.css`;

// Arguments
const createAp = () => {
  const defaultStyle = 'github';

  const parser = new ArgumentParser({
    version: '0.0.6',
    addHelp: true,
    description: 'codeserve - serving code with an expressJS server'
  });

  parser.addArgument(['-d', '--directory'], {
    help: 'Directory to serve',
    defaultValue: '.'
  });
  parser.addArgument(['-p', '--port'], {
    help: 'Port number',
    defaultValue: 8000,
    type: 'int'
  });
  parser.addArgument(['-s', '--style'], {
    help: 'highlight.js stylesheet',
    defaultValue: defaultStyle,
    type: value => {
      if (fs.existsSync(util.format(stylesheetPath, value))) {
        return value;
      }
      console.error(`Invalid stylesheet, defaulting to ${defaultStyle}.`);
      return defaultStyle;
    }
  });

  return parser;
};

const args = createAp().parseArgs();

// Arguments are OK, server
const app = express();
const stylesheet = fs.readFileSync(util.format(stylesheetPath, args.style)).toString('utf-8');

// Template function - have something simple
const template = (locals, cb) => {
  const title = `Directory listing for ${locals.directory}`;

  let html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>';
  html += `${title}</title></head><body><h1>${title}</h1><hr><ul>`;

  html += locals.fileList
    .sort((a, b) => (a.name > b.name ? 1 : -1))
    .filter(file => file.stat)
    .map(file => (file.stat.isDirectory() ? { ...file, name: `${file.name}/` } : { ...file }))
    .reduce((acc, file) => acc + `<li><a href=${file.name}>${file.name}</a></li>`, '');

  cb(null, html);
};

// Routes
app.use('/', serveIndex(args.directory, { hidden: true, template }));
app.use('/favicon.ico', (req, res) => res.sendStatus(200));
app.use('/', (req, res, next) => {
  const url = req._parsedOriginalUrl;
  const relativePath = url.pathname.substr(
    args.directory[args.directory.length - 1] === '/' ? 1 : 0
  );
  const path = `${args.directory}${relativePath}`;

  if (url.query === '__codeservedl') {
    return res.sendFile(url.pathname, { root: args.directory });
  }

  let file;
  try {
    file = fs.readFileSync(path).toString('utf-8');
  } catch (err) {
    delete err.stack;
    return next(err);
  }

  let html = `<pre class='hljs'>${hl.highlightAuto(file).value}</pre>`;
  html += `<a href="${url.href}?__codeservedl"><button>Download</button></a>`;
  html += `<style>${stylesheet}</style>`;
  res.send(html);
});

// Start up
app.listen(args.port, () => {
  console.log(`Serving files from ${args.directory} on port ${args.port}.`);
});
