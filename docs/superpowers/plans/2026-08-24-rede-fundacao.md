# REDE Fundação Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Angular app and build the shared design system, navigation shell, authentication flow (login/cadastro/recuperar senha), perfil, and página institucional (Sobre a REDE) — the foundation every later subproject (Loja, Eventos, Admin) builds on.

**Architecture:** Angular (standalone components, no NgModules), Signals for state (no NgRx), lazy-loaded routes with a `Shell` layout component wrapping all non-auth routes (auth screens render full-screen without nav). All data comes from in-memory mocks in `core/` with async signatures matching what a real HTTP-backed service will expose later, so swapping in the real API is an implementation swap, not a rewrite of consumers.

**Tech Stack:** Angular (latest stable via `@angular/cli@latest`), TypeScript, SCSS with CSS custom-property design tokens, Angular Router (`provideRouter` + `withComponentInputBinding`), Reactive Forms, Karma/Jasmine (Angular CLI default test runner).

**Spec:** `docs/superpowers/specs/2026-08-24-rede-fundacao-design.md`

## Global Constraints

- Fundo padrão do lado do jovem é `--rede-black` (`#0D0D0D`); telas de admin estão fora de escopo deste plano.
- Paleta restrita aos 7 tokens: `--rede-black`, `--rede-yellow` (`#F4C617`), `--rede-yellow-deep` (`#C79A12`), `--rede-paper` (`#F6F4EC`), `--rede-graphite` (`#1A1815`), `--status-confirm` (`#4C9A6A`), `--status-cancel` (`#D9573B`). Não introduzir cores novas.
- Tipografia: Unbounded (display), Manrope (corpo), IBM Plex Mono (utilitária), via Google Fonts.
- Papéis de usuário: apenas `jovem` e `admin`.
- Raio: `4px` padrão em cards/inputs; `999px` (pílula) reservado a botão primário e badge de status.
- Breakpoint principal: `768px` (mobile abaixo, desktop a partir daí).
- `prefers-reduced-motion: reduce` deve ser respeitado globalmente.
- Estado via Angular Signals, sem NgRx.
- Sem backend real: dados mockados em `core/`, com assinatura (`Promise`/tipos) já compatível com uma futura implementação HTTP.
- Convenção de nomes: componentes **sem** sufixo `Component` na classe (novo style guide Angular — ex.: `export class Login`), serviços **com** sufixo `Service` (ex.: `AuthService`).

---

## Estrutura de arquivos

```
src/
  index.html
  styles.scss
  main.ts
  app/
    app.ts / app.html
    app.config.ts
    app.routes.ts
    core/
      auth/
        usuario.model.ts
        auth-mock-store.ts
        auth.service.ts (+ .spec.ts)
        auth.guard.ts (+ .spec.ts)
      mock/
        mock-latency.ts
    shared/
      ui/
        logo/            (logo.ts/.html/.scss/.spec.ts)
        button/           (button.ts/.html/.scss/.spec.ts)
        text-field/        (text-field.ts/.html/.scss/.spec.ts)
        section-divider/    (section-divider.ts/.html/.scss)
        empty-state/       (empty-state.ts/.html/.scss/.spec.ts)
      validators/
        senha.validators.ts (+ .spec.ts)
      em-breve/
        em-breve.ts/.html/.scss (+ .spec.ts)
    layout/
      shell/       (shell.ts/.html/.scss + .spec.ts)
      header/       (header.ts/.html/.scss/.spec.ts)
      bottom-nav/    (bottom-nav.ts/.html/.scss/.spec.ts)
      footer/         (footer.ts/.html/.scss)
    features/
      auth/
        auth.routes.ts
        login/          (login.ts/.html/.scss/.spec.ts)
        cadastro/        (cadastro.ts/.html/.scss/.spec.ts)
        recuperar-senha/ (recuperar-senha.ts/.html/.scss/.spec.ts)
      perfil/           (perfil.ts/.html/.scss/.spec.ts)
      institucional/
        sobre/          (sobre.ts/.html/.scss/.spec.ts)
  assets/
    logos/ (5 svgs copiados de files/)
  styles/
    _tokens.scss
    _typography.scss
    _mixins.scss
    _auth.scss (layout compartilhado das telas de login/cadastro/recuperar senha)
```

---

### Task 1: Scaffold do projeto Angular

**Files:**
- Create: todo o scaffold gerado pelo Angular CLI (`angular.json`, `package.json`, `tsconfig*.json`, `src/main.ts`, `src/app/app.ts`, `src/app/app.config.ts`, `src/app/app.routes.ts`, `src/index.html`, `src/styles.scss`)
- Modify: `.gitignore`, `README.md` (podem ser sobrescritos pelo CLI — conferir depois)

**Interfaces:**
- Consumes: nada (primeira task)
- Produces: projeto Angular buildável em `ng build`, pronto para receber `app.routes.ts` e `app.config.ts` customizados nas próximas tasks

- [ ] **Step 1: Rodar o Angular CLI para gerar o projeto no diretório atual**

```bash
npx @angular/cli@latest new rede-store --directory=. --routing --style=scss --skip-git --ssr=false --force
```

- [ ] **Step 2: Configurar `includePaths` do Sass para permitir `@use 'styles/...'` de qualquer profundidade**

Em `angular.json`, dentro de `projects.rede-store.architect.build.options` e `projects.rede-store.architect.test.options`, adicionar:

```json
"stylePreprocessorOptions": {
  "includePaths": ["src"]
}
```

- [ ] **Step 3: Verificar que o build funciona**

Run: `npx ng build`
Expected: build conclui sem erros (a pasta `dist/` é gerada)

- [ ] **Step 4: Conferir que `files/*.svg` continuam intactos e restaurar o README**

Run: `ls files/`
Expected: os 5 arquivos `.svg` ainda estão lá (o `ng new` não mexe em diretórios não relacionados)

Sobrescrever `README.md` com o conteúdo mínimo original:

```markdown
# RedeStore-FrontEnd
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold projeto Angular (rede-store)"
```

---

### Task 2: Design tokens, tipografia global e assets da logo

**Files:**
- Create: `src/styles/_tokens.scss`, `src/styles/_typography.scss`, `src/styles/_mixins.scss`
- Modify: `src/styles.scss`, `src/index.html`
- Create: `src/assets/logos/*.svg` (copiados de `files/`)

**Interfaces:**
- Consumes: nada de tasks anteriores além do projeto scaffolded (Task 1)
- Produces: custom properties CSS (`--rede-black`, `--rede-yellow`, `--rede-yellow-deep`, `--rede-paper`, `--rede-graphite`, `--status-confirm`, `--status-cancel`, `--espaco-1`..`--espaco-8`, `--raio-padrao`, `--raio-pilula`, `--fonte-display`, `--fonte-corpo`, `--fonte-utilitaria`), mixin `desktop` em `styles/mixins`, e os 5 arquivos de logo em `assets/logos/logo-rede-<variante>.svg` prontos para uso por qualquer componente

- [ ] **Step 1: Copiar os arquivos de logo para `src/assets/logos/`**

```bash
mkdir -p src/assets/logos
cp files/*.svg src/assets/logos/
```

- [ ] **Step 2: Criar `src/styles/_tokens.scss`**

```scss
:root {
  --rede-black: #0D0D0D;
  --rede-yellow: #F4C617;
  --rede-yellow-deep: #C79A12;
  --rede-paper: #F6F4EC;
  --rede-graphite: #1A1815;
  --status-confirm: #4C9A6A;
  --status-cancel: #D9573B;

  --espaco-1: 4px;
  --espaco-2: 8px;
  --espaco-3: 12px;
  --espaco-4: 16px;
  --espaco-5: 24px;
  --espaco-6: 32px;
  --espaco-7: 48px;
  --espaco-8: 64px;

  --raio-padrao: 4px;
  --raio-pilula: 999px;

  --fonte-display: 'Unbounded', system-ui, sans-serif;
  --fonte-corpo: 'Manrope', system-ui, sans-serif;
  --fonte-utilitaria: 'IBM Plex Mono', ui-monospace, monospace;
}
```

- [ ] **Step 3: Criar `src/styles/_mixins.scss`**

```scss
@mixin desktop {
  @media (min-width: 768px) {
    @content;
  }
}
```

- [ ] **Step 4: Criar `src/styles/_typography.scss`**

```scss
.titulo-1 {
  font-family: var(--fonte-display);
  font-weight: 900;
  font-size: 2rem;
  line-height: 1.1;
  margin: 0;
}

.titulo-2 {
  font-family: var(--fonte-display);
  font-weight: 700;
  font-size: 1.375rem;
  line-height: 1.2;
  margin: 0;
}

.texto-corpo {
  font-family: var(--fonte-corpo);
  font-weight: 400;
  font-size: 1rem;
  line-height: 1.5;
}

.texto-utilitario {
  font-family: var(--fonte-utilitaria);
  font-weight: 500;
  font-size: 0.875rem;
  letter-spacing: 0.02em;
}
```

- [ ] **Step 5: Atualizar `src/styles.scss`**

```scss
@use 'styles/tokens';
@use 'styles/typography';

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  min-height: 100%;
  background: var(--rede-black);
  color: var(--rede-paper);
  font-family: var(--fonte-corpo);
}

:focus-visible {
  outline: 2px solid var(--rede-yellow);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 6: Atualizar `src/index.html`** (fontes do Google Fonts, título, favicon apontando pro glifo transparente)

```html
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>REDE</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="icon" type="image/svg+xml" href="assets/logos/logo-rede-amarelo-transparente.svg" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Unbounded:wght@700;800;900&family=Manrope:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
    rel="stylesheet"
  />
</head>
<body>
  <app-root></app-root>
</body>
</html>
```

- [ ] **Step 7: Verificar build**

Run: `npx ng build`
Expected: build conclui sem erros

- [ ] **Step 8: Commit**

```bash
git add src/styles src/styles.scss src/index.html src/assets/logos
git commit -m "feat: design tokens, tipografia global e assets da logo"
```

---

### Task 3: Componente Logo

**Files:**
- Create: `src/app/shared/ui/logo/logo.ts`, `logo.html`, `logo.scss`, `logo.spec.ts`

**Interfaces:**
- Consumes: assets em `src/assets/logos/logo-rede-<variante>.svg` (Task 2)
- Produces: `Logo` (selector `app-logo`), inputs `variante: LogoVariante` (default `'amarelo-transparente'`), `tamanho: string` (default `'40px'`); tipo exportado `LogoVariante`

- [ ] **Step 1: Escrever o teste**

```typescript
// src/app/shared/ui/logo/logo.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Logo } from './logo';

