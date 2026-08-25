import { PrecoBrPipe } from './preco-br.pipe';

describe('PrecoBrPipe', () => {
  let pipe: PrecoBrPipe;

  beforeEach(() => {
    pipe = new PrecoBrPipe();
  });

  it('formata um valor decimal com vírgula', () => {
    expect(pipe.transform(79.9)).toBe('79,90');
  });

  it('formata um valor inteiro com duas casas decimais', () => {
    expect(pipe.transform(40)).toBe('40,00');
  });

  it('formata zero corretamente', () => {
    expect(pipe.transform(0)).toBe('0,00');
  });
});
