import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../../core/products/product.service';
import { EventService } from '../../../core/events/event.service';
import { Produto } from '../../../core/products/produto.model';
import { Evento } from '../../../core/events/evento.model';
import { ProductCard } from '../../../shared/ui/product-card/product-card';

const MAX_EVENTOS_PREVIA = 3;

@Component({
  selector: 'app-home',
  imports: [RouterLink, ProductCard],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private readonly produtos = inject(ProductService);
  private readonly eventos = inject(EventService);

  protected readonly destaques = signal<Produto[]>([]);
  protected readonly proximosEventos = signal<Evento[]>([]);

  async ngOnInit(): Promise<void> {
    const [destaques, eventos] = await Promise.all([this.produtos.listarDestaques(), this.eventos.listar()]);
    this.destaques.set(destaques);
    this.proximosEventos.set(
      [...eventos]
        .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime())
        .slice(0, MAX_EVENTOS_PREVIA),
    );
  }

  protected formatarDataHora(iso: string): string {
    const data = new Date(iso);
    const dataFormatada = data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const horaFormatada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${dataFormatada} às ${horaFormatada}`;
  }
}
