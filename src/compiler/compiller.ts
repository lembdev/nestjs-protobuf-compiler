import type { Namespace } from 'protobufjs';

import { join, resolve } from 'node:path';
import { blueBright, gray } from 'chalk';
import { outputFile, copyFile } from 'fs-extra';
import { Root } from 'protobufjs';
import glob from 'glob-promise';

import { Logger } from '../logger/logger';
import { HandlebarsEngine } from '../template-engine/handlebars/handlebars.engine';

export type ICompillerParams = {
  path: string[];
  output: string;
  template: string;
  verbose: boolean;
};

export class Compiller {
  constructor(private readonly options: ICompillerParams) {
    Logger.init({ isVerbose: options.verbose });
  }

  async compile() {
    const protoFiles = new Set<string>();

    for (const path of this.options.path) {
      const pathPattern = path.endsWith('.proto') ? path : `${path}/*.proto`;

      for (const protofilePath of await glob(pathPattern)) {
        Logger.verbose(blueBright(`found: `) + gray(protofilePath));

        protoFiles.add(protofilePath);
      }
    }

    await this.generate(protoFiles);
  }

  private async generate(protoFiles: Set<string>) {
    const root = new Root();

    root
      .loadSync([...protoFiles], {
        keepCase: false,
        alternateCommentMode: false,
      })
      .resolveAll();

    this.walkTree(root);

    for (const [name, namespace] of Object.entries(root.nested || {})) {
      const generatedTs = await new HandlebarsEngine(
        namespace as Namespace,
        this.options.template,
      ).compile();

      await this.output(name, generatedTs);
    }
  }

  private async output(name: string, generatedTs: string) {
    const normalized = name
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();

    const outputPath = join(
      this.options.output,
      normalized,
      `${normalized}.ts`,
    );

    Logger.verbose(`Write file: ${outputPath}`);

    await outputFile(outputPath, generatedTs, 'utf8');
  }

  private walkTree(item: Root | any): void {
    if (item.nested) {
      Object.keys(item.nested).forEach((key) => {
        this.walkTree(item.nested[key]);
      });
    }

    if (item.fields) {
      item.parent.options = item.parent.options || { resolvedTypes: new Set() };

      Object.keys(item.fields).forEach((key) => {
        const field = item.fields[key];

        if (field.resolvedType && field.type.includes('.')) {
          item.parent.options.resolvedTypes.add(field.type);
        }
      });
    }
  }
}
