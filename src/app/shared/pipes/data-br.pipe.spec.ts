import { DataBrPipe } from './data-br.pipe';

describe('DataBrPipe', () => {
  let pipe: DataBrPipe;

  beforeEach(() => {
    pipe = new DataBrPipe();
  });

  it('formata data e hora no padrão brasileiro, com o mês por extenso', () => {
    // Meio-dia UTC evita que o teste flutue entre dois dias dependendo do fuso
    // horário da máquina que executa a suite.
    const resultado = pipe.transform('2026-01-16T12:00:00.000Z');
    expect(resultado).toMatch(/^\d{2} de \p{L}+ de 2026 às \d{2}:\d{2}$/u);
    expect(resultado).toContain('janeiro');
  });

  it('formata um mês diferente corretamente', () => {
    const resultado = pipe.transform('2026-09-06T12:00:00.000Z');
    expect(resultado).toContain('setembro');
    expect(resultado).toContain('2026');
  });

  it('inclui o separador "às" entre data e hora', () => {
    expect(pipe.transform('2026-01-16T12:00:00.000Z')).toContain(' às ');
  });
});