describe('Logo', () => {
  let fixture: ComponentFixture<Logo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Logo] }).compileComponents();
    fixture = TestBed.createComponent(Logo);
  });

  it('usa a variante amarelo-transparente por padrão', () => {
    fixture.detectChanges();
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(img.src).toContain('logo-rede-amarelo-transparente.svg');
  });

  it('troca o src conforme a variante informada', () => {
    fixture.componentRef.setInput('variante', 'preto-fundo-amarelo');
    fixture.detectChanges();
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(img.src).toContain('logo-rede-preto-fundo-amarelo.svg');
  });

  it('aplica o tamanho informado como largura e altura', () => {
    fixture.componentRef.setInput('tamanho', '80px');
    fixture.detectChanges();
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(img.style.width).toBe('80px');
    expect(img.style.height).toBe('80px');
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx ng test --watch=false --include='**/logo.spec.ts'`
Expected: FAIL (`Logo` não existe)

- [ ] **Step 3: Implementar**

```typescript
// src/app/shared/ui/logo/logo.ts
import { Component, computed, input } from '@angular/core';

export type LogoVariante =
  | 'amarelo-fundo-preto'
  | 'preto-fundo-amarelo'
  | 'amarelo-transparente'
  | 'branco-transparente'
  | 'preto-transparente';

@Component({
  selector: 'app-logo',
  templateUrl: './logo.html',
  styleUrl: './logo.scss',
})
export class Logo {
  readonly variante = input<LogoVariante>('amarelo-transparente');
  readonly tamanho = input<string>('40px');

  protected readonly src = computed(() => `assets/logos/logo-rede-${this.variante()}.svg`);
}
```

```html
<!-- src/app/shared/ui/logo/logo.html -->
<img [src]="src()" [style.width]="tamanho()" [style.height]="tamanho()" alt="REDE" />
```

```scss
// src/app/shared/ui/logo/logo.scss
:host {
  display: inline-flex;
}

img {
  display: block;
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx ng test --watch=false --include='**/logo.spec.ts'`
Expected: PASS (3 testes)

- [ ] **Step 5: Commit**

```bash
git add src/app/shared/ui/logo
git commit -m "feat: componente Logo com variantes de cor"
```

---

### Task 4: Componente Button

**Files:**
- Create: `src/app/shared/ui/button/button.ts`, `button.html`, `button.scss`, `button.spec.ts`

**Interfaces:**
- Consumes: tokens de `styles/tokens` e `styles/mixins` (Task 2)
- Produces: `Button` (selector `app-button`), inputs `variante: 'primario' | 'secundario'` (default `'primario'`), `desabilitado: boolean` (default `false`), `carregando: boolean` (default `false`), `tipo: 'button' | 'submit'` (default `'button'`); output `clicado: void`

- [ ] **Step 1: Escrever o teste**

```typescript
// src/app/shared/ui/button/button.spec.ts
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Button } from './button';

@Component({
  imports: [Button],
  template: `<app-button [desabilitado]="desabilitado" [carregando]="carregando" (clicado)="aoClicar()">Entrar</app-button>`,
})
class HospedeTeste {
  desabilitado = false;
  carregando = false;
  cliques = 0;
  aoClicar() {
    this.cliques++;
  }
}

describe('Button', () => {
  let fixture: ComponentFixture<HospedeTeste>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HospedeTeste] }).compileComponents();
    fixture = TestBed.createComponent(HospedeTeste);
    fixture.detectChanges();
  });

  it('renderiza o conteúdo projetado', () => {
    expect(fixture.nativeElement.querySelector('button').textContent).toContain('Entrar');
  });

  it('emite clicado ao ser clicado', () => {
    fixture.nativeElement.querySelector('button').click();
    expect(fixture.componentInstance.cliques).toBe(1);
  });

  it('não emite clicado quando desabilitado', () => {
    fixture.componentInstance.desabilitado = true;
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button').click();
    expect(fixture.componentInstance.cliques).toBe(0);
  });

  it('mostra "Enviando…" e não emite clicado quando carregando', () => {
    fixture.componentInstance.carregando = true;
    fixture.detectChanges();
    const botao = fixture.nativeElement.querySelector('button');
    expect(botao.textContent).toContain('Enviando');
    botao.click();
    expect(fixture.componentInstance.cliques).toBe(0);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx ng test --watch=false --include='**/button.spec.ts'`
Expected: FAIL (`Button` não existe)

- [ ] **Step 3: Implementar**

```typescript
// src/app/shared/ui/button/button.ts
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-button',
  templateUrl: './button.html',
  styleUrl: './button.scss',
})
export class Button {
  readonly variante = input<'primario' | 'secundario'>('primario');
  readonly desabilitado = input<boolean>(false);
  readonly carregando = input<boolean>(false);
  readonly tipo = input<'button' | 'submit'>('button');
  readonly clicado = output<void>();

  protected aoClicar(): void {
    if (this.desabilitado() || this.carregando()) return;
    this.clicado.emit();
  }
}
```

```html
<!-- src/app/shared/ui/button/button.html -->
<button
  class="botao"
  [class.botao--secundario]="variante() === 'secundario'"
  [type]="tipo()"
  [disabled]="desabilitado() || carregando()"
  (click)="aoClicar()"
>
  @if (carregando()) {
    <span class="botao__spinner" aria-hidden="true"></span>
    <span>Enviando…</span>
  } @else {
    <ng-content />
  }
</button>
```

```scss
// src/app/shared/ui/button/button.scss
@use 'styles/tokens' as *;

.botao {
  font-family: var(--fonte-corpo);
  font-weight: 700;
  font-size: 1rem;
  border: none;
  border-radius: var(--raio-pilula);
  padding: var(--espaco-3) var(--espaco-6);
  background: var(--rede-yellow);
  color: var(--rede-black);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--espaco-2);
  transition: background-color 0.15s ease;

  &:hover:not(:disabled) {
    background: var(--rede-yellow-deep);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--secundario {
    background: transparent;
    color: var(--rede-paper);
    border: 1px solid var(--rede-paper);

    &:hover:not(:disabled) {
      background: rgba(246, 244, 236, 0.08);
    }
  }
}

.botao__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: girar 0.6s linear infinite;
}

@keyframes girar {
  to {
    transform: rotate(360deg);
  }
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx ng test --watch=false --include='**/button.spec.ts'`
Expected: PASS (4 testes)

- [ ] **Step 5: Commit**

```bash
git add src/app/shared/ui/button
git commit -m "feat: componente Button (pilula, variantes, estado de carregando)"
```

---

### Task 5: Componente TextField

**Files:**
- Create: `src/app/shared/ui/text-field/text-field.ts`, `text-field.html`, `text-field.scss`, `text-field.spec.ts`

**Interfaces:**
- Consumes: `ReactiveFormsModule` (Angular), tokens de `styles/tokens`
- Produces: `TextField` (selector `app-text-field`), inputs `rotulo: string` (required), `tipo: 'text' | 'email' | 'password' | 'tel'` (default `'text'`), `controle: FormControl` (required), `erro: string | null` (default `null`)

- [ ] **Step 1: Escrever o teste**

```typescript
// src/app/shared/ui/text-field/text-field.spec.ts
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TextField } from './text-field';

@Component({
  imports: [TextField, ReactiveFormsModule],
  template: `<app-text-field rotulo="E-mail" [controle]="controle" [erro]="erro"></app-text-field>`,
})
class HospedeTeste {
  controle = new FormControl('');
  erro: string | null = null;
}

describe('TextField', () => {
  let fixture: ComponentFixture<HospedeTeste>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HospedeTeste] }).compileComponents();
    fixture = TestBed.createComponent(HospedeTeste);
    fixture.detectChanges();
  });

  it('renderiza o rótulo', () => {
    expect(fixture.nativeElement.textContent).toContain('E-mail');
  });

  it('não mostra mensagem de erro quando erro é null', () => {
    expect(fixture.nativeElement.querySelector('.campo__erro')).toBeNull();
  });

  it('mostra a mensagem de erro quando informada', () => {
    fixture.componentInstance.erro = 'Informe um e-mail válido.';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.campo__erro').textContent).toContain('Informe um e-mail válido.');
  });

  it('propaga digitação para o FormControl', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = 'jovem@rede.com';
    input.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.controle.value).toBe('jovem@rede.com');
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx ng test --watch=false --include='**/text-field.spec.ts'`
Expected: FAIL (`TextField` não existe)

- [ ] **Step 3: Implementar**

```typescript
// src/app/shared/ui/text-field/text-field.ts
import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-text-field',
  imports: [ReactiveFormsModule],
  templateUrl: './text-field.html',
  styleUrl: './text-field.scss',
})
export class TextField {
  readonly rotulo = input.required<string>();
  readonly tipo = input<'text' | 'email' | 'password' | 'tel'>('text');
  readonly controle = input.required<FormControl>();
  readonly erro = input<string | null>(null);
}
```

```html
<!-- src/app/shared/ui/text-field/text-field.html -->
<label class="campo">
  <span class="campo__rotulo">{{ rotulo() }}</span>
  <input class="campo__input" [class.campo__input--erro]="erro()" [type]="tipo()" [formControl]="controle()" />
  @if (erro()) {
    <span class="campo__erro" role="alert">{{ erro() }}</span>
  }
</label>
```

```scss
// src/app/shared/ui/text-field/text-field.scss
@use 'styles/tokens' as *;

.campo {
  display: flex;
  flex-direction: column;
  gap: var(--espaco-1);
  font-family: var(--fonte-corpo);
}

.campo__rotulo {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--rede-paper);
}

.campo__input {
  font-family: var(--fonte-corpo);
  font-size: 1rem;
  padding: var(--espaco-3) var(--espaco-4);
  border-radius: var(--raio-padrao);
  border: 1px solid rgba(246, 244, 236, 0.24);
  background: var(--rede-graphite);
  color: var(--rede-paper);

  &:focus {
    outline: none;
    border-color: var(--rede-yellow);
  }

  &--erro {
    border-color: var(--status-cancel);
  }
}

