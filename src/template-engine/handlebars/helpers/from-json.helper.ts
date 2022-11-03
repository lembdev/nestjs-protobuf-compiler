import handlebars from 'handlebars';
import { Field } from 'protobufjs';

handlebars.registerHelper('fromJSON', ({ name, type }: Field) => {
  switch (true) {
    case type === 'google.protobuf.Struct':
      return `${name}: isObject(object.${name}) ? struct.fromJSON(object.${name}) : { fields: {} },`;
    default:
      return `${name}: isSet(object.${name}) ? object.${name} : undefined,`;
  }
});
