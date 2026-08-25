import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function senhaForte(): ValidatorFn {
  return (controle: AbstractControl): ValidationErrors | null => {
    const valor: string = controle.value ?? '';
    if (valor.length === 0) return null;
    return valor.length >= 8 ? null : { senhaFraca: true };
  };
}

export function senhasIguais(campoSenha: string, campoConfirmar: string): ValidatorFn {
  return (grupo: AbstractControl): ValidationErrors | null => {
    const senha = grupo.get(campoSenha)?.value;
    const confirmar = grupo.get(campoConfirmar)?.value;
    if (!senha || !confirmar) return null;
    return senha === confirmar ? null : { senhasDiferentes: true };
  };
}
