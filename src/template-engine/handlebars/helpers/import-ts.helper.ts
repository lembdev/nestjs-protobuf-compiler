import handlebars from 'handlebars';
import { Namespace } from 'protobufjs';

handlebars.registerHelper('importTs', (namespace: Namespace) => {
  if (!namespace.options) return;

  const moduleName = new Set();

  if (namespace.options) {
    namespace.options.resolvedTypes.forEach((resolvedType: string) => {
      moduleName.add(resolvedType.split('.')[0]);
    });
  }

  return [...moduleName]
    .map((name) => `import { ${name} } from "../${name}/${name}";`)
    .join('\n');
});
