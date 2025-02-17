import { StandardSchemaV1 } from "./schema";

export type Output<T> = T extends Schema<unknown, infer Output>
  ? Output
  : never;
export type Input<T> = T extends Schema<infer Input, unknown> ? Input : never;

type UnknownToOuput<T> = T extends Schema<unknown>
  ? Output<T>
  : T extends {
      [k in keyof T]: unknown;
    }
  ? {
      [k in keyof T]: UnknownToOuput<T[k]>;
    }
  : T;

type UnknownToInput<T> = T extends Schema<unknown>
  ? Input<T>
  : T extends {
      [k in keyof T]: unknown;
    }
  ? {
      [k in keyof T]: UnknownToInput<T[k]>;
    }
  : T;

class Schema<TInput, TOutput = TInput>
  implements StandardSchemaV1<TInput, TOutput>
{
  type: string;

  constructor() {
    this.type = "schema";
    this["~standard"] = {
      version: 1,
      vendor: "",
      validate: this.validate.bind(this),
    };
  }

  "~standard": {
    version: 1;
    vendor: "";
    validate(input: unknown): StandardSchemaV1.Result<TOutput>;
  };

  validate(input: unknown): StandardSchemaV1.Result<TOutput> {
    if (typeof input === this.type) {
      return { value: input as TOutput };
    } else {
      return {
        issues: [
          {
            message: `Expected ${this.type} but got ${typeof input}`,
          },
        ],
      };
    }
  }

  parse(input: TInput): TOutput {
    return input as unknown as TOutput;
  }

  nullable(): Schema<TInput | null, TOutput | null> {
    return this;
  }

  default(value: TInput): Schema<TInput | undefined, TOutput> {
    return this;
  }
}

class StringSchema extends Schema<string, string> {
  type = "string";
}
function string(): StringSchema {
  return new StringSchema();
}

class NumberSchema extends Schema<number, number> {
  type = "number";
}
function number(): NumberSchema {
  return new NumberSchema();
}

class BooleanSchema extends Schema<boolean, boolean> {
  type = "boolean";
}
function boolean(): BooleanSchema {
  return new BooleanSchema();
}

class DateSchema extends Schema<Date, Date> {
  type = "Date";
}
function date(): DateSchema {
  return new DateSchema();
}

class ObjectSchema<T extends Record<PropertyKey, Schema<unknown>>> extends Schema<
  UnknownToInput<T>,
  UnknownToOuput<T>
> {
  type = "object";
  properties: T;

  constructor(properties: T) {
    super();
    this.properties = properties;
  }
}
function object<T extends Record<PropertyKey, Schema<unknown>>>(
  properties: T
): ObjectSchema<T> {
  return new ObjectSchema(properties);
}

class ArraySchema<T extends Schema<unknown>> extends Schema<
  UnknownToInput<T>[],
  UnknownToOuput<T>[]
> {
  type = "array";
  items: T;

  constructor(items: T) {
    super();
    this.items = items;
  }
}
function array<T extends Schema<unknown>>(items: T): ArraySchema<T> {
  return new ArraySchema(items);
}

const sc = object({
  name: string().nullable().default(""),
  age: number().default(0),
  nested: object({
    name: date().nullable(),
    age: boolean(),
  }),
  arr: array(string()),
});

sc.properties.name.parse("John");

const result = sc.parse({
  name: "John",
  age: 1,
  nested: {
    name: new Date(),
    age: true,
  },
  arr: ["John", "Doe"],
});
