import { jsonSchemaTransform, jsonSchemaTransformObject } from 'fastify-type-provider-zod';
import { FastifySchema } from 'fastify';

const removeErrors = (schema: FastifySchema) => {
  if (!schema?.response) return;

  const responses: Record<string, any> = schema.response;
  Object.keys(responses).forEach((code) => {
    if (code.startsWith('4') || code.startsWith('5')) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete responses[code];
    }
  });
};

export const wrappedJsonSchemaTransform = (props: Parameters<typeof jsonSchemaTransform>[0]) => {
  const transformed = jsonSchemaTransform(props);

  removeErrors(transformed.schema);

  return transformed;
};

export const removeInputs = (schemas: Record<string, any>) => {
  if (!schemas) return;
  const schemaNames = Object.keys(schemas);

  for (const name of schemaNames) {
    if (name.endsWith('Input')) {
      const baseName = name.slice(0, -5); // Удаляем 'Input'
      if (schemas[baseName]) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete schemas[name];
      }
    }
  }
};

export const wrappedJsonSchemaTransformObject = (props: Parameters<typeof jsonSchemaTransformObject>[0]) => {
  const result: any = jsonSchemaTransformObject(props);
  removeInputs(result.components?.schemas || {});

  return result;
};
