import { Enum, match } from 'ts-features';

export namespace CPlusPlus {
    export type SourceFile = Enum<Statement>[];
    export interface Macros {
        Include: {
            isBrace?: boolean,
            target: string,
        },
        Simple: {
            name: string,
            value: string,
        },
        Function: {
            name: string,
            args: string[],
            value: string,
        }
    }

    export interface Statement {
        Expression: { expr: Enum<Expression> },
        Compound: { stmts: Enum<Statement>[] },
        If: {
            constexpr?: boolean,
            init_stmt?: Enum<Statement>,
            condition: Enum<Expression>,
            if_stmt: Enum<Statement>,
            else_stmt?: Enum<Statement>
        },
        While: {
            condition: Enum<Expression>,
            stmt: Enum<Statement>
        },
        DoWhile: {
            stmt: Enum<Statement>
            expr: Enum<Expression>,
        },
        For: {
            init_stmt?: Enum<Statement>,
            cond_expr: Enum<Expression>,
            stmt: Enum<Statement>,
        },
        Break: [],
        Continue: [],
        Return: { expr?: Enum<Expression> },
        Throw: { expr: Enum<Expression> },
        FunctionDecl: {
            decl_specifier_seq: DeclSpecifierSeq,
            declarator: {
                noptr_declarator: NoPtrDeclarator,
                param_list: Param[],
            },
            body: Enum<Statement>["Compound"]
            | "delete"
            | "default"
        },
        TemplateDecl: {
            param_list: Enum<TemplateParam>[],
            decl: Enum<Statement>["ClassDecl"]
            | Enum<Statement>["FunctionDecl"]
        },
        NamespaceDecl: {
            ns_name: string,
            decls: Enum<Statement>["TemplateDecl"]
            | Enum<Statement>["FunctionDecl"]
            | Enum<Statement>["NamespaceDecl"],
        },
        ClassDecl: {
            key: "class" | "struct" | "union",
            name: string,
            base_clause: string,
            member_specification: Enum<Statement>["SimpleDecl"]
            | Enum<Statement>["FunctionDecl"]
            | Enum<Statement>["TemplateDecl"]
            | Enum<Statement>["EnumDecl"]
            | Enum<Statement>["TypedefDecl"]
        },
        EnumDecl: {
            key: "enum" | "enum class" | "enum struct",
            name: string,
            base_clause: string,
            enumerator_list: { identifier: string, constexpr: string }[]
        },
        TypedefDecl: {
            type: Enum<Type>,
        },
        SimpleDecl: {
            decl_specifier_seq: DeclSpecifierSeq,
            init_declarator_list: InitDeclator[],
        },
        TryBlock: {
            try_stmt: Enum<Statement>["Compound"],
            catch_result: Param,
            catch_stmt: Enum<Statement>["Compound"],
        },
    }

    export interface Type {
        class: ClassSpecifier,
        enum: EnumSpecifier,
        simple: SimpleTypeSpecifier,
        qualified: QualifiedTypeSpecifier,
        pointer: PointerTypeSpecifier,
    }

    export interface Expression {
        BinaryOperator: {
            operator: string,
            left: Enum<Expression>,
            right: Enum<Expression>,
        },
        AssignmentOperator: {
            operator: string,
            left: Enum<Expression>,
            right: Enum<Expression>,
        },
        PrefixUnaryOperator: {
            operator: string,
            target: Enum<Expression>,
        },
        PostfixUnaryOperator: {
            operator: string,
            target: Enum<Expression>,
        },
        TernaryOperator: {
            condition: Enum<Expression>,
            left: Enum<Expression>,
            right: Enum<Expression>,
        },
        BinaryMemberAccessOperator: {
            operator: "->" | "." | "[]" | "->*" | ".*",
            left: Enum<Expression>,
            right: Enum<Expression>,
        },
        UnaryMemberAccessOperator: {
            operator: "*" | "&",
            target: Enum<Expression>,
        },
        CastOperator: {
            operator: "static_cast" | "dynamic_cast" | "const_cast" | "reinterpret_cast",
            target: Enum<Expression>,
            tparam: Enum<Type>
        },
        NewOperator: {
            tparam: Enum<Type>,
            initializer?: string,
            count?: string,
        },
        DeleteOperator: {
            target: Enum<Expression>,
        },
        SizeofOperator: {
            target: Enum<Expression>,
        },
        SizeofPackOperator: {
            target: string,
        },
        This: [],
        Literal: number | string | { char: string } | boolean,
        Lambda: {
            captures: "&" | "=" | string[];
            params: Param[],
            body: Enum<Statement>["Compound"]
        },
        Identifier: {
            name: string,
        }
    }

    export interface ClassSpecifier {
        typename: string;
    }

    export interface EnumSpecifier {
        typename: string;
    }

    export type SimpleTypeSpecifier = {
        typename: "char" | "wchar_t" | "bool" | "short" | "int" | "long" | "signed" | "unsigned" | "float" | "double" | "void";
    }

    export type QualifiedTypeSpecifier = {
        typename: string;
    }

    export interface PointerTypeSpecifier {
        typename: string
    }

    export interface DeclSpecifierSeq {
        typedef?: boolean,
        func_specifier?: "inline" | "virtual" | "explicit",
        friend?: boolean,
        storage_class_specifier?: "static" | "extern" | "mutable",
        type_specifier: Enum<Type>
    }