.campo__erro {
  font-size: 0.8125rem;
  color: var(--status-cancel);
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx ng test --watch=false --include='**/text-field.spec.ts'`
Expected: PASS (4 testes)

- [ ] **Step 5: Commit**

```bash
git add src/app/shared/ui/text-field
git commit -m "feat: componente TextField com estado de erro"
```

---

### Task 6: Componente SectionDivider (assinatura visual entrelaçada)

**Files:**
- Create: `src/app/shared/ui/section-divider/section-divider.ts`, `section-divider.html`, `section-divider.scss`

**Interfaces:**
- Consumes: nada além dos tokens
- Produces: `SectionDivider` (selector `app-section-divider`), sem inputs

Sem teste automatizado: é um componente puramente apresentacional (um SVG estático), sem lógica para verificar — a validação é visual (build + inspeção no navegador), consistente com a Task 2.

- [ ] **Step 1: Implementar**

```typescript
// src/app/shared/ui/section-divider/section-divider.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-section-divider',
  templateUrl: './section-divider.html',
  styleUrl: './section-divider.scss',
})
export class SectionDivider {}
```

```html
<!-- src/app/shared/ui/section-divider/section-divider.html -->
<svg class="divisor" viewBox="0 0 240 8" preserveAspectRatio="none" aria-hidden="true">
  <path d="M0 2 Q 20 2 20 5 T 40 5 T 60 2 T 80 2 T 100 5 T 120 5 T 140 2 T 160 2 T 180 5 T 200 5 T 220 2 T 240 2" />
  <path d="M0 6 Q 20 6 20 3 T 40 3 T 60 6 T 80 6 T 100 3 T 120 3 T 140 6 T 160 6 T 180 3 T 200 3 T 220 6 T 240 6" />
</svg>
```

```scss
// src/app/shared/ui/section-divider/section-divider.scss
:host {
  display: block;
  width: 100%;
}

.divisor {
  width: 100%;
  height: 8px;
  display: block;

  path {
    fill: none;
    stroke: var(--rede-yellow);
    stroke-width: 1;
    opacity: 0.4;
  }
}
```

- [ ] **Step 2: Verificar build**

Run: `npx ng build`
Expected: build conclui sem erros

- [ ] **Step 3: Commit**

```bash
git add src/app/shared/ui/section-divider
git commit -m "feat: componente SectionDivider (motivo entrelacado da marca)"
```

---

### Task 7: Componente EmptyState

**Files:**
- Create: `src/app/shared/ui/empty-state/empty-state.ts`, `empty-state.html`, `empty-state.scss`, `empty-state.spec.ts`

**Interfaces:**
- Consumes: `RouterLink` (Angular Router)
- Produces: `EmptyState` (selector `app-empty-state`), inputs `mensagem: string` (required), `textoAcao: string` (default `''`), `linkAcao: string` (default `''`)

- [ ] **Step 1: Escrever o teste**

```typescript
// src/app/shared/ui/empty-state/empty-state.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  let fixture: ComponentFixture<EmptyState>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyState],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(EmptyState);
  });

  it('renderiza a mensagem', () => {
    fixture.componentRef.setInput('mensagem', 'Você ainda não fez nenhum pedido.');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Você ainda não fez nenhum pedido.');
  });

  it('não renderiza link de ação quando textoAcao está vazio', () => {
    fixture.componentRef.setInput('mensagem', 'Nada por aqui.');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('a')).toBeNull();
  });

  it('renderiza o link de ação quando textoAcao e linkAcao são informados', () => {
    fixture.componentRef.setInput('mensagem', 'Nada por aqui.');
    fixture.componentRef.setInput('textoAcao', 'Ver a loja');
    fixture.componentRef.setInput('linkAcao', '/loja');
    fixture.detectChanges();
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    expect(link.textContent).toContain('Ver a loja');
    expect(link.getAttribute('href')).toBe('/loja');
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx ng test --watch=false --include='**/empty-state.spec.ts'`
Expected: FAIL (`EmptyState` não existe)

- [ ] **Step 3: Implementar**

```typescript
// src/app/shared/ui/empty-state/empty-state.ts
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  imports: [RouterLink],
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
})
export class EmptyState {
  readonly mensagem = input.required<string>();
  readonly textoAcao = input<string>('');
  readonly linkAcao = input<string>('');
}
```

```html
<!-- src/app/shared/ui/empty-state/empty-state.html -->
<div class="vazio">
  <p class="vazio__mensagem">{{ mensagem() }}</p>
  @if (textoAcao() && linkAcao()) {
    <a class="vazio__acao" [routerLink]="linkAcao()">{{ textoAcao() }}</a>
  }
</div>
```

```scss
// src/app/shared/ui/empty-state/empty-state.scss
@use 'styles/tokens' as *;

.vazio {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--espaco-3);
  padding: var(--espaco-6) 0;
}

.vazio__mensagem {
  font-family: var(--fonte-corpo);
  color: rgba(246, 244, 236, 0.72);
  margin: 0;
}

.vazio__acao {
  font-family: var(--fonte-corpo);
  font-weight: 700;
  color: var(--rede-yellow);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx ng test --watch=false --include='**/empty-state.spec.ts'`
Expected: PASS (3 testes)

- [ ] **Step 5: Commit**

```bash
git add src/app/shared/ui/empty-state
git commit -m "feat: componente EmptyState"
```

---

### Task 8: Modelo de usuário, mock store e AuthService

**Files:**
- Create: `src/app/core/mock/mock-latency.ts`
- Create: `src/app/core/auth/usuario.model.ts`, `auth-mock-store.ts`, `auth.service.ts`, `auth.service.spec.ts`

**Interfaces:**
- Consumes: nada de tasks de UI
- Produces:
  - `mockLatency<T>(valor: T, ms = 400): Promise<T>`
  - `type Papel = 'jovem' | 'admin'`
  - `interface Usuario { id: string; nome: string; email: string; telefone?: string; papel: Papel }`
  - `AuthService` (providedIn root): `usuarioAtual: Signal<Usuario | null>`, `estaAutenticado: Signal<boolean>`, `isAdmin: Signal<boolean>`, `login(email: string, senha: string): Promise<Usuario>` (rejeita com `Error('CREDENCIAIS_INVALIDAS')`), `cadastrar(dados: { nome: string; email: string; senha: string }): Promise<Usuario>` (rejeita com `Error('EMAIL_EM_USO')`), `recuperarSenha(email: string): Promise<void>`, `atualizarPerfil(dados: Partial<Pick<Usuario, 'nome' | 'email' | 'telefone'>>): Promise<Usuario>`, `logout(): void`

- [ ] **Step 1: Criar o helper de latência mockada**

```typescript
// src/app/core/mock/mock-latency.ts
export function mockLatency<T>(valor: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(valor), ms));
}
```

- [ ] **Step 2: Criar o modelo de usuário**

```typescript
// src/app/core/auth/usuario.model.ts
export type Papel = 'jovem' | 'admin';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  papel: Papel;
}
```

- [ ] **Step 3: Criar o mock store de usuários**

```typescript
// src/app/core/auth/auth-mock-store.ts
import { Usuario } from './usuario.model';

export interface UsuarioMock extends Usuario {
  senha: string;
}

export const USUARIOS_MOCK: UsuarioMock[] = [
  { id: '1', nome: 'Admin REDE', email: 'admin@rede.com', senha: 'admin123', papel: 'admin' },
  { id: '2', nome: 'Jovem Teste', email: 'jovem@rede.com', senha: 'jovem123', papel: 'jovem' },
];
```

- [ ] **Step 4: Escrever o teste do AuthService**

```typescript
// src/app/core/auth/auth.service.spec.ts
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { USUARIOS_MOCK } from './auth-mock-store';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  it('começa sem usuário autenticado', () => {
    expect(service.usuarioAtual()).toBeNull();
    expect(service.estaAutenticado()).toBeFalse();
  });

  it('login com credenciais corretas autentica o usuário', fakeAsync(() => {
    let usuario;
    service.login('jovem@rede.com', 'jovem123').then((u) => (usuario = u));
    tick(400);
    expect(usuario!.email).toBe('jovem@rede.com');
    expect(service.estaAutenticado()).toBeTrue();
    expect(service.isAdmin()).toBeFalse();
  }));

  it('login com senha errada rejeita com CREDENCIAIS_INVALIDAS', fakeAsync(() => {
    let erro: Error | undefined;
    service.login('jovem@rede.com', 'errada').catch((e) => (erro = e));
    tick(400);
    expect(erro?.message).toBe('CREDENCIAIS_INVALIDAS');
    expect(service.usuarioAtual()).toBeNull();
  }));

  it('login com admin marca isAdmin como true', fakeAsync(() => {
    service.login('admin@rede.com', 'admin123');
    tick(400);
    expect(service.isAdmin()).toBeTrue();
  }));

  it('cadastrar com e-mail novo cria e autentica o usuário como jovem', fakeAsync(() => {
    let usuario;
    service.cadastrar({ nome: 'Novo Jovem', email: 'novo@rede.com', senha: 'senha123' }).then((u) => (usuario = u));
    tick(400);
    expect(usuario!.papel).toBe('jovem');
    expect(service.estaAutenticado()).toBeTrue();
  }));

  it('cadastrar com e-mail já usado rejeita com EMAIL_EM_USO', fakeAsync(() => {
    let erro: Error | undefined;
    service.cadastrar({ nome: 'X', email: 'jovem@rede.com', senha: 'senha123' }).catch((e) => (erro = e));
    tick(400);
    expect(erro?.message).toBe('EMAIL_EM_USO');
  }));

  it('logout limpa o usuário atual', fakeAsync(() => {
    service.login('jovem@rede.com', 'jovem123');
    tick(400);
    service.logout();
    expect(service.usuarioAtual()).toBeNull();
    expect(service.estaAutenticado()).toBeFalse();
  }));

  it('persiste a sessão no localStorage e restaura em uma nova instância', fakeAsync(() => {
    service.login('jovem@rede.com', 'jovem123');
    tick(400);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const novaInstancia = TestBed.inject(AuthService);

    expect(novaInstancia.usuarioAtual()?.email).toBe('jovem@rede.com');
  }));

  it('atualizarPerfil altera os dados do usuário logado', fakeAsync(() => {
    service.login('jovem@rede.com', 'jovem123');
    tick(400);
    service.atualizarPerfil({ nome: 'Jovem Atualizado', telefone: '11999999999' });
    tick(400);
    expect(service.usuarioAtual()?.nome).toBe('Jovem Atualizado');
    expect(service.usuarioAtual()?.telefone).toBe('11999999999');
  }));

  afterEach(() => {
    USUARIOS_MOCK.splice(2);
  });
});
```

- [ ] **Step 5: Rodar e confirmar que falha**

Run: `npx ng test --watch=false --include='**/auth.service.spec.ts'`
Expected: FAIL (`AuthService` não existe)

- [ ] **Step 6: Implementar o AuthService**

```typescript
// src/app/core/auth/auth.service.ts
import { computed, Injectable, signal } from '@angular/core';
import { mockLatency } from '../mock/mock-latency';
import { USUARIOS_MOCK, UsuarioMock } from './auth-mock-store';
import { Usuario } from './usuario.model';

