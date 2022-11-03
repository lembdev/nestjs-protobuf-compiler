import handlebars from 'handlebars';
import { Field } from 'protobufjs';

handlebars.registerHelper('toJSON', ({ name, type }: Field) => {
  switch (true) {
    case type === 'google.protobuf.Struct':
      return `message.${name} !== undefined && (obj.${name} = struct.toJSON(message.${name}));`;
    default:
      return `message.${name} !== undefined && (obj.${name} = message.${name});`;
  }
});
