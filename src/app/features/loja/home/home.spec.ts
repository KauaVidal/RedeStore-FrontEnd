import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Home } from './home';
import { ProductService } from '../../../core/products/product.service';
import { EventService } from '../../../core/events/event.service';
import { Produto } from '../../../core/products/produto.model';
import { Evento } from '../../../core/events/evento.model';

const DESTAQUE: Produto = {
  id: '1',
  nome: 'Camiseta REDE Clássica',
  categoria: 'camisetas',
  preco: 79.9,
  descricao: 'Camiseta 100% algodão.',
  fotos: ['https://picsum.photos/seed/x/480/480'],
  tamanhos: ['P'],
  cores: ['Preto'],
  variacoes: [{ tamanho: 'P', cor: 'Preto', estoque: 5 }],
  destaque: true,
};

const EVENTO_DISTANTE: Evento = {
  id: '6',
  titulo: 'Vigília de Oração',
  descricao: 'Noite inteira de oração.',
  dataHora: '2026-12-13T22:00:00.000Z',
  local: 'Templo sede, Vila Maria',
  preco: 0,
  vagasTotais: 150,
  foto: 'https://picsum.photos/seed/y/480/480',
};

const EVENTO_PROXIMO: Evento = {
  id: '2',
  titulo: 'Encontro de Jovens',
  descricao: 'Noite de louvor.',
  dataHora: '2026-09-06T22:00:00.000Z',
  local: 'Templo sede, Vila Maria',
  preco: 0,
  vagasTotais: 100,
  foto: 'https://picsum.photos/seed/z/480/480',
};

const EVENTO_PASSADO: Evento = {
  id: '1',
  titulo: 'Retiro de Verão REDE',
  descricao: 'Um fim de semana de imersão.',
  dataHora: '2026-01-16T08:00:00.000Z',
  local: 'Sítio Vida Nova, Ibiúna',
  preco: 250,
  vagasTotais: 4,
  foto: 'https://picsum.photos/seed/x/480/480',
};

describe('Home', () => {
  let fixture: ComponentFixture<Home>;
  let productServiceFalso: jasmine.SpyObj<Pick<ProductService, 'listarDestaques'>>;
  let eventServiceFalso: jasmine.SpyObj<Pick<EventService, 'listar'>>;

  beforeEach(async () => {
    productServiceFalso = jasmine.createSpyObj('ProductService', ['listarDestaques']);
    productServiceFalso.listarDestaques.and.resolveTo([DESTAQUE]);

    eventServiceFalso = jasmine.createSpyObj('EventService', ['listar']);
    // Fora de ordem de propósito, pra provar que a Home ordena por data. Inclui
    // um evento passado pra provar que ele não entra na prévia (I4).
    eventServiceFalso.listar.and.resolveTo([EVENTO_DISTANTE, EVENTO_PROXIMO, EVENTO_PASSADO]);

    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideRouter([]),
        { provide: ProductService, useValue: productServiceFalso },
        { provide: EventService, useValue: eventServiceFalso },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('mostra o título "Destaques"', () => {
    expect(fixture.nativeElement.textContent).toContain('Destaques');
  });

  it('mostra um card para cada produto em destaque', () => {
    expect(fixture.nativeElement.querySelectorAll('app-product-card').length).toBe(1);
  });

  it('mostra os próximos eventos ordenados por data, do mais próximo pro mais distante', () => {
    const cartoes: HTMLAnchorElement[] = Array.from(fixture.nativeElement.querySelectorAll('.home__evento-cartao'));
    expect(cartoes.length).toBe(2);
    expect(cartoes[0].textContent).toContain('Encontro de Jovens');
    expect(cartoes[1].textContent).toContain('Vigília de Oração');
  });

  it('não mostra eventos que já aconteceram nos próximos eventos', () => {
    expect(fixture.nativeElement.textContent).not.toContain('Retiro de Verão REDE');
  });

  it('cada evento linka para a página de detalhes do evento', () => {
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('.home__evento-cartao');
    expect(link.getAttribute('href')).toBe('/eventos/2');
  });

  it('mostra um link para a agenda completa de eventos', () => {
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('.home__link-eventos');
    expect(link.getAttribute('href')).toBe('/eventos');
  });
});