    export type NoPtrDeclarator = string;

    export interface NonTypeTemplateParamType {
        integral: SimpleTypeSpecifier,
        pointer: PointerTypeSpecifier,
        enumeration: EnumSpecifier,
    }

    export interface NonTypeTemplateParam {
        type: Enum<NonTypeTemplateParamType>,
        name?: string,
        default?: string,
    }

    export interface TypeTemplateParam {
        name?: string,
        default?: Enum<Type>,
        param_pack?: boolean,
    }

    export interface Param {
        decl_specifier_seq: DeclSpecifierSeq,
        declarator?: string,
        initializer?: Enum<Expression>,
    }

    export interface InitDeclator {
        declarator: string,
        initalizer?: string,
    }

    export interface TemplateParam {
        non_type_template_param: NonTypeTemplateParam,
        type_template_param: TypeTemplateParam,
        template_param: TemplateParam,
    }

    export function getSourceCode(node: SourceFile): string {
        return node.map(getSourceFromStmt).join("\n");
    }

    function getSourceFromStmt(node: Enum<Statement>, indent: number = 0): string {
        const whitespace = " ".repeat(indent)

        return match<string, Statement>(node, {
            Expression: ({ expr }) => `${whitespace}${getSourceFromExpr(expr)}`,
            Compound: ({ stmts }) => `${whitespace}{\n${stmts.map(stmt => getSourceFromStmt(stmt, indent + 2)).join("\n")}\n${whitespace}}`,
            If: ({
                constexpr,
                init_stmt,
                condition,
                if_stmt,
                else_stmt
            }) => {
                const init_statement = (init_stmt && getSourceFromStmt(init_stmt, indent));
                const else_statement = else_stmt ? getSourceFromStmt(else_stmt, indent) : "";

                return `${whitespace}if ${constexpr ? "constexpr " : ""}(${init_statement ? init_statement + ";" : ""}${getSourceFromExpr(condition)})\n
                                     ${getSourceFromStmt(if_stmt, indent)}
                                     ${else_statement}`;
            },
            While: ({
                condition,
                stmt
            }) => {
                return `${whitespace}while (${getSourceFromExpr(condition)})\n${getSourceFromStmt(stmt, indent)}`;
            },
            DoWhile: ({
                stmt,
                expr
            }) => {
                return `${whitespace}do\n${getSourceFromStmt(stmt, indent)}\nwhile(${getSourceFromExpr(expr)});`
            },
            For: ({
                init_stmt,
                cond_expr,
                stmt
            }) => {
                const init_statement = init_stmt ? getSourceFromStmt(init_stmt) : ";";

                return `${whitespace}for (${init_statement}${getSourceFromExpr(cond_expr)};)\n${getSourceFromStmt(stmt, indent)}`;
            },
            Break: ([]) => `${whitespace}break;`,
            Continue: ([]) => `${whitespace}continue;`,
            Return: ({
                expr
            }) => `${whitespace}return${expr ? getSourceFromExpr(expr) + " " : ""};`,
            Throw: ({
                expr
            }) => `${whitespace}throw ${getSourceFromExpr(expr)};`,
            FunctionDecl: ({
                decl_specifier_seq,
                declarator,
                body
            }) => {
                const args = declarator.param_list.map((param) => {
                    const declarator = param.declarator ?? "";
                    const initializer = param.initializer ? ` = ${getSourceFromExpr(param.initializer)}` : "";

                    `${getTypeName(param.decl_specifier_seq.type_specifier)} ${declarator}${initializer}`;
                }).join(", ");

                if (!body)
                    throw new Error("Declaration-only function is not supported");

                if (body === 'default' || body === 'delete')
                    throw new Error("Still not support class function identifier");
                    
                return `${getTypeName(decl_specifier_seq.type_specifier)} ${declarator.noptr_declarator}(${args})\n${getSourceFromStmt({ Compound: body })}`;
            },
            TemplateDecl: ({
                param_list,
                decl
            }) => '',
            NamespaceDecl: ({

            }) => '',
            ClassDecl: ({

            }) => '',
            EnumDecl: ({

            }) => '',
            TypedefDecl: ({

            }) => '',
            SimpleDecl: ({
                decl_specifier_seq,
                init_declarator_list,
            }) => {
                const typename = getTypeName(decl_specifier_seq.type_specifier);
                const decl_list = init_declarator_list
                    .map((decl) => `${decl.declarator}${decl.initalizer ? ` = ${decl.initalizer}` : ""}`)
                    .join(", ");

                return `${whitespace}${typename} ${decl_list};`;
            },
            TryBlock: ({

            }) => '',
        })
    }

    function getSourceFromExpr(node: Enum<Expression>): string {
        return '';
    }

    function getTypeName(node: Enum<Type>): string {
        const result = match<string, Type>(node, {
            class: ({
                typename
            }) => typename,
            enum: ({
                typename
            }) => typename,
            pointer: ({
                typename
            }) => typename,
            qualified: ({
                typename
            }) => typename,
            simple: ({
                typename
            }) => typename,
        }) ?? "int";

        if (result === "") return "int";
        else return result;
    }
}