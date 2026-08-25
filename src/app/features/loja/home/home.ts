import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../../core/products/product.service';
import { EventService } from '../../../core/events/event.service';
import { Produto } from '../../../core/products/produto.model';
import { Evento } from '../../../core/events/evento.model';
import { ProductCard } from '../../../shared/ui/product-card/product-card';
import { DataBrPipe } from '../../../shared/pipes/data-br.pipe';

const MAX_EVENTOS_PREVIA = 3;

@Component({
  selector: 'app-home',
  imports: [RouterLink, ProductCard, DataBrPipe],
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

    const agora = Date.now();
    this.proximosEventos.set(
      eventos
        .filter((e) => new Date(e.dataHora).getTime() >= agora)
        .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime())
        .slice(0, MAX_EVENTOS_PREVIA),
    );
  }
}