const CHAVE_SESSAO = 'rede_sessao_usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _usuarioAtual = signal<Usuario | null>(this.carregarSessao());

  readonly usuarioAtual = this._usuarioAtual.asReadonly();
  readonly estaAutenticado = computed(() => this._usuarioAtual() !== null);
  readonly isAdmin = computed(() => this._usuarioAtual()?.papel === 'admin');

  async login(email: string, senha: string): Promise<Usuario> {
    await mockLatency(undefined);
    const encontrado = USUARIOS_MOCK.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.senha === senha,
    );
    if (!encontrado) throw new Error('CREDENCIAIS_INVALIDAS');
    const usuario = this.paraUsuario(encontrado);
    this.definirSessao(usuario);
    return usuario;
  }

  async cadastrar(dados: { nome: string; email: string; senha: string }): Promise<Usuario> {
    await mockLatency(undefined);
    const jaExiste = USUARIOS_MOCK.some((u) => u.email.toLowerCase() === dados.email.toLowerCase());
    if (jaExiste) throw new Error('EMAIL_EM_USO');
    const novo: UsuarioMock = {
      id: String(USUARIOS_MOCK.length + 1),
      nome: dados.nome,
      email: dados.email,
      senha: dados.senha,
      papel: 'jovem',
    };
    USUARIOS_MOCK.push(novo);
    const usuario = this.paraUsuario(novo);
    this.definirSessao(usuario);
    return usuario;
  }

  async recuperarSenha(_email: string): Promise<void> {
    await mockLatency(undefined);
  }

  async atualizarPerfil(dados: Partial<Pick<Usuario, 'nome' | 'email' | 'telefone'>>): Promise<Usuario> {
    await mockLatency(undefined);
    const atual = this._usuarioAtual();
    if (!atual) throw new Error('NAO_AUTENTICADO');
    const atualizado: Usuario = { ...atual, ...dados };
    this.definirSessao(atualizado);
    return atualizado;
  }

  logout(): void {
    this.definirSessao(null);
  }

  private paraUsuario(usuarioMock: UsuarioMock): Usuario {
    const { senha: _senha, ...usuario } = usuarioMock;
    return usuario;
  }

  private definirSessao(usuario: Usuario | null): void {
    this._usuarioAtual.set(usuario);
    if (usuario) localStorage.setItem(CHAVE_SESSAO, JSON.stringify(usuario));
    else localStorage.removeItem(CHAVE_SESSAO);
  }

  private carregarSessao(): Usuario | null {
    const bruto = localStorage.getItem(CHAVE_SESSAO);
    if (!bruto) return null;
    try {
      return JSON.parse(bruto) as Usuario;
    } catch {
      return null;
    }
  }
}
```

- [ ] **Step 7: Rodar e confirmar que passa**

Run: `npx ng test --watch=false --include='**/auth.service.spec.ts'`
Expected: PASS (9 testes)

- [ ] **Step 8: Commit**

```bash
git add src/app/core
git commit -m "feat: AuthService mockado com sessao persistida"
```

---

### Task 9: Guards de rota (authGuard, adminGuard)

**Files:**
- Create: `src/app/core/auth/auth.guard.ts`, `auth.guard.spec.ts`

**Interfaces:**
- Consumes: `AuthService.estaAutenticado`, `AuthService.isAdmin` (Task 8)
- Produces: `authGuard: CanActivateFn`, `adminGuard: CanActivateFn`

- [ ] **Step 1: Escrever o teste**

```typescript
// src/app/core/auth/auth.guard.spec.ts
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { adminGuard, authGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('guards de autenticação', () => {
  let estaAutenticado: ReturnType<typeof signal<boolean>>;
  let isAdmin: ReturnType<typeof signal<boolean>>;
  let router: Router;

  beforeEach(() => {
    estaAutenticado = signal(false);
    isAdmin = signal(false);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { estaAutenticado, isAdmin } },
      ],
    });
    router = TestBed.inject(Router);
  });

  it('authGuard permite acesso quando autenticado', () => {
    estaAutenticado.set(true);
    const resultado = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    expect(resultado).toBeTrue();
  });

  it('authGuard redireciona para /login quando não autenticado', () => {
    const resultado = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    expect(resultado).toEqual(router.parseUrl('/login'));
  });

  it('adminGuard permite acesso quando admin', () => {
    isAdmin.set(true);
    const resultado = TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));
    expect(resultado).toBeTrue();
  });

  it('adminGuard redireciona para / quando não é admin', () => {
    const resultado = TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));
    expect(resultado).toEqual(router.parseUrl('/'));
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx ng test --watch=false --include='**/auth.guard.spec.ts'`
Expected: FAIL (`auth.guard` não existe)

- [ ] **Step 3: Implementar**

```typescript
// src/app/core/auth/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.estaAutenticado() ? true : router.parseUrl('/login');
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAdmin() ? true : router.parseUrl('/');
};
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx ng test --watch=false --include='**/auth.guard.spec.ts'`
Expected: PASS (4 testes)

- [ ] **Step 5: Commit**

```bash
git add src/app/core/auth/auth.guard.ts src/app/core/auth/auth.guard.spec.ts
git commit -m "feat: guards authGuard e adminGuard"
```

---

### Task 10: Validadores de senha

**Files:**
- Create: `src/app/shared/validators/senha.validators.ts`, `senha.validators.spec.ts`

**Interfaces:**
- Consumes: `@angular/forms` (`ValidatorFn`, `AbstractControl`)
- Produces: `senhaForte(): ValidatorFn` (erro `{ senhaFraca: true }` quando `< 8` caracteres), `senhasIguais(campoSenha: string, campoConfirmar: string): ValidatorFn` (erro de grupo `{ senhasDiferentes: true }`)

- [ ] **Step 1: Escrever o teste**

```typescript
// src/app/shared/validators/senha.validators.spec.ts
import { FormControl, FormGroup } from '@angular/forms';
import { senhaForte, senhasIguais } from './senha.validators';

describe('senhaForte', () => {
  it('retorna erro senhaFraca para senha com menos de 8 caracteres', () => {
    const controle = new FormControl('1234567');
    expect(senhaForte()(controle)).toEqual({ senhaFraca: true });
  });

  it('não retorna erro para senha com 8 ou mais caracteres', () => {
    const controle = new FormControl('12345678');
    expect(senhaForte()(controle)).toBeNull();
  });

  it('não retorna erro para campo vazio (deixa o Validators.required cuidar disso)', () => {
    const controle = new FormControl('');
    expect(senhaForte()(controle)).toBeNull();
  });
});

