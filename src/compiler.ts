import { Namespace, Service, Type } from 'protobufjs';

import { join } from 'node:path';
import { blueBright, gray } from 'chalk';
import { outputFile } from 'fs-extra';
import { Root } from 'protobufjs';
import glob from 'glob-promise';
import { Logger } from './logger/logger';
import { HandlebarsEngine } from './template-engine/handlebars/handlebars.engine';

export type ICompilerParams = {
  path: string[];
  output: string;
  template: string;
  verbose: boolean;
};

export class Compiler {
  constructor(private readonly options: ICompilerParams) {
    Logger.init({ isVerbose: options.verbose });
  }

  async compile() {
    const protoFiles = new Set<string>();

    for (const path of this.options.path) {
      const pathPattern = path.endsWith('.proto') ? path : `${path}/**/*.proto`;

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

  private walkTree(item: any): void {
    if (item.nested) {
      item.options = item.options || { resolvedTypes: new Set() };

      Object.values(item.nested).forEach((nested) => {
        this.walkTree(nested);
        if (item.parent) {
          item.parent.options.resolvedTypes = new Set([
            ...item.parent.options.resolvedTypes,
            ...item.options.resolvedTypes,
          ]);
        }
      });
    }

    if (item instanceof Type) {
      Object.values(item.fields).forEach((field) => {
        if (field.resolvedType && field.type.includes('.')) {
          item.parent!.options!.resolvedTypes.add(field.type);
        }
      });
    }
    if (item instanceof Service) {
      const serviceNamespace = item.fullName.slice(1, item.name.length * -1);

      Object.values(item.methods).forEach((method) => {
        const requestType = method.resolvedRequestType!.fullName.slice(1);
        const responseType = method.resolvedResponseType!.fullName.slice(1);

        if (!requestType.startsWith(serviceNamespace)) {
          item.parent!.options!.resolvedTypes.add(requestType);
        }

        if (!responseType.startsWith(serviceNamespace)) {
          item.parent!.options!.resolvedTypes.add(responseType);
        }
      });
    }
  }
}
