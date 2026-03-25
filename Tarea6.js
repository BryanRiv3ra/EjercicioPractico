// ============================================================
//   ANALIZADOR LÉXICO + TABLA DE SÍMBOLOS + TABLA DE ERRORES
//   + EXPRESIONES REGULARES
//   Compiladores - UMG
// ============================================================

// ── Expresiones Regulares definidas formalmente ──────────────
const EXPRESIONES_REGULARES = {
  ESPACIO:        /^\s+/,
  COMENTARIO:     /^\/\/[^\n]*/,                        // // comentario
  ASIGNACION:     /^:=/,                                // :=
  OP_RELACIONAL:  /^(>=|<=|<>|>|<|=)/,                 // >= <= <> > < =
  OP_ARITMETICO:  /^[+\-*/]/,                           // + - * /
  DELIMITADOR:    /^[{}()\[\],.;']/,                    // { } ( ) [ ] , . ; '
  CADENA:         /^"[asdfgASDFG]*"/,                   // cadenas con asdfg
  NUMERO:         /^\d+/,                               // números enteros
  IDENTIFICADOR:  /^[a-zA-Z][a-zA-Z0-9]*/,             // identificadores
};

// ── Tabla de Símbolos ────────────────────────────────────────
class TablaDeSimbolos {
  constructor() { this.tabla = new Map(); }

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

// ── Tabla de Errores ─────────────────────────────────────────
class TablaDeErrores {
  constructor() { this.errores = []; }

  // Tipos de error definidos
  static TIPOS = {
    ID_LARGO:       "ERROR: Identificador > 10 caracteres",
    NUM_RANGO:      "ERROR: Número fuera de rango (0-100)",
    CADENA_INVALIDA:"ERROR: Cadena con caracteres no permitidos",
    CARACTER_INV:   "ERROR: Carácter no reconocido",
    ID_INICIO_NUM:  "ERROR: Identificador inicia con número",
  };

  agregar(valor, tipoError, linea, posicion) {
    this.errores.push({ valor, tipoError, linea, posicion });
  }

  mostrar() {
    console.log("\n╔══════════════════════════════════════════════════════════════════════╗");
    console.log("║                        TABLA DE ERRORES                             ║");
    console.log("╠══════════╦═══════╦══════════╦═══════════════════════════════════════╣");
    console.log("║ Token    ║ Línea ║ Posición ║ Tipo de Error                         ║");
    console.log("╠══════════╬═══════╬══════════╬═══════════════════════════════════════╣");

    if (this.errores.length === 0) {
      console.log("║          ✅ No se encontraron errores léxicos                        ║");
    } else {
      this.errores.forEach(e => {
        console.log(
          `║ ${e.valor.padEnd(8)} ║ ${String(e.linea).padEnd(5)} ║ ${String(e.posicion).padEnd(8)} ║ ${e.tipoError.padEnd(37)} ║`
        );
      });
    }
    console.log("╚══════════╩═══════╩══════════╩═══════════════════════════════════════╝");
    console.log(`\n  Total de errores encontrados: ${this.errores.length}`);
  }
}

// ── Analizador Léxico ────────────────────────────────────────
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

      // Contar líneas
      if (entrada[0] === "\n") linea++;

      for (let regla of reglas) {
        const match = entrada.match(regla.regex);
        if (match) {
          const valor = match[0];
          let tipo    = regla.tipo;
          let esError = false;

          if (tipo === "ESPACIO" || tipo === "COMENTARIO") {
            // contar saltos de línea dentro de espacios
            linea += (valor.match(/\n/g) || []).length;
            entrada = entrada.slice(valor.length);
            posicion += valor.length;
            encontrado = true;
            break;
          }

          // ── Validaciones ────────────────────────────────
          if (tipo === "NUMERO") {
            const num = parseInt(valor);
            if (num < 0 || num > 100) {
              esError = true;
              this.tablaErrores.agregar(
                valor, TablaDeErrores.TIPOS.NUM_RANGO, linea, posicion
              );
            }
          }

          if (tipo === "IDENTIFICADOR") {
            if (valor.length > 10) {
              esError = true;
              this.tablaErrores.agregar(
                valor, TablaDeErrores.TIPOS.ID_LARGO, linea, posicion
              );
            }
          }

          if (tipo === "CADENA") {
            // Verificar que solo tenga letras asdfg
            const contenido = valor.slice(1, -1);
            if (!/^[asdfgASDFG]*$/.test(contenido)) {
              esError = true;
              this.tablaErrores.agregar(
                valor, TablaDeErrores.TIPOS.CADENA_INVALIDA, linea, posicion
              );
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

          entrada  = entrada.slice(valor.length);
          posicion += valor.length;
          encontrado = true;
          break;
        }
      }

      // ── Carácter no reconocido ───────────────────────────
      if (!encontrado) {
        const caracter = entrada[0];
        this.tokens.push({ valor: caracter, tipo: "ERROR", linea, posicion });
        this.tablaErrores.agregar(
          caracter, TablaDeErrores.TIPOS.CARACTER_INV, linea, posicion
        );
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
      console.log(
        `║ ${t.valor.padEnd(16)} ║ ${t.tipo.padEnd(14)} ║ ${String(t.linea).padEnd(5)} ║ ${String(t.posicion).padEnd(11)} ║`
      );
    });
    console.log("╚══════════════════╩════════════════╩═══════╩═════════════╝");
  }

  mostrarExpresionesRegulares() {
    console.log("\n╔══════════════════════════════════════════════════════════╗");
    console.log("║             EXPRESIONES REGULARES UTILIZADAS            ║");
    console.log("╠════════════════╦═════════════════════════════════════════╣");
    console.log("║ Token          ║ Expresión Regular                       ║");
    console.log("╠════════════════╬═════════════════════════════════════════╣");
    Object.entries(EXPRESIONES_REGULARES).forEach(([tipo, regex]) => {
      console.log(`║ ${tipo.padEnd(14)} ║ ${regex.toString().padEnd(39)} ║`);
    });
    console.log("╚════════════════╩═════════════════════════════════════════╝");
  }
}

// ── PROGRAMA DE PRUEBA ───────────────────────────────────────
const codigoPrueba = `
variable1 := 50
suma := variable1 + 30
if variable1 >= 10
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
console.log("          ANALIZADOR LÉXICO - COMPILADORES UMG             ");
console.log("════════════════════════════════════════════════════════════");
console.log("\n📄 Código a analizar:");
console.log(codigoPrueba);

const analizador = new AnalizadorLexico(codigoPrueba);
analizador.analizar();

analizador.mostrarExpresionesRegulares();
analizador.mostrarTokens();
analizador.tablaSimbolos.mostrar();
analizador.tablaErrores.mostrar();