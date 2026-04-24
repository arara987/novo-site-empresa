const STORAGE_KEY = "belfort_erp_db_v1";

const initialState = {
  equipamentos: [],
  equipamentosMovimentacoes: [],
  treinamentos: [],
  treinamentosProfissionais: [],
  clientes: [],
  contratos: [],
  parcelasObra: [],
  pagamentosRt: [],
  profissionais: [],
  financeiroLancamentos: [],
  catalogoProdutos: [
    { id: crypto.randomUUID(), nome: "Porcelanato Ônix", categoria: "Premium", imagem: "Imagem ilustrativa", preco: 220 },
    { id: crypto.randomUUID(), nome: "Luminária Linear", categoria: "Iluminação", imagem: "Imagem ilustrativa", preco: 780 },
    { id: crypto.randomUUID(), nome: "Porta Pivotante Nobre", categoria: "Premium", imagem: "Imagem ilustrativa", preco: 3400 }
  ]
};

const safeParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const db = {
  state: safeParse(localStorage.getItem(STORAGE_KEY)) ?? initialState,

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  },

  list(entity) {
    return this.state[entity] ?? [];
  },

  insert(entity, payload) {
    const row = { ...payload, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    this.state[entity].push(row);
    this.save();
    return row;
  },

  update(entity, id, payload) {
    const index = this.state[entity].findIndex((item) => item.id === id);
    if (index < 0) throw new Error("Registro não encontrado.");
    this.state[entity][index] = { ...this.state[entity][index], ...payload, updatedAt: new Date().toISOString() };
    this.save();
    return this.state[entity][index];
  }
};