describe('senhasIguais', () => {
  it('retorna erro senhasDiferentes quando os campos não batem', () => {
    const grupo = new FormGroup({
      senha: new FormControl('abc12345'),
      confirmarSenha: new FormControl('abc12346'),
    });
    expect(senhasIguais('senha', 'confirmarSenha')(grupo)).toEqual({ senhasDiferentes: true });
  });

  it('não retorna erro quando os campos batem', () => {
    const grupo = new FormGroup({
      senha: new FormControl('abc12345'),
      confirmarSenha: new FormControl('abc12345'),
    });
    expect(senhasIguais('senha', 'confirmarSenha')(grupo)).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx ng test --watch=false --include='**/senha.validators.spec.ts'`
Expected: FAIL (`senha.validators` não existe)

- [ ] **Step 3: Implementar**

```typescript
// src/app/shared/validators/senha.validators.ts
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
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx ng test --watch=false --include='**/senha.validators.spec.ts'`
Expected: PASS (5 testes)

- [ ] **Step 5: Commit**

```bash
git add src/app/shared/validators
git commit -m "feat: validadores de senha forte e confirmacao"
```

---

### Task 11: Rotas do app e componente EmBreve

**Files:**
- Create: `src/app/shared/em-breve/em-breve.ts`, `em-breve.html`, `em-breve.scss`, `em-breve.spec.ts`
- Modify: `src/app/app.routes.ts`, `src/app/app.config.ts`

**Interfaces:**
- Consumes: `authGuard` (Task 9)
- Produces: `EmBreve` (selector `app-em-breve`), input `titulo: string` (default `''`, alimentado automaticamente pelo `data.titulo` da rota via `withComponentInputBinding`); rotas `''`, `'loja'`, `'eventos'` (→ `EmBreve`), rota `'perfil'` protegida por `authGuard` (carregada via lazy `import` — implementada na Task 18), rota `'sobre'` (lazy — implementada na Task 19)

- [ ] **Step 1: Escrever o teste do EmBreve**

```typescript
// src/app/shared/em-breve/em-breve.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmBreve } from './em-breve';

describe('EmBreve', () => {
  let fixture: ComponentFixture<EmBreve>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [EmBreve] }).compileComponents();
    fixture = TestBed.createComponent(EmBreve);
  });

  it('mostra o título informado', () => {
    fixture.componentRef.setInput('titulo', 'Loja');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Loja');
    expect(fixture.nativeElement.textContent).toContain('em breve');
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx ng test --watch=false --include='**/em-breve.spec.ts'`
Expected: FAIL (`EmBreve` não existe)

- [ ] **Step 3: Implementar o EmBreve**

```typescript
// src/app/shared/em-breve/em-breve.ts
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-em-breve',
  templateUrl: './em-breve.html',
  styleUrl: './em-breve.scss',
})
export class EmBreve {
  readonly titulo = input<string>('');
}
```

```html
<!-- src/app/shared/em-breve/em-breve.html -->
<div class="em-breve">
  <h1 class="titulo-1">{{ titulo() }}</h1>
  <p class="texto-corpo">Essa área está em breve por aqui. Estamos construindo com carinho — volta logo!</p>
</div>
```

```scss
// src/app/shared/em-breve/em-breve.scss
.em-breve {
  padding: var(--espaco-8) var(--espaco-4);
  text-align: center;
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx ng test --watch=false --include='**/em-breve.spec.ts'`
Expected: PASS (1 teste)

- [ ] **Step 5: Configurar `withComponentInputBinding` em `app.config.ts`**

```typescript
// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes, withComponentInputBinding())],
};
```

- [ ] **Step 6: Definir as rotas em `app.routes.ts`**

```typescript
// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      { path: '', loadComponent: () => import('./shared/em-breve/em-breve').then((m) => m.EmBreve), data: { titulo: 'Início' } },
      { path: 'loja', loadComponent: () => import('./shared/em-breve/em-breve').then((m) => m.EmBreve), data: { titulo: 'Loja' } },
      { path: 'eventos', loadComponent: () => import('./shared/em-breve/em-breve').then((m) => m.EmBreve), data: { titulo: 'Eventos' } },
      { path: 'sobre', loadComponent: () => import('./features/institucional/sobre/sobre').then((m) => m.Sobre) },
      { path: 'perfil', canActivate: [authGuard], loadComponent: () => import('./features/perfil/perfil').then((m) => m.Perfil) },
    ],
  },
  {
    path: '',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
```

Nota: `Shell`, `Sobre` e `Perfil` só existem a partir das Tasks 14, 19 e 18 — o build só vai compilar de fato depois delas. Isso é esperado: as tasks de rota e de shell caminham juntas nesta fase.

- [ ] **Step 7: Commit**

```bash
git add src/app/shared/em-breve src/app/app.routes.ts src/app/app.config.ts
git commit -m "feat: rotas do app e componente EmBreve"
```

---

### Task 12: Componente Header

**Files:**
- Create: `src/app/layout/header/header.ts`, `header.html`, `header.scss`, `header.spec.ts`

**Interfaces:**
- Consumes: `AuthService.estaAutenticado` (Task 8), `Logo` (Task 3)
- Produces: `Header` (selector `app-header`)

- [ ] **Step 1: Escrever o teste**

```typescript
// src/app/layout/header/header.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { Header } from './header';
import { AuthService } from '../../core/auth/auth.service';

describe('Header', () => {
  let fixture: ComponentFixture<Header>;
  let estaAutenticado: ReturnType<typeof signal<boolean>>;

  beforeEach(async () => {
    estaAutenticado = signal(false);
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([]), { provide: AuthService, useValue: { estaAutenticado } }],
    }).compileComponents();
    fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
  });

  it('link de perfil aponta para /login quando não autenticado', () => {
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('[data-testid="link-perfil"]');
    expect(link.getAttribute('href')).toBe('/login');
  });

  it('link de perfil aponta para /perfil quando autenticado', () => {
    estaAutenticado.set(true);
    fixture.detectChanges();
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('[data-testid="link-perfil"]');
    expect(link.getAttribute('href')).toBe('/perfil');
  });

  it('mostra a logo e os links de navegação', () => {
    expect(fixture.nativeElement.querySelector('app-logo')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Loja');
    expect(fixture.nativeElement.textContent).toContain('Eventos');
    expect(fixture.nativeElement.textContent).toContain('Sobre');
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx ng test --watch=false --include='**/header.spec.ts'`
Expected: FAIL (`Header` não existe)

- [ ] **Step 3: Implementar**

```typescript
// src/app/layout/header/header.ts
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Logo } from '../../shared/ui/logo/logo';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, Logo],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private readonly auth = inject(AuthService);
  protected readonly estaAutenticado = this.auth.estaAutenticado;
}
```

```html
<!-- src/app/layout/header/header.html -->
<header class="cabecalho">
  <a routerLink="/" class="cabecalho__marca">
    <app-logo variante="amarelo-transparente" tamanho="32px" />
    <span class="cabecalho__nome">REDE</span>
  </a>

  <nav class="cabecalho__nav">
    <a routerLink="/loja" routerLinkActive="cabecalho__link--ativo">Loja</a>
    <a routerLink="/eventos" routerLinkActive="cabecalho__link--ativo">Eventos</a>
    <a routerLink="/sobre" routerLinkActive="cabecalho__link--ativo">Sobre</a>
  </nav>

  <div class="cabecalho__acoes">
    <a routerLink="/loja" class="cabecalho__icone" aria-label="Carrinho">🛒</a>
    <a
      data-testid="link-perfil"
      [routerLink]="estaAutenticado() ? '/perfil' : '/login'"
      class="cabecalho__icone"
      aria-label="Perfil"
    >
      👤
    </a>
  </div>
</header>
```

```scss
// src/app/layout/header/header.scss
@use 'styles/tokens' as *;
@use 'styles/mixins' as *;

.cabecalho {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--espaco-3) var(--espaco-4);
  background: var(--rede-black);
  border-bottom: 1px solid rgba(246, 244, 236, 0.08);
}

.cabecalho__marca {
  display: flex;
  align-items: center;
  gap: var(--espaco-2);
  color: var(--rede-paper);
  text-decoration: none;
}

.cabecalho__nome {
  font-family: var(--fonte-display);
  font-weight: 800;
  letter-spacing: 0.04em;
}

.cabecalho__nav {
  display: none;
  gap: var(--espaco-6);

  a {
    color: var(--rede-paper);
    text-decoration: none;
    font-weight: 600;
  }

  .cabecalho__link--ativo {
    color: var(--rede-yellow);
  }

  @include desktop {
    display: flex;
  }
}

.cabecalho__acoes {
  display: flex;
  gap: var(--espaco-4);
}

.cabecalho__icone {
  font-size: 1.25rem;
  text-decoration: none;
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx ng test --watch=false --include='**/header.spec.ts'`
Expected: PASS (3 testes)

- [ ] **Step 5: Commit**

```bash
git add src/app/layout/header
git commit -m "feat: componente Header (nav desktop + mobile)"
```

---

### Task 13: Componente BottomNav

**Files:**
- Create: `src/app/layout/bottom-nav/bottom-nav.ts`, `bottom-nav.html`, `bottom-nav.scss`, `bottom-nav.spec.ts`

**Interfaces:**
- Consumes: nada além do Router
- Produces: `BottomNav` (selector `app-bottom-nav`)

- [ ] **Step 1: Escrever o teste**

```typescript
// src/app/layout/bottom-nav/bottom-nav.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BottomNav } from './bottom-nav';

describe('BottomNav', () => {
  let fixture: ComponentFixture<BottomNav>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottomNav],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(BottomNav);
    fixture.detectChanges();
  });

  it('renderiza os 4 destinos principais', () => {
    const links: NodeListOf<HTMLAnchorElement> = fixture.nativeElement.querySelectorAll('a');
    const hrefs = Array.from(links).map((l) => l.getAttribute('href'));
    expect(hrefs).toEqual(['/', '/loja', '/eventos', '/perfil']);
  });

  it('mostra os rótulos corretos', () => {
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Início');
    expect(texto).toContain('Loja');
    expect(texto).toContain('Eventos');
    expect(texto).toContain('Perfil');
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx ng test --watch=false --include='**/bottom-nav.spec.ts'`
Expected: FAIL (`BottomNav` não existe)

- [ ] **Step 3: Implementar**

```typescript
// src/app/layout/bottom-nav/bottom-nav.ts
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './bottom-nav.html',
  styleUrl: './bottom-nav.scss',
})
export class BottomNav {}
```

```html
<!-- src/app/layout/bottom-nav/bottom-nav.html -->
<nav class="nav-inferior">
  <a routerLink="/" routerLinkActive="nav-inferior__item--ativo" [routerLinkActiveOptions]="{ exact: true }">
    <span aria-hidden="true">🏠</span>
    <span>Início</span>
  </a>
  <a routerLink="/loja" routerLinkActive="nav-inferior__item--ativo">
    <span aria-hidden="true">🛍️</span>
    <span>Loja</span>
  </a>
  <a routerLink="/eventos" routerLinkActive="nav-inferior__item--ativo">
    <span aria-hidden="true">🎟️</span>
    <span>Eventos</span>
  </a>
  <a routerLink="/perfil" routerLinkActive="nav-inferior__item--ativo">
    <span aria-hidden="true">👤</span>
    <span>Perfil</span>
  </a>
</nav>
```

```scss
// src/app/layout/bottom-nav/bottom-nav.scss
@use 'styles/tokens' as *;
@use 'styles/mixins' as *;

.nav-inferior {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  background: var(--rede-graphite);
  border-top: 1px solid rgba(246, 244, 236, 0.08);
  padding: var(--espaco-2) 0;

  a {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    font-size: 0.6875rem;
    color: rgba(246, 244, 236, 0.6);
    text-decoration: none;
  }

  &__item--ativo {
    color: var(--rede-yellow) !important;
  }

  @include desktop {
    display: none;
  }
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx ng test --watch=false --include='**/bottom-nav.spec.ts'`
Expected: PASS (2 testes)

- [ ] **Step 5: Commit**

```bash
git add src/app/layout/bottom-nav
git commit -m "feat: componente BottomNav (barra inferior mobile)"
```

---

### Task 14: Footer e montagem do Shell

**Files:**
- Create: `src/app/layout/footer/footer.ts`, `footer.html`, `footer.scss`
- Create: `src/app/layout/shell/shell.ts`, `shell.html`, `shell.scss`, `shell.spec.ts`

**Interfaces:**
- Consumes: `Header` (Task 12), `BottomNav` (Task 13), `Logo` (Task 3)
- Produces: `Footer` (selector `app-footer`, sem inputs), `Shell` (selector `app-shell`) — layout usado como componente pai das rotas não autenticadas no `app.routes.ts` (Task 11)

Footer não tem teste dedicado (conteúdo estático, sem lógica) pelo mesmo motivo da Task 6.

- [ ] **Step 1: Implementar o Footer**

```typescript
// src/app/layout/footer/footer.ts
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Logo } from '../../shared/ui/logo/logo';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, Logo],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {}
```

```html
<!-- src/app/layout/footer/footer.html -->
<footer class="rodape">
  <app-logo variante="amarelo-transparente" tamanho="28px" />
  <nav class="rodape__links">
    <a routerLink="/sobre">Sobre a REDE</a>
  </nav>
  <p class="rodape__horario">Horário de encontro: em breve por aqui.</p>
