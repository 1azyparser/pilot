/**
 * 检查函数的所有分枝是否都正确的返回
 */
class LiveAnalyzer extends SemanticAstVisitor{ 
    
    /**
     * 分析主程序是否正确的renturn了，如果没有，那么自动添加return语句
     * @param prog 
     */
    visitProg(prog:Prog):any{
        let alive = super.visitBlock(prog);

        // 如果主程序没有return语句，那么在最后面加一下
        if (alive){
            prog.stmts.push(new ReturnStatement(prog.endPos, prog.endPos, null));
        }
    }

    /**
     * 检查每个函数是否都正确的return了，也就是 alive 是 false
     * @param functionDecl 
     */
    visitFunctionDecl(functionDecl:FunctionDecl):any{
        let alive = true;
        let sym = functionDecl.sym as FunctionSymbol;
        let functionType = sym.theType as FunctionType;
        if (functionType.returnType != SysTypes.Any && functionType.returnType != SysTypes.Void && functionType.returnType != SysTypes.Undefined){
            alive = super.visitBlock(functionDecl.body);
        }
        else{
            alive = false;
        }

        if (alive){
            this.addError("Function lacks ending return statement and return type does not include 'undefined'.", functionDecl);
        }
        return true; // 函数声明语句不要影响外层的语句
    }

    visitBlock(block:Block):any{
        let alive:boolean = true;
        let deadCodes:Statement[] = []; // 死代码
        for (let stmt of block.stmts){
            if (alive){
                alive = this.visit(stmt) as boolean;
            }
            // return 语句之后的语句，都是死代码
            else{ 
                // 作为 Warning，而不是错误
                this.addWarning("Unreachable code detected.",stmt);
                deadCodes.push(stmt);
            }        
        }

        // 去除死代码
        for (let stmt of deadCodes){
            let index = block.stmts.indexOf(stmt);
            block.stmts.splice(index,1);
        }

        return alive;
    }

    visitReturnStatement(stmt:ReturnStatement):any{
        return false;
    }

    visitVariableStatement(stmt:VariableStatement):any{
        return true;
    }

    visitExpressionStatement(stmt:ExpressionStatement):any{
        return true;
    }
