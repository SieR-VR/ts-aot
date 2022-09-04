import { Enum } from 'ts-features';

export namespace CPlusPlus {
    export type SourceFile = (Enum<Macros> | Enum<Statement>)[];
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
        initializer?: string,
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
}