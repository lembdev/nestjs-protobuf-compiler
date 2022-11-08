import handlebars from 'handlebars';
import { Enum, Field, Type } from 'protobufjs';

const WELL_KNOWN_TYPES: { [key: string]: string } = {
  '.google.protobuf.Empty': `
  fromJSON(object: any): Empty {
    return {};
  },
  toJSON(message: Empty): undefined {
    return;
  },`,
  '.google.protobuf.Timestamp': `
  fromJSON(date: Date | number): Timestamp {
    const timeMS = new Date(date).getTime();
    return {
      seconds: Math.floor(timeMS / 1000),
      nanos: (timeMS % 1000) * 1e6,
    };
  },
  toJSON(timestamp: Timestamp): Date | undefined {
    if (!timestamp.seconds || !timestamp.nanos) return;
    return new Date(timestamp.seconds * 1000 + timestamp.nanos / 1000000);
  },`,
  '.google.protobuf.Struct': `
  fromJSON(object: any): Struct {
    const converter = (value: unknown): Value => {
      switch (true) {
        case value === null:
          return { nullValue: 0 };
        case Array.isArray(value):
          return {
            listValue: { values: (value as unknown[]).map(converter) },
          };
        case typeof value === 'boolean':
          return { boolValue: value as boolean };
        case typeof value === 'object':
          return { structValue: this.fromJSON(value) };
        default:
          return { [typeof value + 'Value']: value };
      }
    };

    return Object.entries(object).reduce<Struct>(
      (acc, [key, value]) => {
        acc.fields![key] = converter(value);
        return acc;
      },
      { fields: {} },
    );
  },
  toJSON(message: Struct): { [key: string]: unknown } {
    if (!message.fields) return {};

    const getRealValue = (value: Value): unknown => {
      const valueType = Object.keys(value)[0];
      const realValue = Object.values(value)[0];

      switch (valueType) {
        case 'nullValue':
          return null;
        case 'structValue':
          return this.toJSON(realValue);
        case 'listValue':
          return (Object.values(realValue)[0] as [] || []).map((val) =>
            getRealValue(val),
          );
        default:
          return realValue;
      }
    };

    return Object.entries(message.fields).reduce<{
      [key: string]: unknown;
    }>((acc, [key, value]) => {
      acc[key] = getRealValue(value);
      return acc;
    }, {});
  },`,
};

const fromJSONConverter = (key: string, field: Field): string => {
  if (field.resolvedType instanceof Enum) {
    return `object.${key}`;
  }

  if (field.resolvedType) {
    const resolvedType = field.resolvedType?.fullName.substring(1);

    return field.repeated
      ? `object.${key}.map((data: unknown) => ${resolvedType}.fromJSON(data))`
      : `${resolvedType}.fromJSON(object.${key})`;
  }

  return `object.${key}`;
};

const toJsonConverter = (key: string, field: Field): string => {
  if (field.resolvedType instanceof Enum) {
    return `message.${key}`;
  }

  if (field.resolvedType) {
    const resolvedType = field.resolvedType?.fullName.substring(1);

    return field.repeated
      ? `message.${key}.map((data: ${resolvedType}) => ${resolvedType}.toJSON(data))`
      : `${resolvedType}.toJSON(message.${key})`;
  }

  return `message.${key}`;
};

const fieldsFromJSON = (type: Type): string => {
  return Object.entries(type.fields)
    .reduce((acc, [key, field]) => {
      const convert = fromJSONConverter(key, field);
      return [...acc, `${key}: isSet(object.${key}) ? ${convert} : undefined,`];
    }, [] as string[])
    .join('\n      ');
};

const fieldsToJSON = (type: Type): string => {
  return Object.entries(type.fields)
    .reduce((acc, [key, field]) => {
      const convert = toJsonConverter(key, field);
      return [...acc, `...(message.${key} ? {${key}: ${convert}} : {}),`];
    }, [] as string[])
    .join('\n      ');
};

handlebars.registerHelper('convertor', (type: Type) => {
  if (type.fullName in WELL_KNOWN_TYPES) {
    return WELL_KNOWN_TYPES[type.fullName].trim();
  }

  return `
  fromJSON(object: any): ${type.name} {
    const isSet = (value: any): boolean =>  value !== null && value !== undefined;
    return {
      ${fieldsFromJSON(type)}
    };
  },
  toJSON<T>(message: ${type.name}): Partial<T> {
    return {
      ${fieldsToJSON(type)}
    } as Partial<T>;
  },
  `.trim();
});
