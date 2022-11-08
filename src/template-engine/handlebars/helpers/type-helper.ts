import handlebars from 'handlebars';

import { ENumberTypes } from '../../../types';

const KNOWN_PREFIX = 'google.protobuf.';

function jsType(protoType: string): string | null {
  switch (true) {
    case protoType === 'string':
      return 'string';
    case protoType === 'bool':
      return 'boolean';
    case protoType === 'bytes':
      return 'Uint8Array';
    case protoType in ENumberTypes:
      return 'number';
    case protoType.startsWith(KNOWN_PREFIX):
      return protoType;
    default:
      return null;
  }
}

handlebars.registerHelper('type', (field) => {
  let type = jsType(field.type);

  if (!type) {
    // If it's not a known type, default to the field type
    type = field.type;

    // Check for a parent
    if (field.options && field.options.parent) {
      type = `${field.options.parent}.${type}`;
    }
  }

  // Maps
  if (field.keyType) {
    type = `{ [key: ${jsType(field.keyType)}]: ${type} }`;
  }

  // Repeated
  if (field.repeated) {
    type += `[]`;
  }

  return type;
});
