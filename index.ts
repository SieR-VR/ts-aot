import ts from "typescript";
import { match_number, Enum, to_enum } from "ts-features";
import { CPlusPlus } from "./codegen";
import { readFileSync } from "fs";

type TypescriptStmt =
    ts.SyntaxKind.ForStatement
    | ts.SyntaxKind.DoStatement
    | ts.SyntaxKind.IfStatement
    | ts.SyntaxKind.TryStatement
    | ts.SyntaxKind.ThrowStatement
    | ts.SyntaxKind.BreakStatement
    | ts.SyntaxKind.WhileStatement
    | ts.SyntaxKind.ReturnStatement
    | ts.SyntaxKind.ContinueStatement
    | ts.SyntaxKind.VariableStatement
    | ts.SyntaxKind.ExpressionStatement
    | ts.SyntaxKind.Block
    | ts.SyntaxKind.FunctionDeclaration;

const CppStatement = to_enum<CPlusPlus.Statement>();
const CppExpression = to_enum<CPlusPlus.Expression>();
const CppType = to_enum<CPlusPlus.Type>();

function transpile(sourceFile: ts.SourceFile): CPlusPlus.SourceFile {
    const visitExpr: (node: ts.Expression) => Enum<CPlusPlus.Expression> = (node: ts.Expression) => {
        return {} as Enum<CPlusPlus.Expression>
    }

    const visitVariableDecl = (decl: ts.VariableDeclaration) => {
        return CppStatement.SimpleDecl({
            decl_specifier_seq: {
                type_specifier: CppType.qualified({
                    typename: decl.type?.getText() ?? "int",
                })
            },
            init_declarator_list: [
                {
                    declarator: decl.name.getText(),
                    initalizer: decl.initializer?.getText(),
                }
            ]
        });
    }

    const visitVariableDeclList = (decls: ts.VariableDeclarationList) => {
        return CppStatement.SimpleDecl({
            decl_specifier_seq: {
                type_specifier: CppType.qualified({
                    typename: decls.declarations[0].type?.getText() ?? "int",
                }),
            },
            init_declarator_list: decls.declarations.map((decl) => {
                return {
                    declarator: decl.name.getText(),
                    initalizer: decl.initializer?.getText(),
                };
            })
        });
    }

    const visitBlock: (node: ts.Block) => Enum<CPlusPlus.Statement> = (node: ts.Block) => {
        return CppStatement.Compound({
            stmts: node.statements.map(visitStmt),
        });
    }

    const visitStmt: (node: ts.Statement) => Enum<CPlusPlus.Statement> = (node: ts.Statement) => {
        return match_number<Enum<CPlusPlus.Statement>, TypescriptStmt>(node.kind as TypescriptStmt, {
            [ts.SyntaxKind.ForStatement]: () => {
                if (!ts.isForStatement(node))
                    throw new Error("Something went wrong");

                let init_stmt: Enum<CPlusPlus.Statement> | undefined;

                if (node.initializer && ts.isVariableDeclarationList(node.initializer))
                    init_stmt = visitVariableDeclList(node.initializer);
                else 
                    init_stmt = node.initializer && CppStatement.Expression({ expr: visitExpr(node.initializer) })

                return CppStatement.For({
                    init_stmt,
                    cond_expr: visitExpr(node.condition!),
                    stmt: visitStmt(node.statement),
                });
            },
            [ts.SyntaxKind.DoStatement]: () => {
                if (!ts.isDoStatement(node))
                    throw new Error("Something went wrong");

                return CppStatement.DoWhile({
                    expr: visitExpr(node.expression),
                    stmt: visitStmt(node.statement),
                });
            },
            [ts.SyntaxKind.IfStatement]: () => {
                if (!ts.isIfStatement(node))
                    throw new Error("Something went wrong");

                return CppStatement.If({
                    condition: visitExpr(node.expression),
                    if_stmt: visitStmt(node.thenStatement),
                    else_stmt: node.elseStatement && visitStmt(node.elseStatement),
                });
            },
            [ts.SyntaxKind.TryStatement]: () => {
                if (!ts.isTryStatement(node))
                    throw new Error("Something went wrong");

                const variableDecl = visitVariableDecl(node.catchClause!.variableDeclaration!);

                return CppStatement.TryBlock({
                    try_stmt: visitStmt(node.tryBlock) as unknown as Enum<CPlusPlus.Statement>["Compound"],
                    catch_result: {
                        decl_specifier_seq: variableDecl.SimpleDecl.decl_specifier_seq,
                        ...variableDecl.SimpleDecl.init_declarator_list[0]
                    },
                    catch_stmt: visitBlock(node.catchClause!.block).Compound,
                })
            },
            [ts.SyntaxKind.ThrowStatement]: () => {
                if (!ts.isThrowStatement(node))
                    throw new Error("Something went wrong");

                return CppStatement.Throw({
                    expr: visitExpr(node.expression),
                });
            },
            [ts.SyntaxKind.BreakStatement]: () => {
                if (!ts.isBreakStatement(node))
                    throw new Error("Something went wrong");

                return CppStatement.Break([]);
            },
            [ts.SyntaxKind.WhileStatement]: () => {
                if (!ts.isWhileStatement(node))
                    throw new Error("Something went wrong");

                return CppStatement.While({
                    condition: visitExpr(node.expression),
                    stmt: visitStmt(node.statement),
                });
            },
            [ts.SyntaxKind.ReturnStatement]: () => {
                if (!ts.isReturnStatement(node))
                    throw new Error("Something went wrong");

                return CppStatement.Return({
                    expr: node.expression && visitExpr(node.expression),
                });
            },
            [ts.SyntaxKind.ContinueStatement]: () => {
                if (!ts.isContinueStatement(node))
                    throw new Error("Something went wrong");
                
                return CppStatement.Continue([]);
            },
            [ts.SyntaxKind.VariableStatement]: () => {
                if (!ts.isVariableStatement(node))
                    throw new Error("Something went wrong");
                
                return visitVariableDeclList(node.declarationList);
            },
            [ts.SyntaxKind.ExpressionStatement]: () => {
                if (!ts.isExpressionStatement(node))
                    throw new Error("Something went wrong");

                return CppStatement.Expression({
                    expr: visitExpr(node.expression),
                });
            },
            [ts.SyntaxKind.Block]: () => {
                if (!ts.isBlock(node))
                    throw new Error("Something went wrong");

                return visitBlock(node);
            },
            [ts.SyntaxKind.FunctionDeclaration]: () => {
                if (!ts.isFunctionDeclaration(node))
                    throw new Error("Something went wrong");

                const return_type = node.type?.getText()!;

                return CppStatement.FunctionDecl({
                    body: visitStmt(node.body!).Compound,
                    decl_specifier_seq: {
                        type_specifier: CppType.qualified({ typename: return_type }),
                    },
                    declarator: {
                        noptr_declarator: node.name!.getText()!,
                        param_list: node.parameters.map((decl) => {
                            return {
                                decl_specifier_seq: {
                                    type_specifier: CppType.qualified({ typename: decl.type!.getText() })
                                },
                                declarator: decl.name.getText(),
                                initializer: decl.initializer && visitExpr(decl.initializer),
                            }
                        })
                    } 
                })
            },
            _: () => {
                throw new Error(`Unsupported syntax kind: ${node.kind}`)
            }
        })
    }

    return sourceFile.statements.map(visitStmt);
}

const fileNames = process.argv.slice(2);

fileNames.forEach(fileName => {
    const sourceFile = ts.createSourceFile(
        fileName,
        readFileSync(fileName).toString(),
        ts.ScriptTarget.ES2015,
        true,
    )

    const result = transpile(sourceFile);
    console.log(CPlusPlus.getSourceCode(result));
})