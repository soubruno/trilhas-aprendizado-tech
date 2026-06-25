function evaluateRules(metrics, history, behaviorProfile) {

    const issues = [];
    const positives = [];
    const warnings = [];

    let score = 100;

    /*
    =========================================
    VAR
    =========================================
    */

    if (metrics.varCount > 0) {
        issues.push(
            `Uso de ${metrics.varCount} declaração(ões) com var`
        );
        score -= metrics.varCount * 8;
    }

    /*
    =========================================
    CONSOLE.LOG
    =========================================
    */

    if (metrics.consoleLogCount >= 3) {
        warnings.push(
            "Uso excessivo de console.log"
        );
        score -= 10;
    }

    /*
    =========================================
    NESTING
    =========================================
    */

    if (metrics.maxNestingLevel >= 3) {
        issues.push(
            `Nesting elevado (${metrics.maxNestingLevel} níveis)`
        );
        score -= 15;
    }

    /*
    =========================================
    FUNÇÕES GRANDES
    =========================================
    */

    if (metrics.largeFunctions.length > 0) {
        metrics.largeFunctions.forEach(func => {
            issues.push(
                `Função "${func.name}" muito grande (${func.size} linhas)`
            );
        });
        score -= metrics.largeFunctions.length * 10;
    }

    /*
    =========================================
    ACOPLAMENTO ESTRUTURAL (Novo - Feedback do Professor)
    =========================================
    */

    if (metrics.couplingCount > 6) {
        issues.push(
            `Alto acoplamento estrutural detectado (${metrics.couplingCount} dependências externas/módulos)`
        );
        score -= 15;
    } else if (metrics.couplingCount > 0 && metrics.couplingCount <= 3) {
        positives.push(
            "Baixo acoplamento: código altamente coeso e independente"
        );
        score += 5;
    }

    /*
    =========================================
    LEGIBILIDADE SINTÁTICA / DOCUMENTAÇÃO (Novo - Feedback do Professor)
    =========================================
    */

    // Se o código for razoavelmente grande e a proporção de linhas de comentário for menor que 10%
    if (metrics.totalLinesCount >= 30 && metrics.commentRatio < 0.10) {
        warnings.push(
            `Baixa densidade de documentação sintática (Apenas ${(metrics.commentRatio * 100).toFixed(0)}% do código contém comentários)`
        );
        score -= 10;
    } else if (metrics.commentRatio >= 0.20) {
        positives.push(
            "Boa densidade de documentação interna para legibilidade semântica"
        );
        score += 5;
    }

    /*
    =========================================
    MODERNIZAÇÃO
    =========================================
    */

    if (
        metrics.constCount > metrics.letCount &&
        metrics.varCount === 0
    ) {
        positives.push(
            "Boa adoção de const e ausência de var"
        );
        score += 5;
    }

    /*
    =========================================
    ASYNC/AWAIT
    =========================================
    */

    if (
        metrics.asyncFunctionCount > 0 &&
        metrics.tryCatchCount > 0
    ) {
        positives.push(
            "Uso adequado de async/await com tratamento de erro"
        );
        score += 5;
    }

    /*
    =========================================
    BAIXA MODULARIZAÇÃO
    =========================================
    */

    if (
        metrics.functionCount <= 1 &&
        metrics.lineCount >= 20
    ) {
        warnings.push(
            "Baixa modularização detectada"
        );
        score -= 10;
    }

    /*
    =========================================
    EVOLUÇÃO HISTÓRICA
    =========================================
    */

    if (history.length >= 3) {
        const recentVarUsage = history
            .slice(0, 3)
            .every(item => item.varCount > 0);

        if (recentVarUsage) {
            warnings.push(
                "Uso recorrente de var nas últimas versões"
            );
            score -= 10;
        }
    }

    /*
    =========================================
    PERFIL COMPORTAMENTAL
    =========================================
    */

    if (
        behaviorProfile?.hasModernizationResistance
    ) {
        warnings.push(
            "Resistência recorrente a padrões ES6+"
        );
        score -= 10;
    }

    if (
        behaviorProfile?.improvingCodeQuality
    ) {
        positives.push(
            "Histórico mostra melhoria gradual na qualidade do código"
        );
        score += 10;
    }

    /*
    =========================================
    LIMITES
    =========================================
    */

    if (score > 100) score = 100;
    if (score < 0) score = 0;

    /*
    =========================================
    RESULTADO FINAL
    =========================================
    */

    return {
        score,
        issues,
        warnings,
        positives,
        summary: generateSummary(
            score,
            issues,
            positives
        )
    };
}

/*
=========================================
SUMMARY
=========================================
*/

function generateSummary(score, issues, positives) {
    if (score >= 85) {
        return "Código com boa qualidade estrutural e baixo acoplamento.";
    }
    if (score >= 60) {
        return "Código razoável, mas com pontos importantes de acoplamento ou legibilidade para melhorar.";
    }
    return "Código com problemas estruturais ou dependências excessivas relevantes.";
}

module.exports = {
    evaluateRules
};