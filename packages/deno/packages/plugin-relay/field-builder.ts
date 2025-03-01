// @ts-nocheck
import { GraphQLResolveInfo } from 'https://cdn.skypack.dev/graphql?dts';
import { assertArray, FieldKind, FieldNullability, InputFieldMap, InputShapeFromFields, InterfaceRef, ObjectRef, RootFieldBuilder, SchemaTypes, } from '../core/index.ts';
import { ConnectionShape, GlobalIDFieldOptions, GlobalIDListFieldOptions, GlobalIDShape, } from './types.ts';
import { capitalize, resolveNodes } from './utils/index.ts';
import { internalEncodeGlobalID } from './utils/internal.ts';
const fieldBuilderProto = RootFieldBuilder.prototype as PothosSchemaTypes.RootFieldBuilder<SchemaTypes, unknown, FieldKind>;
fieldBuilderProto.globalIDList = function globalIDList<Args extends InputFieldMap, Nullable extends FieldNullability<[
    "ID"
]>, ResolveReturnShape>({ resolve, ...options }: GlobalIDListFieldOptions<SchemaTypes, unknown, Args, Nullable, ResolveReturnShape, FieldKind>) {
    const wrappedResolve = async (parent: unknown, args: InputShapeFromFields<Args>, context: object, info: GraphQLResolveInfo) => {
        const result = await resolve(parent, args, context, info);
        if (!result) {
            return result;
        }
        assertArray(result);
        if (Array.isArray(result)) {
            return (await Promise.all(result)).map((item: GlobalIDShape<SchemaTypes> | null | undefined) => item == null || typeof item === "string"
                ? item
                : internalEncodeGlobalID(this.builder, this.builder.configStore.getTypeConfig(item.type).name, String(item.id)));
        }
        return null;
    };
    return this.field({
        ...options,
        type: ["ID"],
        resolve: wrappedResolve as never, // resolve is not expected because we don't know FieldKind
    });
};
fieldBuilderProto.globalID = function globalID<Args extends InputFieldMap, Nullable extends FieldNullability<"ID">, ResolveReturnShape>({ resolve, ...options }: GlobalIDFieldOptions<SchemaTypes, unknown, Args, Nullable, ResolveReturnShape, FieldKind>) {
    const wrappedResolve = async (parent: unknown, args: InputShapeFromFields<Args>, context: object, info: GraphQLResolveInfo) => {
        const result = await resolve(parent, args, context, info);
        if (!result || typeof result === "string") {
            return result;
        }
        const item = result as unknown as GlobalIDShape<SchemaTypes>;
        return internalEncodeGlobalID(this.builder, this.builder.configStore.getTypeConfig(item.type).name, String(item.id));
    };
    return this.field({
        ...options,
        type: "ID",
        resolve: wrappedResolve as never, // resolve is not expected because we don't know FieldKind
    });
};
fieldBuilderProto.node = function node({ id, ...options }) {
    return this.field<{}, InterfaceRef<unknown>, unknown, Promise<unknown>, true>({
        ...options,
        type: this.builder.nodeInterfaceRef(),
        nullable: true,
        resolve: async (parent: unknown, args: {}, context: object, info: GraphQLResolveInfo) => {
            const rawID = (await id(parent, args as never, context, info)) as unknown as GlobalIDShape<SchemaTypes> | string | null | undefined;
            if (rawID == null) {
                return null;
            }
            const globalID = typeof rawID === "string"
                ? rawID
                : internalEncodeGlobalID(this.builder, this.builder.configStore.getTypeConfig(rawID.type).name, String(rawID.id));
            return (await resolveNodes(this.builder, context, info, [globalID]))[0];
        },
    });
};
fieldBuilderProto.nodeList = function nodeList({ ids, ...options }) {
    return this.field({
        ...options,
        nullable: {
            list: false,
            items: true,
        },
        type: [this.builder.nodeInterfaceRef()],
        resolve: async (parent: unknown, args: {}, context: object, info: GraphQLResolveInfo) => {
            const rawIDList = await ids(parent, args as never, context, info);
            assertArray(rawIDList);
            if (!Array.isArray(rawIDList)) {
                return [];
            }
            const rawIds = (await Promise.all(rawIDList)) as (GlobalIDShape<SchemaTypes> | string | null | undefined)[];
            const globalIds = rawIds.map((id) => !id || typeof id === "string"
                ? id
                : internalEncodeGlobalID(this.builder, this.builder.configStore.getTypeConfig(id.type).name, String(id.id)));
            return resolveNodes(this.builder, context, info, globalIds);
        },
    });
};
fieldBuilderProto.connection = function connection({ type, edgesNullable, nodeNullable, ...fieldOptions }, connectionOptionsOrRef = {} as never, edgeOptionsOrRef = {} as never) {
    const connectionRef = connectionOptionsOrRef instanceof ObjectRef
        ? connectionOptionsOrRef
        : this.builder.objectRef<ConnectionShape<SchemaTypes, unknown, boolean>>("Unnamed connection");
    const fieldRef = this.field({
        ...fieldOptions,
        type: connectionRef,
        args: {
            ...fieldOptions.args,
            ...this.arg.connectionArgs(),
        } as unknown as {},
        resolve: fieldOptions.resolve as never,
    });
    if (!(connectionOptionsOrRef instanceof ObjectRef)) {
        this.builder.configStore.onFieldUse(fieldRef, (fieldConfig) => {
            const connectionName = connectionOptionsOrRef.name ??
                `${this.typename}${capitalize(fieldConfig.name)}${fieldConfig.name.toLowerCase().endsWith("connection") ? "" : "Connection"}`;
            this.builder.connectionObject({
                type,
                edgesNullable,
                nodeNullable,
                ...connectionOptionsOrRef,
                name: connectionName,
            }, edgeOptionsOrRef instanceof ObjectRef
                ? edgeOptionsOrRef
                : {
                    name: `${connectionName}Edge`,
                    ...edgeOptionsOrRef,
                });
            this.builder.configStore.associateRefWithName(connectionRef, connectionName);
        });
    }
    return fieldRef as never;
};
