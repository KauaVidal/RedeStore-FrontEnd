import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CartService } from '../../../core/cart/cart.service';
import { OrderService } from '../../../core/orders/order.service';
import { AuthService } from '../../../core/auth/auth.service';
import { TextField } from '../../../shared/ui/text-field/text-field';
import { Button } from '../../../shared/ui/button/button';

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, TextField, Button],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  private readonly fb = inject(FormBuilder);
  private readonly carrinho = inject(CartService);
  private readonly pedidos = inject(OrderService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly itens = this.carrinho.itens;
  protected readonly subtotal = this.carrinho.subtotal;

  protected readonly form = this.fb.nonNullable.group({
    formaEntrega: ['retirada' as 'retirada' | 'entrega', Validators.required],
    rua: [''],
    numero: [''],
    complemento: [''],
    bairro: [''],
    cidade: [''],
    cep: [''],
  });

  protected readonly enviando = signal(false);
  protected readonly erroGeral = signal<string | null>(null);

  protected get ehEntrega(): boolean {
    return this.form.controls.formaEntrega.value === 'entrega';
  }

  protected get erroRua(): string {
    return this.ehEntrega && this.form.controls.rua.touched && !this.form.controls.rua.value ? 'Informe a rua.' : '';
  }

  protected get erroNumero(): string {
    return this.ehEntrega && this.form.controls.numero.touched && !this.form.controls.numero.value
      ? 'Informe o número.'
      : '';
  }

  protected get erroBairro(): string {
    return this.ehEntrega && this.form.controls.bairro.touched && !this.form.controls.bairro.value
      ? 'Informe o bairro.'
      : '';
  }

  protected get erroCidade(): string {
    return this.ehEntrega && this.form.controls.cidade.touched && !this.form.controls.cidade.value
      ? 'Informe a cidade.'
      : '';
  }

  protected get erroCep(): string {
    return this.ehEntrega && this.form.controls.cep.touched && !this.form.controls.cep.value ? 'Informe o CEP.' : '';
  }

  private enderecoValido(): boolean {
    if (!this.ehEntrega) return true;
    const { rua, numero, bairro, cidade, cep } = this.form.getRawValue();
    return !!(rua && numero && bairro && cidade && cep);
  }

  protected async pagar(): Promise<void> {
    if (this.form.invalid || this.enviando() || !this.enderecoValido()) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.erroGeral.set(null);
    try {
      const dados = this.form.getRawValue();
      const usuario = this.auth.usuarioAtual();
      await this.pedidos.criar({
        usuarioId: usuario!.id,
        itens: this.itens(),
        formaEntrega: dados.formaEntrega,
        endereco: this.ehEntrega
          ? {
              rua: dados.rua,
              numero: dados.numero,
              complemento: dados.complemento || undefined,
              bairro: dados.bairro,
              cidade: dados.cidade,
              cep: dados.cep,
            }
          : undefined,
      });
      this.carrinho.limpar();
      this.router.navigateByUrl('/loja/checkout/confirmacao');
    } catch {
      this.erroGeral.set('Não deu pra finalizar o pedido agora. Tenta de novo em instantes.');
    } finally {
      this.enviando.set(false);
    }
  }
}
