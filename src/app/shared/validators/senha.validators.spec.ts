import { FormControl, FormGroup } from '@angular/forms';
import { senhaForte, senhasIguais } from './senha.validators';

describe('senhaForte', () => {
  it('retorna erro senhaFraca para senha com menos de 8 caracteres', () => {
    const controle = new FormControl('1234567');
    expect(senhaForte()(controle)).toEqual({ senhaFraca: true });
  });

  it('não retorna erro para senha com 8 ou mais caracteres', () => {
    const controle = new FormControl('12345678');
    expect(senhaForte()(controle)).toBeNull();
  });

  it('não retorna erro para campo vazio (deixa o Validators.required cuidar disso)', () => {
    const controle = new FormControl('');
    expect(senhaForte()(controle)).toBeNull();
  });
});

describe('senhasIguais', () => {
  it('retorna erro senhasDiferentes quando os campos não batem', () => {
    const grupo = new FormGroup({
      senha: new FormControl('abc12345'),
      confirmarSenha: new FormControl('abc12346'),
    });
    expect(senhasIguais('senha', 'confirmarSenha')(grupo)).toEqual({ senhasDiferentes: true });
  });

  it('não retorna erro quando os campos batem', () => {
    const grupo = new FormGroup({
      senha: new FormControl('abc12345'),
      confirmarSenha: new FormControl('abc12345'),
    });
    expect(senhasIguais('senha', 'confirmarSenha')(grupo)).toBeNull();
  });
});
