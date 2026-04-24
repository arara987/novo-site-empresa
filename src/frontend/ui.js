import { api } from "../backend/api.js";

const pages = [
  { id: "equipamentos", title: "Equipamentos", description: "Cadastro, uso e histórico de ferramentas." },
  { id: "treinamentos", title: "Treinamentos", description: "Treinamentos técnicos e de segurança por profissional." },
  { id: "clientes", title: "Clientes", description: "Base completa com histórico contratual e financeiro." },
  { id: "contratos", title: "Contratos", description: "Gestão de contratos, parcelas de obras e RT." },
  { id: "profissionais", title: "Profissionais", description: "Cadastro de profissionais vinculados às obras." },
  { id: "financeiro", title: "Financeiro", description: "Entradas, saídas, CCD e relatório consolidado." },
  { id: "catalogo", title: "Catálogo", description: "Catálogo premium com filtros e categorias." },
  { id: "arquitetura", title: "Arquitetura", description: "Visão técnica da solução, modelagem e integração." }
];

const el = {
  menu: document.querySelector("#menu"),
  app: document.querySelector("#app"),
  title: document.querySelector("#page-title"),
  description: document.querySelector("#page-description")
};

const renderRows = (rows, mapper) => {
  if (!rows.length) return '<p class="empty">Sem registros.</p>';
  return rows.map(mapper).join("");
};

