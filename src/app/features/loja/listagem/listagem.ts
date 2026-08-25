import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ProductService } from '../../../core/products/product.service';
import { Categoria, Produto } from '../../../core/products/produto.model';
import { ProductCard } from '../../../shared/ui/product-card/product-card';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';

@Component({
  selector: 'app-listagem',
  imports: [ReactiveFormsModule, ProductCard, EmptyState],
  templateUrl: './listagem.html',
  styleUrl: './listagem.scss',
})
export class Listagem implements OnInit {
  private readonly produtos = inject(ProductService);
  private readonly rota = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  private categoria?: Categoria;
  protected readonly form = this.fb.nonNullable.group({ busca: [''] });
  protected readonly resultado = signal<Produto[]>([]);

  async ngOnInit(): Promise<void> {
    const params = this.rota.snapshot.queryParamMap;
    this.categoria = (params.get('categoria') as Categoria | null) ?? undefined;
    this.form.controls.busca.setValue(params.get('busca') ?? '');
    await this.pesquisar();
  }

  protected async pesquisar(): Promise<void> {
    const busca = this.form.getRawValue().busca;
    this.resultado.set(await this.produtos.listar({ categoria: this.categoria, busca: busca || undefined }));
  }
}
