import { Component, OnChanges, SimpleChanges, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Evento } from '../../../../core/events/evento.model';
import { TextField } from '../../../../shared/ui/text-field/text-field';
import { Textarea } from '../../../../shared/ui/textarea/textarea';
import { Button } from '../../../../shared/ui/button/button';

@Component({
  selector: 'app-evento-form',
  imports: [ReactiveFormsModule, TextField, Textarea, Button],
  templateUrl: './evento-form.html',
  styleUrl: './evento-form.scss',
})
export class EventoForm implements OnChanges {
  private readonly fb = inject(FormBuilder);

  readonly evento = input<Evento | null>(null);
  readonly salvar = output<Omit<Evento, 'id'>>();
  readonly cancelar = output<void>();

  protected readonly tentouEnviar = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required]],
    descricao: ['', [Validators.required]],
    dataHora: ['', [Validators.required]],
    local: ['', [Validators.required]],
    preco: [0, [Validators.required, Validators.min(0)]],
    vagasTotais: [1, [Validators.required, Validators.min(1)]],
    foto: ['', [Validators.required]],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['evento']) return;
    const evento = this.evento();
    if (evento) {
      this.form.patchValue({
        titulo: evento.titulo,
        descricao: evento.descricao,
        dataHora: evento.dataHora.slice(0, 16),
        local: evento.local,
        preco: evento.preco,
        vagasTotais: evento.vagasTotais,
        foto: evento.foto,
      });
    } else {
      this.form.reset({ titulo: '', descricao: '', dataHora: '', local: '', preco: 0, vagasTotais: 1, foto: '' });
    }
  }

  protected get erroTitulo(): string {
    const c = this.form.controls.titulo;
    return c.touched && c.invalid ? 'Informe o título do evento.' : '';
  }

  protected get erroDescricao(): string {
    const c = this.form.controls.descricao;
    return c.touched && c.invalid ? 'Informe a descrição.' : '';
  }

  protected get erroDataHora(): string {
    const c = this.form.controls.dataHora;
    return c.touched && c.invalid ? 'Informe a data e hora do evento.' : '';
  }

  protected get erroLocal(): string {
    const c = this.form.controls.local;
    return c.touched && c.invalid ? 'Informe o local.' : '';
  }

  protected get erroPreco(): string {
    const c = this.form.controls.preco;
    if (c.touched && c.hasError('required')) return 'Informe o preço (0 para gratuito).';
    if (c.touched && c.hasError('min')) return 'O preço não pode ser negativo.';
    return '';
  }

  protected get erroVagasTotais(): string {
    const c = this.form.controls.vagasTotais;
    if (c.touched && c.hasError('required')) return 'Informe o total de vagas.';
    if (c.touched && c.hasError('min')) return 'É preciso ao menos 1 vaga.';
    return '';
  }

  protected get erroFoto(): string {
    const c = this.form.controls.foto;
    return c.touched && c.invalid ? 'Informe a URL da foto.' : '';
  }

  protected aoEnviar(): void {
    this.tentouEnviar.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const bruto = this.form.getRawValue();
    this.salvar.emit({
      titulo: bruto.titulo,
      descricao: bruto.descricao,
      dataHora: new Date(bruto.dataHora).toISOString(),
      local: bruto.local,
      preco: Number(bruto.preco),
      vagasTotais: Number(bruto.vagasTotais),
      foto: bruto.foto,
    });
  }
}