const forms = {
  equipamentos: () => `
    <div class="grid">
      <form id="form-equipamento" class="card">
        <h3>Novo Equipamento</h3>
        <input name="nome" placeholder="Nome" required />
        <input name="tipo" placeholder="Tipo" required />
        <select name="status"><option value="disponivel">Disponível</option><option value="em_uso">Em uso</option><option value="manutencao">Manutenção</option></select>
        <input name="responsavel" placeholder="Responsável" required />
        <button>Salvar equipamento</button>
      </form>
      <form id="form-mov-equipamento" class="card">
        <h3>Movimentação</h3>
        <input name="equipamentoId" placeholder="ID do equipamento" required />
        <input name="profissional" placeholder="Quem usou" required />
        <input type="date" name="data" required />
        <select name="status"><option value="em_uso">Em uso</option><option value="disponivel">Disponível</option><option value="manutencao">Manutenção</option></select>
        <button>Registrar movimento</button>
      </form>
      <article class="card"><h3>Equipamentos</h3>${renderRows(api.equipamentos.list(), (item) => `<p>${item.nome} · ${item.status} · ${item.responsavel}</p>`)}</article>
      <article class="card"><h3>Histórico de Movimentação</h3>${renderRows(api.equipamentos.historico(), (item) => `<p>${item.data} · ${item.profissional} · ${item.status}</p>`)}</article>
    </div>
  `,
  treinamentos: () => `
    <div class="grid">
      <form id="form-treinamento" class="card">
        <h3>Novo treinamento</h3>
        <input name="nome" placeholder="Nome" required />
        <select name="tipo"><option value="tecnico">Técnico</option><option value="seguranca">Segurança</option></select>
        <button>Salvar treinamento</button>
      </form>
      <form id="form-vinculo-treinamento" class="card">
        <h3>Vincular profissional</h3>
        <input name="treinamentoId" placeholder="ID treinamento" required />
        <input name="profissionalId" placeholder="ID profissional" required />
        <input type="date" name="data" required />
        <select name="status"><option value="pendente">Pendente</option><option value="concluido">Concluído</option></select>
        <button>Vincular</button>
      </form>
      <article class="card"><h3>Treinamentos</h3>${renderRows(api.treinamentos.list(), (item) => `<p>${item.nome} · ${item.tipo}</p>`)}</article>
      <article class="card"><h3>Histórico Individual</h3>${renderRows(api.treinamentos.historico(), (item) => `<p>${item.profissionalId} · ${item.status} · ${item.data}</p>`)}</article>
    </div>
  `,
  clientes: () => `
    <div class="grid">
      <form id="form-cliente" class="card">
        <h3>Cadastro de cliente</h3>
        <input name="nome" placeholder="Nome" required />
        <input name="contato" placeholder="Contato" required />
        <input name="arquiteto" placeholder="Arquiteto (opcional)" />
        <textarea name="historicoContratos" placeholder="Histórico de contratos"></textarea>
        <textarea name="historicoFinanceiro" placeholder="Histórico financeiro"></textarea>
        <button>Salvar cliente</button>
      </form>
      <article class="card"><h3>Clientes cadastrados</h3>${renderRows(api.clientes.list(), (item) => `<p>${item.nome} · ${item.contato} · Arquiteto: ${item.arquiteto || "N/A"}</p>`)}</article>
    </div>
  `,
  contratos: () => {
    const parcelas = api.contratos.listParcelas();
    const totalParcelas = parcelas.reduce((sum, item) => sum + Number(item.valor), 0);
    return `
    <div class="grid">
      <form id="form-contrato" class="card">
        <h3>Novo contrato</h3>
        <input name="clienteId" placeholder="ID cliente" required />
        <input name="arquitetoId" placeholder="ID arquiteto (opcional)" />
        <input type="date" name="dataContrato" required />
        <input type="date" name="dataInicio" required />
        <input type="date" name="dataFim" required />
        <input name="status" placeholder="Status" required />
        <button>Salvar contrato</button>
      </form>
      <form id="form-parcela" class="card">
        <h3>Parcela de obra</h3>
        <input name="contratoId" placeholder="ID contrato" required />
        <input type="date" name="dataParcela" required />
        <input type="number" name="valor" placeholder="Valor" required min="0.01" step="0.01" />
        <input type="number" name="percentual" placeholder="% total" required min="0.01" step="0.01" />
        <button>Cadastrar parcela</button>
      </form>
      <form id="form-rt" class="card">
        <h3>Pagamento de RT</h3>
        <input name="clienteId" placeholder="ID cliente" required />
        <input name="contratoId" placeholder="ID contrato" required />
        <input type="number" name="valorAcordado" placeholder="Valor acordado" required min="0.01" step="0.01" />
        <select name="tipoPagamento"><option value="avista">À vista</option><option value="parcelado">Parcelado</option></select>
        <button>Registrar RT</button>
      </form>
      <article class="card"><h3>Contratos</h3>${renderRows(api.contratos.list(), (item) => `<p>${item.id.slice(0, 8)} · Cliente: ${item.clienteId} · ${item.status}</p>`)}</article>
      <article class="card"><h3>Parcelas (total R$ ${totalParcelas.toFixed(2)})</h3>${renderRows(parcelas, (item) => `<p>${item.dataParcela} · R$ ${Number(item.valor).toFixed(2)} · ${item.percentual}% · ${item.pago ? "Pago" : "Pendente"}</p>`)}</article>
      <article class="card"><h3>Pagamentos RT</h3>${renderRows(api.contratos.listRt(), (item) => `<p>Contrato ${item.contratoId} · R$ ${Number(item.valorAcordado).toFixed(2)} · ${item.tipoPagamento}</p>`)}</article>
    </div>`;
  },
  profissionais: () => `
    <div class="grid">
      <form id="form-profissional" class="card">
        <h3>Novo profissional</h3>
        <input name="nome" placeholder="Nome" required />
        <input name="profissao" placeholder="Profissão" required />
        <input name="obras" placeholder="Vínculo com obras" />
        <input name="contratos" placeholder="Vínculo com contratos" />
        <button>Salvar profissional</button>
      </form>
      <article class="card"><h3>Profissionais</h3>${renderRows(api.profissionais.list(), (item) => `<p>${item.nome} · ${item.profissao}</p>`)}</article>
    </div>
  `,
  financeiro: () => {
    const resumo = api.financeiro.resumo();
    return `
      <div class="grid">
        <form id="form-financeiro" class="card">
          <h3>Novo lançamento</h3>
          <input name="descricao" placeholder="Descrição" required />
          <select name="tipo"><option value="entrada">Entrada</option><option value="saida">Saída</option><option value="ccd">Pagamento CCD</option></select>
          <input type="number" step="0.01" name="valor" placeholder="Valor" required />
          <button>Salvar lançamento</button>
        </form>
        <article class="card"><h3>Resumo</h3><p>Entradas: R$ ${resumo.entradas.toFixed(2)}</p><p>Saídas: R$ ${resumo.saidas.toFixed(2)}</p><p>Saldo: R$ ${resumo.saldo.toFixed(2)}</p></article>
        <article class="card"><h3>Relatório</h3>${renderRows(api.financeiro.list(), (item) => `<p>${item.tipo.toUpperCase()} · ${item.descricao} · R$ ${Number(item.valor).toFixed(2)}</p>`)}</article>
      </div>
    `;
  },
  catalogo: () => {
    const produtos = api.catalogo.list();
    return `
      <div class="grid">
        <form id="form-catalogo" class="card">
          <h3>Novo item de catálogo</h3>
          <input name="nome" placeholder="Nome" required />
          <select name="categoria"><option>Premium</option><option>Iluminação</option><option>Acabamentos</option><option>Estrutural</option></select>
          <input name="imagem" placeholder="Referência da imagem" required />
          <input type="number" step="0.01" name="preco" placeholder="Preço" required />
          <button>Salvar produto</button>
        </form>
        <article class="card"><h3>Filtros premium</h3><p>Categorias disponíveis: Premium, Iluminação, Acabamentos, Estrutural.</p><p>Navegação otimizada por cards e categoria.</p></article>
        <article class="card"><h3>Produtos</h3>${renderRows(produtos, (item) => `<p>${item.nome} · ${item.categoria} · R$ ${Number(item.preco).toFixed(2)}</p>`)}</article>
      </div>
    `;
  },
  arquitetura: () => `
    <article class="card">
      <h3>Arquitetura modular</h3>
      <p>Frontend: renderização e UX por página.</p>
      <p>Backend: serviços e validações centralizadas.</p>
      <p>Persistência: repositório com localStorage e entidades independentes.</p>
      <p>Integração futura: APIs REST podem ser expostas mantendo os mesmos contratos do módulo api.</p>
    </article>
  `
};

