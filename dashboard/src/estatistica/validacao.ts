export function validarAmostra(x: readonly number[], minimo = 2): void {
  if (x.length < minimo || x.some((v) => !Number.isFinite(v))) {
    throw new RangeError(`A amostra deve conter pelo menos ${minimo} valores finitos`);
  }
}

export function validarInteiro(valor: number, minimo: number, nome: string): void {
  if (!Number.isSafeInteger(valor) || valor < minimo) {
    throw new RangeError(`${nome} deve ser um inteiro maior ou igual a ${minimo}`);
  }
}
