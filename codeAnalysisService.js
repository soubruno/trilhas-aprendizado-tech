const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

function analyzeCode(sourceCode) {
  // Inicialização robusta de todas as métricas necessárias para as regras e perfil
  const metrics = {
    functionCount: 0,
    arrowFunctionCount: 0,
    asyncFunctionCount: 0,
    varCount: 0,
    letCount: 0,
    constCount: 0,
    consoleLogCount: 0,
    tryCatchCount: 0,
    ifCount: 0,
    loopCount: 0,
    maxNestingLevel: 0,
    largeFunctions: [],
    couplingCount: 0,
    commentLinesCount: 0,
    totalLinesCount: sourceCode.split('\n').length
  };

  try {
    const ast = parser.parse(sourceCode, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'asyncGenerators', 'classProperties'],
      attachComment: true
    });

    traverse(ast, {
      // 1. Capturando funções comuns
      FunctionDeclaration(path) {
        metrics.functionCount++;
        checkFunctionSize(path, metrics);
      },

      // 2. Capturando Arrow Functions
      ArrowFunctionExpression(path) {
        metrics.functionCount++;
        metrics.arrowFunctionCount++;
        checkFunctionSize(path, metrics);
      },

      // 3. Capturando declarações de variáveis
      VariableDeclaration(path) {
        if (path.node.kind === 'var') metrics.varCount++;
        if (path.node.kind === 'let') metrics.letCount++;
        if (path.node.kind === 'const') metrics.constCount++;
      },

      // 4. Capturando Acoplamento (Imports) e Console.logs/Requires
      CallExpression(path) {
        const { callee } = path.node;

        // CommonJS require (Acoplamento)
        if (callee.type === 'Identifier' && callee.name === 'require') {
          metrics.couplingCount++;
        }

        // Console.log
        if (
          callee.type === 'MemberExpression' &&
          callee.object.type === 'Identifier' && callee.object.name === 'console' &&
          callee.property.type === 'Identifier' && callee.property.name === 'log'
        ) {
          metrics.consoleLogCount++;
        }
      },

      // 5. Capturando ES6 Imports (Acoplamento)
      ImportDeclaration() {
        metrics.couplingCount++;
      },

      // 6. Estruturas de controle e cálculo de Nesting
      IfStatement(path) {
        metrics.ifCount++;
        const nesting = getNestingLevel(path);
        if (nesting > metrics.maxNestingLevel) {
          metrics.maxNestingLevel = nesting;
        }
      },

      TryStatement() {
        metrics.tryCatchCount++;
      },

      ForStatement() { metrics.loopCount++; },
      WhileStatement() { metrics.loopCount++; },

      // 7. Contagem de comentários (Legibilidade)
      enter(path) {
        if (path.node.leadingComments) {
          path.node.leadingComments.forEach(comment => {
            const lines = comment.value.split('\n').length;
            metrics.commentLinesCount += lines;
          });
          path.node.leadingComments = null; // Evita contagem duplicada no traverse
        }
      }
    });

  } catch (error) {
    console.error("Erro ao processar AST no parser:", error);
  }

  // Cálculos pós-análise estrutural
  metrics.commentRatio = metrics.totalLinesCount > 0 
    ? parseFloat((metrics.commentLinesCount / metrics.totalLinesCount).toFixed(2))
    : 0;

  return metrics;
}

// Funções auxiliares para medição de tamanho e escopo
function checkFunctionSize(path, metrics) {
  const start = path.node.loc?.start?.line || 0;
  const end = path.node.loc?.end?.line || 0;
  const size = end - start;

  if (size >= 15) {
    metrics.largeFunctions.push({
      name: path.node.id?.name || "Função anônima",
      size
    });
  }
  if (path.node.async) {
    metrics.asyncFunctionCount++;
  }
}

function getNestingLevel(path) {
  let level = 0;
  let current = path.parentPath;
  while (current) {
    if (current.isIfStatement() || current.isForStatement() || current.isWhileStatement()) {
      level++;
    }
    current = current.parentPath;
  }
  return level;
}

module.exports = { analyzeCode };