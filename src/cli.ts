import chalk from 'chalk';
import yargs from 'yargs';
import { Compiller } from './compiler';

const options = yargs
  .usage(
    'Generate TypeScript interfaces and converters for Nest.js from Protobuf files.\n\nUsage: npc [options]',
  )
  .option('path', {
    alias: 'p',
    describe: 'Path to protofiles directory',
    type: 'array',
    normalize: true,
  })
  .option('output', {
    alias: 'o',
    describe: 'Path to output directory',
    type: 'string',
    normalize: true,
  })
  .option('template', {
    alias: 't',
    describe: 'Template file for generation',
    type: 'string',
  })
  .option('verbose', {
    describe: 'Log all output to console',
    type: 'boolean',
  })
  .demandOption(
    ['path', 'output'],
    chalk.red(
      'Please provide [path] and [output] arguments to work with this tool',
    ),
  )
  .parseSync(process.argv);

const compiller = new Compiller({
  path: options.path,
  output: options.output,
  template: options.template || 'template.hbs',
  verbose: options.verbose || false,
});

compiller.compile().catch(console.error);
