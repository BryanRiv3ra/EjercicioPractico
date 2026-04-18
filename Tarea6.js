// ── EXPRESIONES REGULARES ────────────────────────────────────
const EXPRESIONES_REGULARES = {
  ESPACIO:       /^\s+/,
  COMENTARIO:    /^\/\/[^\n]*/,
  ASIGNACION:    /^:=/,
  OP_RELACIONAL: /^(>=|<=|<>|>|<|=)/,
  OP_ARITMETICO: /^[+\-*/]/,
  DELIMITADOR:   /^[{}()\[\],.;']/,
  CADENA:        /^"[asdfgASDFG]*"/,
  NUMERO:        /^\d+/,
  IDENTIFICADOR: /^[a-zA-Z][a-zA-Z0-9]*/,
};

// ── TABLA DE SÍMBOLOS ────────────────────────────────────────
class TablaDeSimbolos {
  constructor() {
    this.tabla = new Map();
  }

  agregar(token, tipo) {
    if (!this.tabla.has(token)) {
      this.tabla.set(token, { tipo, ocurrencias: 1 });
    } else {
      this.tabla.get(token).ocurrencias++;
    }
  }

  mostrar() {
    console.log("\n╔════════════════════════════════════════════════════╗");
    console.log("║               TABLA DE SÍMBOLOS                   ║");
    console.log("╠══════════════════╦════════════════╦═══════════════╣");
    console.log("║ Token            ║ Tipo           ║ Ocurrencias   ║");
    console.log("╠══════════════════╬════════════════╬═══════════════╣");
    this.tabla.forEach((val, key) => {
      console.log(
        `║ ${key.padEnd(16)} ║ ${val.tipo.padEnd(14)} ║ ${String(val.ocurrencias).padEnd(13)} ║`
      );
    });
    console.log("╚══════════════════╩════════════════╩═══════════════╝");
  }
}

// ── TABLA DE ERRORES LÉXICOS ─────────────────────────────────
class TablaDeErrores {
  constructor() {
    this.errores = [];
  }

  static TIPOS = {
    ID_LARGO:        "ERROR: Identificador > 10 caracteres",
    NUM_RANGO:       "ERROR: Número fuera de rango (0-100)",
    CADENA_INVALIDA: "ERROR: Cadena con caracteres no permitidos",
    CARACTER_INV:    "ERROR: Carácter no reconocido",
  };

  agregar(valor, tipoError, linea, posicion) {
    this.errores.push({ valor, tipoError, linea, posicion });
  }

  mostrar() {
    console.log("\n╔══════════════════════════════════════════════════════════════════════╗");
    console.log("║                     TABLA DE ERRORES LÉXICOS                        ║");
    console.log("╠══════════╦═══════╦══════════╦═══════════════════════════════════════╣");
    console.log("║ Token    ║ Línea ║ Posición ║ Tipo de Error                         ║");
    console.log("╠══════════╬═══════╬══════════╬═══════════════════════════════════════╣");
    if (this.errores.length === 0) {
      console.log("║          ✅ No se encontraron errores léxicos                        ║");
    } else {
      this.errores.forEach(e => {
        const tok = String(e.valor).substring(0, 8).padEnd(8);
        console.log(
          `║ ${tok} ║ ${String(e.linea).padEnd(5)} ║ ${String(e.posicion).padEnd(8)} ║ ${e.tipoError.padEnd(37)} ║`
        );
      });
    }
    console.log("╚══════════╩═══════╩══════════╩═══════════════════════════════════════╝");
    console.log(`\n  Total de errores léxicos: ${this.errores.length}`);
  }
}

// ── ANALIZADOR LÉXICO ────────────────────────────────────────
class AnalizadorLexico {
  constructor(codigo) {
    this.codigo        = codigo;
    this.tokens        = [];
    this.tablaSimbolos = new TablaDeSimbolos();
    this.tablaErrores  = new TablaDeErrores();
  }

  analizar() {
    let entrada  = this.codigo;
    let posicion = 0;
    let linea    = 1;

    const reglas = [
      { tipo: "ESPACIO",        regex: EXPRESIONES_REGULARES.ESPACIO },
      { tipo: "COMENTARIO",     regex: EXPRESIONES_REGULARES.COMENTARIO },
      { tipo: "ASIGNACION",     regex: EXPRESIONES_REGULARES.ASIGNACION },
      { tipo: "OP_RELACIONAL",  regex: EXPRESIONES_REGULARES.OP_RELACIONAL },
      { tipo: "OP_ARITMETICO",  regex: EXPRESIONES_REGULARES.OP_ARITMETICO },
      { tipo: "DELIMITADOR",    regex: EXPRESIONES_REGULARES.DELIMITADOR },
      { tipo: "CADENA",         regex: EXPRESIONES_REGULARES.CADENA },
      { tipo: "NUMERO",         regex: EXPRESIONES_REGULARES.NUMERO },
      { tipo: "IDENTIFICADOR",  regex: EXPRESIONES_REGULARES.IDENTIFICADOR },
    ];

    while (entrada.length > 0) {
      let encontrado = false;

      if (entrada[0] === "\n") linea++;

      for (let regla of reglas) {
        const match = entrada.match(regla.regex);
        if (match) {
          const valor = match[0];
          let tipo    = regla.tipo;
          let esError = false;

          // Espacios y comentarios: saltar sin guardar token
          if (tipo === "ESPACIO" || tipo === "COMENTARIO") {
            linea    += (valor.match(/\n/g) || []).length;
            entrada   = entrada.slice(valor.length);
            posicion += valor.length;
            encontrado = true;
            break;
          }

          // ── Validaciones ─────────────────────────────────
          if (tipo === "NUMERO") {
            const num = parseInt(valor);
            // Números negativos no existen como token (- es operador)
            // Solo validamos rango 0-100
            if (num > 100) {
              esError = true;
              this.tablaErrores.agregar(valor, TablaDeErrores.TIPOS.NUM_RANGO, linea, posicion);
            }
          }

          if (tipo === "IDENTIFICADOR") {
            if (valor.length > 10) {
              esError = true;
              this.tablaErrores.agregar(valor, TablaDeErrores.TIPOS.ID_LARGO, linea, posicion);
            }
          }

          if (tipo === "CADENA") {
            const contenido = valor.slice(1, -1);
            if (!/^[asdfgASDFG]*$/.test(contenido)) {
              esError = true;
              this.tablaErrores.agregar(valor, TablaDeErrores.TIPOS.CADENA_INVALIDA, linea, posicion);
            }
          }

          // ── Guardar token ────────────────────────────────
          this.tokens.push({
            valor,
            tipo: esError ? "ERROR" : tipo,
            linea,
            posicion
          });

          if (!esError) this.tablaSimbolos.agregar(valor, tipo);

          entrada   = entrada.slice(valor.length);
          posicion += valor.length;
          encontrado = true;
          break;
        }
      }

      // ── Carácter no reconocido ───────────────────────────
      if (!encontrado) {
        const caracter = entrada[0];
        this.tokens.push({ valor: caracter, tipo: "ERROR", linea, posicion });
        this.tablaErrores.agregar(caracter, TablaDeErrores.TIPOS.CARACTER_INV, linea, posicion);
        entrada = entrada.slice(1);
        posicion++;
      }
    }
  }

  mostrarTokens() {
    console.log("\n╔══════════════════════════════════════════════════════════╗");
    console.log("║                   TOKENS ENCONTRADOS                    ║");
    console.log("╠══════════════════╦════════════════╦═══════╦═════════════╣");
    console.log("║ Valor            ║ Tipo           ║ Línea ║ Posición    ║");
    console.log("╠══════════════════╬════════════════╬═══════╬═════════════╣");
    this.tokens.forEach(t => {
      const val = String(t.valor).substring(0, 16).padEnd(16);
      console.log(
        `║ ${val} ║ ${t.tipo.padEnd(14)} ║ ${String(t.linea).padEnd(5)} ║ ${String(t.posicion).padEnd(11)} ║`
      );
    });
    console.log("╚══════════════════╩════════════════╩═══════╩═════════════╝");
    console.log(`\n  Total de tokens: ${this.tokens.length}`);
  }

  mostrarExpresionesRegulares() {
    console.log("\n╔══════════════════════════════════════════════════════════╗");
    console.log("║             EXPRESIONES REGULARES UTILIZADAS            ║");
    console.log("╠════════════════╦═════════════════════════════════════════╣");
    console.log("║ Token          ║ Expresión Regular                       ║");
    console.log("╠════════════════╬═════════════════════════════════════════╣");
    Object.entries(EXPRESIONES_REGULARES).forEach(([tipo, regex]) => {
      const r = regex.toString().substring(0, 39).padEnd(39);
      console.log(`║ ${tipo.padEnd(14)} ║ ${r} ║`);
    });
    console.log("╚════════════════╩═════════════════════════════════════════╝");
  }
}

// ── NODO DEL ÁRBOL DE DERIVACIÓN ────────────────────────────
class Nodo {
  constructor(valor) {
    this.valor = valor;
    this.hijos = [];
  }

  agregarHijo(nodo) {
    if (nodo) this.hijos.push(nodo);
  }

  // Imprime el árbol con estructura visual tipo ramas
  imprimir(prefijo = "", esUltimo = true) {
    const conector = esUltimo ? "└── " : "├── ";
    console.log(prefijo + conector + this.valor);
    const nuevoPrefijo = prefijo + (esUltimo ? "    " : "│   ");
    for (let i = 0; i < this.hijos.length; i++) {
      this.hijos[i].imprimir(nuevoPrefijo, i === this.hijos.length - 1);
    }
  }
}

// ── TABLA DE ERRORES SINTÁCTICOS ─────────────────────────────
class TablaDeErroresSintacticos {
  constructor() {
    this.errores = [];
  }

  agregar(mensaje, tokenActual) {
    this.errores.push({ mensaje, tokenActual });
  }

  mostrar() {
    console.log("\n╔══════════════════════════════════════════════════════════════════╗");
    console.log("║                   TABLA DE ERRORES SINTÁCTICOS                  ║");
    console.log("╠══════════════════════════════════════╦═══════════════════════════╣");
    console.log("║ Mensaje                              ║ Token actual              ║");
    console.log("╠══════════════════════════════════════╬═══════════════════════════╣");
    if (this.errores.length === 0) {
      console.log("║  ✅ No se encontraron errores sintácticos                         ║");
    } else {
      this.errores.forEach(e => {
        const msg = String(e.mensaje).substring(0, 36).padEnd(36);
        const tok = String(e.tokenActual).substring(0, 25).padEnd(25);
        console.log(`║ ${msg} ║ ${tok} ║`);
      });
    }
    console.log("╚══════════════════════════════════════╩═══════════════════════════╝");
    console.log(`\n  Total de errores sintácticos: ${this.errores.length}`);
  }
}

// ── ANALIZADOR SINTÁCTICO (PARSER) ──────────────────────────
//
//  BNF implementada:
//
//  <programa>         ::= <lista_sentencias>
//  <lista_sentencias> ::= <sentencia> | <sentencia> <lista_sentencias>
//  <sentencia>        ::= <asignacion>
//  <asignacion>       ::= <identificador> ":=" <expresion>
//  <expresion>        ::= <termino>
//                       | <termino> <op_aritmetico> <termino>
//                       | <termino> <op_relacional> <termino>
//  <termino>          ::= <identificador> | <numero> | <cadena>
//  <identificador>    ::= IDENTIFICADOR (token del lexer)
//  <numero>           ::= NUMERO        (token del lexer, 0-100)
//  <cadena>           ::= CADENA        (token del lexer, chars asdfg)
//  <op_aritmetico>    ::= "+" | "-" | "*" | "/"
//  <op_relacional>    ::= ">=" | "<=" | "<>" | ">" | "<" | "="

class AnalizadorSintactico {
  constructor(tokens) {
    // Filtramos tokens de error del léxico para no confundir al parser
    this.tokens  = tokens.filter(t => t.tipo !== "ERROR");
    this.pos     = 0;
    this.errores = new TablaDeErroresSintacticos();
  }

  // Token actual
  actual() {
    return this.pos < this.tokens.length ? this.tokens[this.pos] : null;
  }

  // Avanzar al siguiente token
  avanzar() {
    this.pos++;
  }

  // Registrar error y avanzar para recuperación
  error(msg) {
    const tok = this.actual() ? this.actual().valor : "EOF";
    this.errores.agregar(msg, tok);
    this.avanzar(); // recuperación simple: saltamos el token problemático
  }

  // ── PROGRAMA ─────────────────────────────────────────────
  parsearPrograma() {
    const raiz = new Nodo("PROGRAMA");
    const lista = this.parsearListaSentencias();
    raiz.agregarHijo(lista);
    return raiz;
  }

  // ── LISTA DE SENTENCIAS ──────────────────────────────────
  parsearListaSentencias() {
    const nodo = new Nodo("LISTA_SENTENCIAS");
    while (this.actual() !== null) {
      const sentencia = this.parsearSentencia();
      if (sentencia) nodo.agregarHijo(sentencia);
      else break;
    }
    return nodo;
  }

  // ── SENTENCIA ────────────────────────────────────────────
  parsearSentencia() {
    const tok = this.actual();
    if (!tok) return null;

    if (tok.tipo === "IDENTIFICADOR") {
      return this.parsearAsignacion();
    }

    // Token inesperado: registrar error y avanzar
    this.error(`Sentencia inválida, se encontró: '${tok.valor}'`);
    return null;
  }

  // ── ASIGNACIÓN ───────────────────────────────────────────
  //  <asignacion> ::= <identificador> ":=" <expresion>
  parsearAsignacion() {
    const nodo = new Nodo("ASIGNACION");

    // Parsear identificador
    nodo.agregarHijo(this.parsearIdentificador());

    // Esperar ':='
    if (this.actual() && this.actual().tipo === "ASIGNACION") {
      nodo.agregarHijo(new Nodo(":="));
      this.avanzar();
    } else {
      this.error(`Se esperaba ':=' pero se encontró: '${this.actual() ? this.actual().valor : "EOF"}'`);
    }

    // Parsear expresión
    nodo.agregarHijo(this.parsearExpresion());

    return nodo;
  }

  // ── EXPRESIÓN ────────────────────────────────────────────
  //  <expresion> ::= <termino>
  //               | <termino> <op_aritmetico> <termino>
  //               | <termino> <op_relacional> <termino>
  parsearExpresion() {
    const nodo = new Nodo("EXPRESION");

    const izq = this.parsearTermino();
    nodo.agregarHijo(izq);

    const tok = this.actual();
    if (tok && tok.tipo === "OP_ARITMETICO") {
      nodo.agregarHijo(new Nodo(`OP_ARITMETICO → '${tok.valor}'`));
      this.avanzar();
      nodo.agregarHijo(this.parsearTermino());
    } else if (tok && tok.tipo === "OP_RELACIONAL") {
      nodo.agregarHijo(new Nodo(`OP_RELACIONAL → '${tok.valor}'`));
      this.avanzar();
      nodo.agregarHijo(this.parsearTermino());
    }

    return nodo;
  }

  // ── TÉRMINO ──────────────────────────────────────────────
  //  <termino> ::= <identificador> | <numero> | <cadena>
  parsearTermino() {
    const nodo = new Nodo("TERMINO");
    const tok  = this.actual();

    if (!tok) {
      this.error("Se esperaba un término pero se llegó al final del código");
      nodo.agregarHijo(new Nodo("ERROR"));
      return nodo;
    }

    if (tok.tipo === "IDENTIFICADOR") {
      nodo.agregarHijo(this.parsearIdentificador());
    } else if (tok.tipo === "NUMERO") {
      nodo.agregarHijo(this.parsearNumero());
    } else if (tok.tipo === "CADENA") {
      nodo.agregarHijo(new Nodo(`CADENA → '${tok.valor}'`));
      this.avanzar();
    } else {
      this.error(`Término inválido: '${tok.valor}'`);
      nodo.agregarHijo(new Nodo("ERROR"));
    }

    return nodo;
  }

  // ── IDENTIFICADOR ────────────────────────────────────────
  //  <identificador> ::= <letra> (<letra> | <digito>)*
  parsearIdentificador() {
    const nodo = new Nodo("IDENTIFICADOR");
    const tok  = this.actual();

    if (tok && tok.tipo === "IDENTIFICADOR") {
      const chars = tok.valor.split("");
      // Primera letra
      nodo.agregarHijo(new Nodo(`LETRA → '${chars[0]}'`));
      // Resto de caracteres
      if (chars.length > 1) {
        const resto = new Nodo("RESTO");
        for (let i = 1; i < chars.length; i++) {
          const esDigito = /\d/.test(chars[i]);
          resto.agregarHijo(new Nodo(`${esDigito ? "DIGITO" : "LETRA"} → '${chars[i]}'`));
        }
        nodo.agregarHijo(resto);
      }
      this.avanzar();
    } else {
      this.error(`Se esperaba un IDENTIFICADOR pero se encontró: '${tok ? tok.valor : "EOF"}'`);
    }

    return nodo;
  }

  // ── NÚMERO ───────────────────────────────────────────────
  //  <numero> ::= <digito> | <digito><digito> | "100"
  parsearNumero() {
    const nodo = new Nodo("NUMERO");
    const tok  = this.actual();

    if (tok && tok.tipo === "NUMERO") {
      const chars = tok.valor.split("");
      chars.forEach(c => nodo.agregarHijo(new Nodo(`DIGITO → '${c}'`)));
      this.avanzar();
    } else {
      this.error(`Se esperaba un NUMERO pero se encontró: '${tok ? tok.valor : "EOF"}'`);
    }

    return nodo;
  }
}

// ── PROGRAMA DE PRUEBA ───────────────────────────────────────
const codigoPrueba = `
variable1 := 50
suma := variable1 + 30
resultado := suma * 2
identificadorMuyLargoError := 99
x := 150
"asdfg"
"hola"
y := z + 1
// esto es un comentario
total := 100
@
`;

// ── EJECUCIÓN ────────────────────────────────────────────────
console.log("════════════════════════════════════════════════════════════");
console.log("   ANALIZADOR LÉXICO + SINTÁCTICO - COMPILADORES UMG      ");
console.log("   Marvin Alexander Cámbara Alonzo  |  0905-23-17848      ");
console.log("════════════════════════════════════════════════════════════");
console.log("\n📄 Código a analizar:");
console.log(codigoPrueba);

// ── FASE 1: ANÁLISIS LÉXICO ──────────────────────────────────
const analizador = new AnalizadorLexico(codigoPrueba);
analizador.analizar();

analizador.mostrarExpresionesRegulares();
analizador.mostrarTokens();
analizador.tablaSimbolos.mostrar();
analizador.tablaErrores.mostrar();

// ── FASE 2: ANÁLISIS SINTÁCTICO ──────────────────────────────
console.log("\n════════════════════════════════════════════════════════════");
console.log("                   ANÁLISIS SINTÁCTICO                     ");
console.log("════════════════════════════════════════════════════════════");

const parser = new AnalizadorSintactico(analizador.tokens);
const arbol  = parser.parsearPrograma();

console.log("\n🌳 ÁRBOL DE DERIVACIÓN:");
console.log("PROGRAMA");
arbol.hijos.forEach((hijo, i) => {
  hijo.imprimir("", i === arbol.hijos.length - 1);
});

parser.errores.mostrar();

// ── EJEMPLOS BNF: 5 ENTRADAS ─────────────────────────────────
const ejemplos = [
  { desc: "Ejemplo 1 - Asignación simple",          codigo: "x := 50" },
  { desc: "Ejemplo 2 - Expresión aritmética",        codigo: "suma := x + 30" },
  { desc: "Ejemplo 3 - Expresión relacional",        codigo: "resultado := variable1 >= 10" },
  { desc: "Ejemplo 4 - Multiplicación",              codigo: "total := suma * 2" },
  { desc: "Ejemplo 5 - Cadena válida en asignación", codigo: 'cad := "asdfg"' },
];

console.log("\n════════════════════════════════════════════════════════════");
console.log("         5 EJEMPLOS BNF CON ÁRBOLES DE DERIVACIÓN          ");
console.log("════════════════════════════════════════════════════════════");

ejemplos.forEach(({ desc, codigo }) => {
  console.log(`\n▶ ${desc}`);
  console.log(`  Entrada: ${codigo}`);

  const lex = new AnalizadorLexico(codigo);
  lex.analizar();

  const pars  = new AnalizadorSintactico(lex.tokens);
  const arbol = pars.parsearPrograma();

  console.log("  Árbol:");
  console.log("  PROGRAMA");
  arbol.hijos.forEach((hijo, i) => {
    hijo.imprimir("  ", i === arbol.hijos.length - 1);
  });

  if (pars.errores.errores.length > 0) {
    console.log("  ⚠ Errores sintácticos:");
    pars.errores.errores.forEach(e =>
      console.log(`    - ${e.mensaje} (token: '${e.tokenActual}')`)
    );
  } else {
    console.log("  ✅ Sintaxis válida");
  }
});

console.log("\n════════════════════════════════════════════════════════════");
console.log("                  Análisis finalizado.                      ");
console.log("════════════════════════════════════════════════════════════\n");