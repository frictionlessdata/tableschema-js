/// <reference types="csv-parse" />
declare module "tableschema" {
    import { Stream } from "stream";
    import { read } from "fs";
    import parser from "csv-parse";
    type SchemaDescriptor = string | object;

    interface ExtendedRow {
        rowNumber: number;
        headers: string[];
        columns: any[];
    }

    type row = any[] | KeyValuePair | ExtendedRow | TableSchemaError;

    interface TSTableLoadOpts {
        schema?: SchemaDescriptor;
        strict?: boolean;
        headers?: number | string[],
    }

    type TableLoadOpts = TSTableLoadOpts & parser.Options;

    // common interface
    interface IterReadOpts {
        keyed?: boolean;
        extended?: boolean;
        cast?: boolean;
        // not well defined
        forceCast?: boolean;
        relations?: object;
    }

    interface IterOpts extends IterReadOpts{
        stream?: boolean;
    }

    interface StreamIterOpts extends IterOpts {
        stream: true;
    }

    // not sure limit is opt
    interface ReadOpts extends IterReadOpts{       
        limit?: number;
    }

    interface KeyedOpts extends IterReadOpts {
        keyed: true;
    }
    
    interface ExtendedOpts extends IterReadOpts {
        extended: true;
    }
    interface ForceCastOpts extends IterReadOpts {
        forceCast: true;
    }

    export class TableSchemaError extends Error {
        constructor(message: string | undefined, errors?: any)
        errors: TableSchemaError[];
        rowNumber?: number;
        columnNumber?: number;
        // not documented
        message: string; 
    }

    interface FunctionToStream {
        (): Stream;
    }
    interface KeyValuePair {
        [key: string]: string;
    }
    export class Table {
        public static load(source: string | any[][] | Stream | FunctionToStream, opts?: TableLoadOpts): Promise<Table>
        headers: string[];
        schema: Schema;
        // need to define extended        
        public iter(opts?: StreamIterOpts): Promise<Stream>;
        public iter(opts?: IterOpts): Promise<Stream> | AsyncIterator<row>;
        public read(opts: ReadOpts & KeyedOpts): KeyValuePair[];
        public read(opts: ReadOpts & ExtendedOpts): ExtendedRow[];
        public read(opts: ReadOpts & KeyedOpts & ForceCastOpts): (KeyValuePair | TableSchemaError)[];
        public read(opts: ReadOpts & ExtendedOpts & ForceCastOpts): (ExtendedRow | TableSchemaError)[];
        public read(opts: ReadOpts & ForceCastOpts): any[] | (TableSchemaError | KeyValuePair)[] | (TableSchemaError | ExtendedRow)[];
        public read(opts?: ReadOpts): KeyValuePair[] | ExtendedRow[] | (TableSchemaError | KeyValuePair)[] | (TableSchemaError | ExtendedRow)[];
        public infer(limit?: number): object;
        public save(target: string): boolean;
    }

    interface SchemaInferOpts {
        headers?: number | string[];
    }
    export class Schema {
        public static load(descriptor?: string | object, opts?: TableLoadOpts): Schema
        valid: boolean;
        // use specific error obj
        errors: object;
        descriptor: object[];
        primaryKey: string[];
        foreignKeys: object[];
        fields: Field[];
        fieldNames: string[];
        getField(name: string): string | null;
        addField(descriptor: object): Field | null;
        removeField(name: string): Field | null;
        castRow(row: any[]): any[];
        infer(rows: any[][], opts?: SchemaInferOpts): object;
        commit(strict: boolean): boolean;
        save(target: string): boolean;
    }

    export class Field {
        constructor(descriptor: object, missingValues?: string[]);
        name: string;
        type: string;
        format: string;
        required: boolean;
        constraints: object;
        descriptor: object;
        castValue(value: any, constraints: boolean | string[]): any;
        testValue(value: any, constraints?: boolean | string[]): boolean;
    }

    export function validate(descriptor: any): Promise<{
        valid: boolean;
        errors: any[];
    }>
    export function infer(source: any, options?: { limit?: number }): Promise<any>

    //errors go here
}