const bindings = [
  ["form-equipamento", api.equipamentos.create],
  ["form-mov-equipamento", api.equipamentos.movimentar],
  ["form-treinamento", api.treinamentos.create],
  ["form-vinculo-treinamento", api.treinamentos.vincular],
  ["form-cliente", api.clientes.create],
  ["form-contrato", api.contratos.create],
  ["form-parcela", api.contratos.addParcela],
  ["form-rt", api.contratos.rt],
  ["form-profissional", api.profissionais.create],
  ["form-financeiro", api.financeiro.create],
  ["form-catalogo", api.catalogo.create]
];

const attachFormHandlers = (pageId) => {
  bindings.forEach(([formId, action]) => {
    const form = document.getElementById(formId);
    if (!form) return;
    form.onsubmit = (event) => {
      event.preventDefault();
      const payload = Object.fromEntries(new FormData(form).entries());
      try {
        action(payload);
        renderPage(pageId);
      } catch (error) {
        alert(error.message);
      }
    };
  });
};

export const renderPage = (pageId) => {
  const page = pages.find((item) => item.id === pageId) ?? pages[0];
  el.title.textContent = page.title;
  el.description.textContent = page.description;
  el.app.innerHTML = forms[page.id]();
  attachFormHandlers(page.id);
  [...el.menu.querySelectorAll("button")].forEach((button) => {
    button.classList.toggle("active", button.dataset.page === page.id);
  });
};

export const initUi = () => {
  el.menu.innerHTML = pages
    .map((item) => `<button data-page="${item.id}">${item.title}</button>`)
    .join("");

  el.menu.onclick = (event) => {
    const button = event.target.closest("button[data-page]");
    if (!button) return;
    renderPage(button.dataset.page);
  };

  renderPage("equipamentos");
};
