import { Component, OnInit, inject, signal } from '@angular/core';
import { ProductService } from '../../../core/products/product.service';
import { Produto } from '../../../core/products/produto.model';
import { Table } from '../../../shared/ui/table/table';
import { Modal } from '../../../shared/ui/modal/modal';
import { Button } from '../../../shared/ui/button/button';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { PrecoBrPipe } from '../../../shared/pipes/preco-br.pipe';
import { ProdutoForm } from './produto-form/produto-form';

const ROTULO_CATEGORIA: Record<Produto['categoria'], string> = {
  camisetas: 'Camisetas',
  moletons: 'Moletons',
  acessorios: 'Acessórios',
};

@Component({
  selector: 'app-produtos',
  imports: [Table, Modal, Button, EmptyState, PrecoBrPipe, ProdutoForm],
  templateUrl: './produtos.html',
  styleUrl: './produtos.scss',
})
export class Produtos implements OnInit {
  private readonly produtosService = inject(ProductService);

  protected readonly lista = signal<Produto[]>([]);
  protected readonly modalAberto = signal(false);
  protected readonly produtoEditando = signal<Produto | null>(null);
  protected readonly produtoParaRemover = signal<Produto | null>(null);
  protected readonly rotuloCategoria = ROTULO_CATEGORIA;

  async ngOnInit(): Promise<void> {
    await this.carregar();
  }

  private async carregar(): Promise<void> {
    this.lista.set(await this.produtosService.listar());
  }

  protected abrirNovo(): void {
    this.produtoEditando.set(null);
    this.modalAberto.set(true);
  }

  protected abrirEdicao(produto: Produto): void {
    this.produtoEditando.set(produto);
    this.modalAberto.set(true);
  }

  protected fecharModal(): void {
    this.modalAberto.set(false);
  }

  protected async salvar(dados: Omit<Produto, 'id'>): Promise<void> {
    const editando = this.produtoEditando();
    if (editando) {
      await this.produtosService.atualizar(editando.id, dados);
    } else {
      await this.produtosService.criar(dados);
    }
    this.modalAberto.set(false);
    await this.carregar();
  }

  protected pedirRemocao(produto: Produto): void {
    this.produtoParaRemover.set(produto);
  }

  protected cancelarRemocao(): void {
    this.produtoParaRemover.set(null);
  }

  protected async confirmarRemocao(): Promise<void> {
    const produto = this.produtoParaRemover();
    if (!produto) return;
    await this.produtosService.remover(produto.id);
    this.produtoParaRemover.set(null);
    await this.carregar();
  }

  protected estoqueTotal(produto: Produto): number {
    return produto.variacoes.reduce((soma, v) => soma + v.estoque, 0);
  }
}