</footer>
```

```scss
// src/app/layout/footer/footer.scss
@use 'styles/tokens' as *;

.rodape {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--espaco-3);
  padding: var(--espaco-8) var(--espaco-4) calc(var(--espaco-8) + 56px);
  text-align: center;
  color: rgba(246, 244, 236, 0.6);
  font-size: 0.875rem;
}

.rodape__links a {
  color: var(--rede-paper);
  text-decoration: none;
}
```

- [ ] **Step 2: Escrever o teste do Shell**

```typescript
// src/app/layout/shell/shell.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { Shell } from './shell';
import { AuthService } from '../../core/auth/auth.service';

describe('Shell', () => {
  let fixture: ComponentFixture<Shell>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { estaAutenticado: signal(false) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Shell);
    fixture.detectChanges();
  });

  it('renderiza header, bottom-nav, router-outlet e footer', () => {
    expect(fixture.nativeElement.querySelector('app-header')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-bottom-nav')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('router-outlet')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-footer')).not.toBeNull();
  });
});
```

- [ ] **Step 3: Rodar e confirmar que falha**

Run: `npx ng test --watch=false --include='**/shell.spec.ts'`
Expected: FAIL (`Shell` não existe)

- [ ] **Step 4: Implementar o Shell**

```typescript
// src/app/layout/shell/shell.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../header/header';
import { BottomNav } from '../bottom-nav/bottom-nav';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Header, BottomNav, Footer],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {}
```

```html
<!-- src/app/layout/shell/shell.html -->
<app-header />
<main class="conteudo">
  <router-outlet />
</main>
<app-footer />
<app-bottom-nav />
```

```scss
// src/app/layout/shell/shell.scss
.conteudo {
  min-height: 60vh;
}
```

- [ ] **Step 5: Rodar e confirmar que passa**

Run: `npx ng test --watch=false --include='**/shell.spec.ts'`
Expected: PASS (1 teste)

- [ ] **Step 6: Verificar build completo do app**

Run: `npx ng build`
Expected: build conclui sem erros (a Task 11 já referenciava `Shell`, `Sobre` e `Perfil`; `Sobre` e `Perfil` ainda faltam — se o build falhar por causa delas, é esperado até a Task 18/19; se falhar por qualquer outro motivo, corrigir antes de prosseguir)

- [ ] **Step 7: Commit**

```bash
git add src/app/layout/footer src/app/layout/shell
git commit -m "feat: Footer e montagem do Shell (header + conteudo + footer + bottom-nav)"
```

---

### Task 15: Tela de Login

**Files:**
- Create: `src/app/features/auth/login/login.ts`, `login.html`, `login.scss`, `login.spec.ts`
- Create: `src/app/features/auth/auth.routes.ts`
- Create: `src/styles/_auth.scss` (parcial compartilhado pelo layout de cartão de auth — reutilizado nas Tasks 16 e 17)

**Interfaces:**
- Consumes: `AuthService.login` (Task 8), `TextField` (Task 5), `Button` (Task 4), `Logo` (Task 3)
- Produces: `Login` (selector `app-login`), rota `'login'` em `AUTH_ROUTES`, parcial `styles/auth` (classes `.tela-auth`, `.cartao-auth`, `.cartao-auth__erro`, `.cartao-auth__links`) para reuso em Cadastro e RecuperarSenha

- [ ] **Step 1: Escrever o teste**

```typescript
// src/app/features/auth/login/login.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Login } from './login';
import { AuthService } from '../../../core/auth/auth.service';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let authServiceFalso: jasmine.SpyObj<Pick<AuthService, 'login'>>;
  let router: Router;

  beforeEach(async () => {
    authServiceFalso = jasmine.createSpyObj('AuthService', ['login']);
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceFalso }],
    }).compileComponents();
    fixture = TestBed.createComponent(Login);
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    fixture.detectChanges();
  });

  it('não chama login e marca os campos como tocados ao enviar formulário vazio', () => {
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    expect(authServiceFalso.login).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelectorAll('.campo__erro').length).toBeGreaterThan(0);
  });

  it('faz login e navega para / quando as credenciais são válidas', async () => {
    authServiceFalso.login.and.resolveTo({ id: '1', nome: 'Jovem', email: 'jovem@rede.com', papel: 'jovem' });
    fixture.componentInstance['form'].setValue({ email: 'jovem@rede.com', senha: 'jovem123' });
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(authServiceFalso.login).toHaveBeenCalledWith('jovem@rede.com', 'jovem123');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('mostra mensagem de erro quando o login falha', async () => {
    authServiceFalso.login.and.rejectWith(new Error('CREDENCIAIS_INVALIDAS'));
    fixture.componentInstance['form'].setValue({ email: 'jovem@rede.com', senha: 'errada' });
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('E-mail ou senha incorretos');
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx ng test --watch=false --include='**/login.spec.ts'`
Expected: FAIL (`Login` não existe)

- [ ] **Step 3: Implementar**

```typescript
// src/app/features/auth/login/login.ts
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { TextField } from '../../../shared/ui/text-field/text-field';
import { Button } from '../../../shared/ui/button/button';
import { Logo } from '../../../shared/ui/logo/logo';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, TextField, Button, Logo],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required]],
  });

  protected readonly enviando = signal(false);
  protected readonly erroGeral = signal<string | null>(null);

  protected get erroEmail(): string {
    const c = this.form.controls.email;
    if (c.touched && c.hasError('required')) return 'Informe seu e-mail.';
    if (c.touched && c.hasError('email')) return 'Informe um e-mail válido.';
    return '';
  }

  protected get erroSenha(): string {
    const c = this.form.controls.senha;
    if (c.touched && c.hasError('required')) return 'Informe sua senha.';
    return '';
  }

  protected async aoEnviar(): Promise<void> {
    if (this.form.invalid || this.enviando()) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.erroGeral.set(null);
    const { email, senha } = this.form.getRawValue();
    try {
      await this.auth.login(email, senha);
      this.router.navigateByUrl('/');
    } catch {
      this.erroGeral.set('E-mail ou senha incorretos. Confira e tente de novo.');
    } finally {
      this.enviando.set(false);
    }
  }
}
```

```html
<!-- src/app/features/auth/login/login.html -->
<div class="tela-auth">
  <form class="cartao-auth" [formGroup]="form" (ngSubmit)="aoEnviar()">
    <app-logo variante="amarelo-transparente" tamanho="56px" />
    <h1 class="titulo-1">Entrar na REDE</h1>
    <p class="texto-corpo">Acesse pra ver seus pedidos, inscrições e o que rolar por aí.</p>

    <app-text-field rotulo="E-mail" tipo="email" [controle]="form.controls.email" [erro]="erroEmail" />
    <app-text-field rotulo="Senha" tipo="password" [controle]="form.controls.senha" [erro]="erroSenha" />

    @if (erroGeral()) {
      <p class="cartao-auth__erro" role="alert">{{ erroGeral() }}</p>
    }

    <app-button tipo="submit" [carregando]="enviando()">Entrar</app-button>

    <div class="cartao-auth__links">
      <a routerLink="/recuperar-senha">Esqueci minha senha</a>
      <a routerLink="/cadastro">Criar conta</a>
    </div>
  </form>
</div>
```

```scss
// src/app/features/auth/login/login.scss
@use 'styles/auth' as *;
```

- [ ] **Step 4: Criar o parcial compartilhado do layout de autenticação**

```scss
// src/styles/_auth.scss
.tela-auth {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--espaco-5);
}

.cartao-auth {
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--espaco-4);
  text-align: center;

  app-text-field {
    width: 100%;
    text-align: left;
  }
}

.cartao-auth__erro {
  color: var(--status-cancel);
  font-size: 0.875rem;
  margin: 0;
}

.cartao-auth__links {
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-size: 0.875rem;

  a {
    color: var(--rede-paper);
  }
}
```

- [ ] **Step 5: Criar `AUTH_ROUTES` com a rota de login**

```typescript
// src/app/features/auth/auth.routes.ts
import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  { path: 'login', loadComponent: () => import('./login/login').then((m) => m.Login) },
];
```

- [ ] **Step 6: Rodar e confirmar que passa**

Run: `npx ng test --watch=false --include='**/login.spec.ts'`
Expected: PASS (3 testes)

- [ ] **Step 7: Commit**

```bash
git add src/app/features/auth src/styles/_auth.scss
git commit -m "feat: tela de Login e parcial compartilhado de auth"
```

---

### Task 16: Tela de Cadastro

**Files:**
- Create: `src/app/features/auth/cadastro/cadastro.ts`, `cadastro.html`, `cadastro.scss`, `cadastro.spec.ts`
- Modify: `src/app/features/auth/auth.routes.ts`

**Interfaces:**
- Consumes: `AuthService.cadastrar` (Task 8), `senhaForte`/`senhasIguais` (Task 10), `TextField`/`Button`/`Logo`, parcial `styles/auth` (Task 15)
- Produces: `Cadastro` (selector `app-cadastro`), rota `'cadastro'` em `AUTH_ROUTES`

- [ ] **Step 1: Escrever o teste**

```typescript
// src/app/features/auth/cadastro/cadastro.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Cadastro } from './cadastro';
import { AuthService } from '../../../core/auth/auth.service';

