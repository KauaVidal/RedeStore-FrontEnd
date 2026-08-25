import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Categoria } from '../../../core/products/produto.model';

interface CategoriaExibicao {
  valor: Categoria;
  rotulo: string;
}

const CATEGORIAS: CategoriaExibicao[] = [
  { valor: 'camisetas', rotulo: 'Camisetas' },
  { valor: 'moletons', rotulo: 'Moletons' },
  { valor: 'acessorios', rotulo: 'Acessórios' },
];

@Component({
  selector: 'app-categorias',
  imports: [RouterLink],
  templateUrl: './categorias.html',
  styleUrl: './categorias.scss',
})
export class Categorias {
  protected readonly categorias = CATEGORIAS;
}
