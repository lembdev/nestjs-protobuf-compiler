import type { ITemplateEngine } from '../template-engine.interface';
import type { Namespace } from 'protobufjs';

import handlebars from 'handlebars';
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';

import './helpers/convertor.helper';
import './helpers/import-ts.helper';
import './helpers/type-helper';
import './helpers/uncapitalize-hepler';

export class HandlebarsEngine implements ITemplateEngine {
  constructor(
    private readonly namespace: Namespace,
    private readonly templateName: string,
  ) {}

  async compile(): Promise<string> {
    const template = await this.loadTemplate();
    return handlebars.compile(template)(this.namespace).trim();
  }

  private async loadTemplate() {
    const path = resolve(__dirname, '../..', 'templates', this.templateName);

    try {
      return await readFile(path, 'utf8');
    } catch {
      throw new Error(`Template ${path} is not found`);
    }
  }
}