describe('Cadastro', () => {
  let fixture: ComponentFixture<Cadastro>;
  let authServiceFalso: jasmine.SpyObj<Pick<AuthService, 'cadastrar'>>;
  let router: Router;

  beforeEach(async () => {
    authServiceFalso = jasmine.createSpyObj('AuthService', ['cadastrar']);
    await TestBed.configureTestingModule({
      imports: [Cadastro],
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceFalso }],
    }).compileComponents();
    fixture = TestBed.createComponent(Cadastro);
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    fixture.detectChanges();
  });

  it('mostra erro quando as senhas não coincidem', () => {
    fixture.componentInstance['form'].setValue({
      nome: 'Jovem Novo',
      email: 'novo@rede.com',
      senha: 'senha1234',
      confirmarSenha: 'senha1235',
    });
    fixture.componentInstance['form'].markAllAsTouched();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('As senhas não coincidem');
    expect(authServiceFalso.cadastrar).not.toHaveBeenCalled();
  });

  it('cadastra e navega para / quando os dados são válidos', async () => {
    authServiceFalso.cadastrar.and.resolveTo({ id: '3', nome: 'Jovem Novo', email: 'novo@rede.com', papel: 'jovem' });
    fixture.componentInstance['form'].setValue({
      nome: 'Jovem Novo',
      email: 'novo@rede.com',
      senha: 'senha1234',
      confirmarSenha: 'senha1234',
    });
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(authServiceFalso.cadastrar).toHaveBeenCalledWith({
      nome: 'Jovem Novo',
      email: 'novo@rede.com',
      senha: 'senha1234',
    });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('mostra mensagem específica quando o e-mail já está em uso', async () => {
    authServiceFalso.cadastrar.and.rejectWith(new Error('EMAIL_EM_USO'));
    fixture.componentInstance['form'].setValue({
      nome: 'Jovem Novo',
      email: 'jovem@rede.com',
      senha: 'senha1234',
      confirmarSenha: 'senha1234',
    });
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Esse e-mail já está cadastrado');
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx ng test --watch=false --include='**/cadastro.spec.ts'`
Expected: FAIL (`Cadastro` não existe)

- [ ] **Step 3: Implementar**

```typescript
// src/app/features/auth/cadastro/cadastro.ts
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { senhaForte, senhasIguais } from '../../../shared/validators/senha.validators';
import { TextField } from '../../../shared/ui/text-field/text-field';
import { Button } from '../../../shared/ui/button/button';
import { Logo } from '../../../shared/ui/logo/logo';

@Component({
  selector: 'app-cadastro',
  imports: [ReactiveFormsModule, RouterLink, TextField, Button, Logo],
  templateUrl: './cadastro.html',
  styleUrl: './cadastro.scss',
})
export class Cadastro {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = this.fb.nonNullable.group(
    {
      nome: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, senhaForte()]],
      confirmarSenha: ['', [Validators.required]],
    },
    { validators: senhasIguais('senha', 'confirmarSenha') },
  );

  protected readonly enviando = signal(false);
  protected readonly erroGeral = signal<string | null>(null);

  protected get erroNome(): string {
    const c = this.form.controls.nome;
    return c.touched && c.invalid ? 'Informe seu nome.' : '';
  }

  protected get erroEmail(): string {
    const c = this.form.controls.email;
    if (c.touched && c.hasError('required')) return 'Informe seu e-mail.';
    if (c.touched && c.hasError('email')) return 'Informe um e-mail válido.';
    return '';
  }

  protected get erroSenha(): string {
    const c = this.form.controls.senha;
    if (c.touched && c.hasError('required')) return 'Crie uma senha.';
    if (c.touched && c.hasError('senhaFraca')) return 'A senha precisa ter pelo menos 8 caracteres.';
    return '';
  }

  protected get erroConfirmarSenha(): string {
    if (!this.form.controls.confirmarSenha.touched) return '';
    if (this.form.controls.confirmarSenha.hasError('required')) return 'Confirme sua senha.';
    if (this.form.hasError('senhasDiferentes')) return 'As senhas não coincidem.';
    return '';
  }

  protected async aoEnviar(): Promise<void> {
    if (this.form.invalid || this.enviando()) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.erroGeral.set(null);
    const { nome, email, senha } = this.form.getRawValue();
    try {
      await this.auth.cadastrar({ nome, email, senha });
      this.router.navigateByUrl('/');
    } catch (erro) {
      this.erroGeral.set(
        erro instanceof Error && erro.message === 'EMAIL_EM_USO'
          ? 'Esse e-mail já está cadastrado. Tenta entrar em vez de criar conta de novo.'
          : 'Não deu pra criar sua conta agora. Tenta de novo em instantes.',
      );
    } finally {
      this.enviando.set(false);
    }
  }
}
```

```html
<!-- src/app/features/auth/cadastro/cadastro.html -->
<div class="tela-auth">
  <form class="cartao-auth" [formGroup]="form" (ngSubmit)="aoEnviar()">
    <app-logo variante="amarelo-transparente" tamanho="56px" />
    <h1 class="titulo-1">Criar conta</h1>
    <p class="texto-corpo">Cria sua conta pra comprar na loja e se inscrever nos eventos da REDE.</p>

    <app-text-field rotulo="Nome" [controle]="form.controls.nome" [erro]="erroNome" />
    <app-text-field rotulo="E-mail" tipo="email" [controle]="form.controls.email" [erro]="erroEmail" />
    <app-text-field rotulo="Senha" tipo="password" [controle]="form.controls.senha" [erro]="erroSenha" />
    <app-text-field
      rotulo="Confirmar senha"
      tipo="password"
      [controle]="form.controls.confirmarSenha"
      [erro]="erroConfirmarSenha"
    />

    @if (erroGeral()) {
      <p class="cartao-auth__erro" role="alert">{{ erroGeral() }}</p>
    }

    <app-button tipo="submit" [carregando]="enviando()">Criar conta</app-button>

    <div class="cartao-auth__links">
      <a routerLink="/login">Já tenho conta</a>
    </div>
  </form>
</div>
```

```scss
// src/app/features/auth/cadastro/cadastro.scss
@use 'styles/auth' as *;
```

- [ ] **Step 4: Adicionar a rota de cadastro**

```typescript
// src/app/features/auth/auth.routes.ts
import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  { path: 'login', loadComponent: () => import('./login/login').then((m) => m.Login) },
  { path: 'cadastro', loadComponent: () => import('./cadastro/cadastro').then((m) => m.Cadastro) },
];
```

- [ ] **Step 5: Rodar e confirmar que passa**

Run: `npx ng test --watch=false --include='**/cadastro.spec.ts'`
Expected: PASS (3 testes)

- [ ] **Step 6: Commit**

```bash
git add src/app/features/auth
git commit -m "feat: tela de Cadastro"
```

---

### Task 17: Tela de Recuperar senha

**Files:**
- Create: `src/app/features/auth/recuperar-senha/recuperar-senha.ts`, `recuperar-senha.html`, `recuperar-senha.scss`, `recuperar-senha.spec.ts`
- Modify: `src/app/features/auth/auth.routes.ts`

**Interfaces:**
- Consumes: `AuthService.recuperarSenha` (Task 8), `TextField`/`Button`/`Logo`, parcial `styles/auth` (Task 15)
- Produces: `RecuperarSenha` (selector `app-recuperar-senha`), rota `'recuperar-senha'` em `AUTH_ROUTES`

- [ ] **Step 1: Escrever o teste**

```typescript
// src/app/features/auth/recuperar-senha/recuperar-senha.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RecuperarSenha } from './recuperar-senha';
import { AuthService } from '../../../core/auth/auth.service';

describe('RecuperarSenha', () => {
  let fixture: ComponentFixture<RecuperarSenha>;
  let authServiceFalso: jasmine.SpyObj<Pick<AuthService, 'recuperarSenha'>>;

  beforeEach(async () => {
    authServiceFalso = jasmine.createSpyObj('AuthService', ['recuperarSenha']);
    authServiceFalso.recuperarSenha.and.resolveTo();
    await TestBed.configureTestingModule({
      imports: [RecuperarSenha],
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceFalso }],
    }).compileComponents();
    fixture = TestBed.createComponent(RecuperarSenha);
    fixture.detectChanges();
  });

  it('não envia quando o e-mail é inválido', () => {
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    expect(authServiceFalso.recuperarSenha).not.toHaveBeenCalled();
  });

  it('mostra a confirmação após envio com e-mail válido', async () => {
    fixture.componentInstance['form'].setValue({ email: 'jovem@rede.com' });
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(authServiceFalso.recuperarSenha).toHaveBeenCalledWith('jovem@rede.com');
    expect(fixture.nativeElement.textContent).toContain('enviamos um link');
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx ng test --watch=false --include='**/recuperar-senha.spec.ts'`
Expected: FAIL (`RecuperarSenha` não existe)

- [ ] **Step 3: Implementar**

```typescript
// src/app/features/auth/recuperar-senha/recuperar-senha.ts
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { TextField } from '../../../shared/ui/text-field/text-field';
import { Button } from '../../../shared/ui/button/button';
import { Logo } from '../../../shared/ui/logo/logo';

@Component({
  selector: 'app-recuperar-senha',
  imports: [ReactiveFormsModule, RouterLink, TextField, Button, Logo],
  templateUrl: './recuperar-senha.html',
  styleUrl: './recuperar-senha.scss',
})
export class RecuperarSenha {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected readonly enviando = signal(false);
  protected readonly enviado = signal(false);

  protected get erroEmail(): string {
    const c = this.form.controls.email;
    if (c.touched && c.hasError('required')) return 'Informe seu e-mail.';
    if (c.touched && c.hasError('email')) return 'Informe um e-mail válido.';
    return '';
  }

  protected async aoEnviar(): Promise<void> {
    if (this.form.invalid || this.enviando()) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    await this.auth.recuperarSenha(this.form.getRawValue().email);
    this.enviando.set(false);
    this.enviado.set(true);
  }
}
```

```html
<!-- src/app/features/auth/recuperar-senha/recuperar-senha.html -->
<div class="tela-auth">
  <div class="cartao-auth">
    <app-logo variante="amarelo-transparente" tamanho="56px" />

    @if (!enviado()) {
      <form [formGroup]="form" (ngSubmit)="aoEnviar()" class="cartao-auth">
        <h1 class="titulo-1">Recuperar senha</h1>
        <p class="texto-corpo">Informa seu e-mail e a gente te ajuda a voltar pra conta.</p>
        <app-text-field rotulo="E-mail" tipo="email" [controle]="form.controls.email" [erro]="erroEmail" />
        <app-button tipo="submit" [carregando]="enviando()">Enviar link</app-button>
      </form>
    } @else {
      <h1 class="titulo-1">Confira seu e-mail</h1>
      <p class="texto-corpo">Se esse e-mail existir na nossa base, enviamos um link de recuperação. Confira sua caixa de entrada.</p>
    }

    <div class="cartao-auth__links">
      <a routerLink="/login">Voltar pro login</a>
    </div>
  </div>
</div>
```

```scss
// src/app/features/auth/recuperar-senha/recuperar-senha.scss
@use 'styles/auth' as *;
```

- [ ] **Step 4: Adicionar a rota de recuperação de senha**

```typescript
// src/app/features/auth/auth.routes.ts
import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  { path: 'login', loadComponent: () => import('./login/login').then((m) => m.Login) },
  { path: 'cadastro', loadComponent: () => import('./cadastro/cadastro').then((m) => m.Cadastro) },
  { path: 'recuperar-senha', loadComponent: () => import('./recuperar-senha/recuperar-senha').then((m) => m.RecuperarSenha) },
];
```

- [ ] **Step 5: Rodar e confirmar que passa**

Run: `npx ng test --watch=false --include='**/recuperar-senha.spec.ts'`
Expected: PASS (2 testes)

- [ ] **Step 6: Commit**

```bash
git add src/app/features/auth
git commit -m "feat: tela de Recuperar senha"
```

---

### Task 18: Tela de Perfil

**Files:**
- Create: `src/app/features/perfil/perfil.ts`, `perfil.html`, `perfil.scss`, `perfil.spec.ts`

**Interfaces:**
- Consumes: `AuthService.usuarioAtual`/`atualizarPerfil`/`logout` (Task 8), `TextField`/`Button`/`EmptyState`
- Produces: `Perfil` (selector `app-perfil`) — já referenciado em `app.routes.ts` (Task 11)

- [ ] **Step 1: Escrever o teste**

```typescript
// src/app/features/perfil/perfil.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { Perfil } from './perfil';
import { AuthService } from '../../core/auth/auth.service';

describe('Perfil', () => {
  let fixture: ComponentFixture<Perfil>;
  let authServiceFalso: jasmine.SpyObj<Pick<AuthService, 'atualizarPerfil' | 'logout'>> & {
    usuarioAtual: ReturnType<typeof signal>;
  };
  let router: Router;

  beforeEach(async () => {
    authServiceFalso = {
      usuarioAtual: signal({ id: '2', nome: 'Jovem Teste', email: 'jovem@rede.com', papel: 'jovem' as const }),
      atualizarPerfil: jasmine.createSpy('atualizarPerfil').and.resolveTo(),
      logout: jasmine.createSpy('logout'),
    };
    await TestBed.configureTestingModule({
      imports: [Perfil],
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceFalso }],
    }).compileComponents();
    fixture = TestBed.createComponent(Perfil);
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    fixture.detectChanges();
  });

  it('preenche o formulário com os dados do usuário atual', () => {
    expect(fixture.componentInstance['form'].value.nome).toBe('Jovem Teste');
    expect(fixture.componentInstance['form'].value.email).toBe('jovem@rede.com');
  });

  it('mostra estados vazios de pedidos e eventos', () => {
    expect(fixture.nativeElement.textContent).toContain('nenhum pedido');
    expect(fixture.nativeElement.textContent).toContain('nenhum evento');
  });

  it('chama atualizarPerfil ao salvar', async () => {
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(authServiceFalso.atualizarPerfil).toHaveBeenCalled();
  });

  it('faz logout e navega para /login', () => {
    fixture.nativeElement.querySelector('[data-testid="botao-sair"]').click();
    expect(authServiceFalso.logout).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx ng test --watch=false --include='**/perfil.spec.ts'`
Expected: FAIL (`Perfil` não existe)

- [ ] **Step 3: Implementar**

```typescript
// src/app/features/perfil/perfil.ts
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { TextField } from '../../shared/ui/text-field/text-field';
import { Button } from '../../shared/ui/button/button';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';

@Component({
  selector: 'app-perfil',
  imports: [ReactiveFormsModule, TextField, Button, EmptyState],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class Perfil {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly usuario = this.auth.usuarioAtual;

  protected readonly form = this.fb.nonNullable.group({
    nome: [this.usuario()?.nome ?? '', [Validators.required]],
    email: [this.usuario()?.email ?? '', [Validators.required, Validators.email]],
    telefone: [this.usuario()?.telefone ?? ''],
  });

  protected readonly salvando = signal(false);
  protected readonly salvo = signal(false);

  protected async aoSalvar(): Promise<void> {
    if (this.form.invalid || this.salvando()) {
      this.form.markAllAsTouched();
      return;
    }
    this.salvando.set(true);
    this.salvo.set(false);
    await this.auth.atualizarPerfil(this.form.getRawValue());
    this.salvando.set(false);
    this.salvo.set(true);
  }

  protected sair(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
```

```html
<!-- src/app/features/perfil/perfil.html -->
<div class="perfil">
  <h1 class="titulo-1">Meu perfil</h1>

  <form class="perfil__form" [formGroup]="form" (ngSubmit)="aoSalvar()">
    <app-text-field rotulo="Nome" [controle]="form.controls.nome" />
    <app-text-field rotulo="E-mail" tipo="email" [controle]="form.controls.email" />
    <app-text-field rotulo="Telefone" tipo="tel" [controle]="form.controls.telefone" />
    <app-button tipo="submit" [carregando]="salvando()">Salvar alterações</app-button>
    @if (salvo()) {
      <p class="perfil__salvo">Dados atualizados.</p>
    }
  </form>

  <section class="perfil__secao">
    <h2 class="titulo-2">Meus pedidos</h2>
    <app-empty-state
      mensagem="Você ainda não fez nenhum pedido."
      textoAcao="Ver a loja"
      linkAcao="/loja"
    />
  </section>

  <section class="perfil__secao">
    <h2 class="titulo-2">Meus eventos</h2>
    <app-empty-state
      mensagem="Você ainda não se inscreveu em nenhum evento."
      textoAcao="Ver eventos"
      linkAcao="/eventos"
    />
  </section>

  <button type="button" data-testid="botao-sair" class="perfil__sair" (click)="sair()">Sair da conta</button>
</div>
```

```scss
// src/app/features/perfil/perfil.scss
@use 'styles/tokens' as *;

.perfil {
  max-width: 480px;
  margin: 0 auto;
  padding: var(--espaco-6) var(--espaco-4) var(--espaco-8);
  display: flex;
  flex-direction: column;
  gap: var(--espaco-6);
}

.perfil__form {
  display: flex;
  flex-direction: column;
  gap: var(--espaco-4);
}

.perfil__salvo {
  color: var(--status-confirm);
  font-size: 0.875rem;
  margin: 0;
}

.perfil__secao {
  border-top: 1px solid rgba(246, 244, 236, 0.08);
  padding-top: var(--espaco-4);
}

.perfil__sair {
  background: none;
  border: none;
  color: var(--status-cancel);
  font-family: var(--fonte-corpo);
  font-weight: 700;
  cursor: pointer;
  align-self: flex-start;
  padding: 0;
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx ng test --watch=false --include='**/perfil.spec.ts'`
Expected: PASS (4 testes)

- [ ] **Step 5: Commit**

```bash
git add src/app/features/perfil
git commit -m "feat: tela de Perfil"
```

---

### Task 19: Página Sobre a REDE

**Files:**
- Create: `src/app/features/institucional/sobre/sobre.ts`, `sobre.html`, `sobre.scss`, `sobre.spec.ts`

**Interfaces:**
- Consumes: `SectionDivider` (Task 6), `EmptyState` (Task 7)
- Produces: `Sobre` (selector `app-sobre`) — já referenciado em `app.routes.ts` (Task 11)

- [ ] **Step 1: Escrever o teste**

```typescript
// src/app/features/institucional/sobre/sobre.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Sobre } from './sobre';

describe('Sobre', () => {
  let fixture: ComponentFixture<Sobre>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sobre],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(Sobre);
    fixture.detectChanges();
  });

  it('mostra as três seções principais', () => {
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Sobre a REDE');
    expect(texto).toContain('Liderança');
    expect(texto).toContain('Horário de encontro');
  });

  it('mostra o texto de visão do ministério', () => {
    expect(fixture.nativeElement.textContent).toContain('conectar jovens');
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx ng test --watch=false --include='**/sobre.spec.ts'`
Expected: FAIL (`Sobre` não existe)

- [ ] **Step 3: Implementar**

```typescript
// src/app/features/institucional/sobre/sobre.ts
import { Component } from '@angular/core';
import { SectionDivider } from '../../../shared/ui/section-divider/section-divider';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';

@Component({
  selector: 'app-sobre',
  imports: [SectionDivider, EmptyState],
  templateUrl: './sobre.html',
  styleUrl: './sobre.scss',
})
export class Sobre {}
```

```html
<!-- src/app/features/institucional/sobre/sobre.html -->
<div class="sobre">
  <h1 class="titulo-1">Sobre a REDE</h1>
  <p class="texto-corpo">
    A REDE existe pra conectar jovens de verdade — com Deus, uns com os outros e com a cidade onde vivem.
    Aqui a gente vive fé sem embromação: conversa aberta, amizade de verdade e presença nos momentos que importam.
    Somos o ministério de jovens da Primeira Igreja Batista de Vila Maria.
  </p>

  <app-section-divider />

  <section class="sobre__secao">
    <h2 class="titulo-2">Liderança</h2>
    <app-empty-state mensagem="Em breve você vai conhecer aqui os líderes da REDE." />
  </section>

  <app-section-divider />

  <section class="sobre__secao">
    <h2 class="titulo-2">Horário de encontro</h2>
    <app-empty-state mensagem="Os horários de encontro serão publicados em breve." />
  </section>
</div>
```

```scss
// src/app/features/institucional/sobre/sobre.scss
@use 'styles/tokens' as *;

.sobre {
  max-width: 640px;
  margin: 0 auto;
  padding: var(--espaco-6) var(--espaco-4) var(--espaco-8);
  display: flex;
  flex-direction: column;
  gap: var(--espaco-5);
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx ng test --watch=false --include='**/sobre.spec.ts'`
Expected: PASS (2 testes)

- [ ] **Step 5: Rodar a suíte completa e o build final**

Run: `npx ng test --watch=false`
Expected: PASS (todos os testes de todas as tasks)

Run: `npx ng build`
Expected: build conclui sem erros

- [ ] **Step 6: Commit**

```bash
git add src/app/features/institucional
git commit -m "feat: pagina Sobre a REDE"
```

---

## Nota final

Conteúdo real de liderança e horário de encontro da Sobre (Task 19) ainda não foi fornecido pelo cliente — os textos ficam como estado vazio honesto ("em breve") até a REDE enviar os dados reais, quando bastar trocar o `mensagem` do `EmptyState` por um componente de listagem real.
