import { Component, OnInit, inject, signal } from '@angular/core';
import { ProductService } from '../../../core/products/product.service';
import { Produto } from '../../../core/products/produto.model';
import { Table } from '../../../shared/ui/table/table';
import { Modal } from '../../../shared/ui/modal/modal';
import { Button } from '../../../shared/ui/button/button';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { PrecoBrPipe } from '../../../shared/pipes/preco-br.pipe';
import { ProdutoForm } from './produto-form/produto-form';
import { mensagemDeErro } from '../../../core/api/mensagem-erro';
import { categoriaPorValor } from '../../../core/products/categorias';

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
  protected readonly erro = signal<string | null>(null);
  /** Erro ao salvar: fica dentro do modal, que continua aberto para o admin corrigir sem perder o que digitou. */
  protected readonly erroFormulario = signal<string | null>(null);
  protected readonly salvando = signal(false);
  protected readonly rotuloCategoria = (valor: string) => categoriaPorValor(valor)?.rotulo ?? valor;

  async ngOnInit(): Promise<void> {
    await this.carregar();
  }

  private async carregar(): Promise<void> {
    this.lista.set(await this.produtosService.listar());
  }

  protected abrirNovo(): void {
    this.produtoEditando.set(null);
    this.erroFormulario.set(null);
    this.modalAberto.set(true);
  }

  protected abrirEdicao(produto: Produto): void {
    this.produtoEditando.set(produto);
    this.erroFormulario.set(null);
    this.modalAberto.set(true);
  }

  protected fecharModal(): void {
    this.modalAberto.set(false);
  }

  protected async salvar(dados: Omit<Produto, 'id'>): Promise<void> {
    if (this.salvando()) return;
    this.erro.set(null);
    this.erroFormulario.set(null);
    this.salvando.set(true);
    const editando = this.produtoEditando();
    try {
      if (editando) {
        await this.produtosService.atualizar(editando.id, dados);
      } else {
        await this.produtosService.criar(dados);
      }
    } catch (erro) {
      this.erroFormulario.set(
        mensagemDeErro(erro, {}, 'Não deu pra salvar o produto agora. Tenta de novo em instantes.'),
      );
      return;
    } finally {
      this.salvando.set(false);
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
    this.erro.set(null);
    try {
      await this.produtosService.remover(produto.id);
    } catch (erro) {
      this.erro.set(mensagemDeErro(erro, {}, 'Não deu pra remover o produto agora. Tenta de novo em instantes.'));
    }
    this.produtoParaRemover.set(null);
    await this.carregar();
  }

  protected estoqueTotal(produto: Produto): number {
    return produto.variacoes.reduce((soma, v) => soma + v.estoque, 0);
  }
}
