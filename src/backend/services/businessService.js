import { db } from "../repositories/store.js";
import { enumValue, positiveNumber, required } from "../../shared/validators.js";

export const equipmentService = {
  create(input) {
    required(input.nome, "nome");
    required(input.tipo, "tipo");
    required(input.responsavel, "responsável");
    enumValue(input.status, ["disponivel", "em_uso", "manutencao"], "status");
    return db.insert("equipamentos", input);
  },
  addMovement(input) {
    required(input.equipamentoId, "equipamento");
    required(input.profissional, "profissional");
    required(input.data, "data");
    enumValue(input.status, ["disponivel", "em_uso", "manutencao"], "status");
    return db.insert("equipamentosMovimentacoes", input);
  }
};

export const trainingService = {
  create(input) {
    required(input.nome, "nome");
    enumValue(input.tipo, ["tecnico", "seguranca"], "tipo");
    return db.insert("treinamentos", input);
  },
  linkProfessional(input) {
    required(input.treinamentoId, "treinamento");
    required(input.profissionalId, "profissional");
    required(input.data, "data");
    enumValue(input.status, ["concluido", "pendente"], "status");
    return db.insert("treinamentosProfissionais", input);
  }
};

export const clientService = {
  create(input) {
    required(input.nome, "nome");
    required(input.contato, "contato");
    return db.insert("clientes", input);
  }
};

export const professionalService = {
  create(input) {
    required(input.nome, "nome");
    required(input.profissao, "profissão");
    return db.insert("profissionais", input);
  }
};

export const contractService = {
  create(input) {
    required(input.clienteId, "cliente");
    required(input.dataContrato, "data de contrato");
    required(input.dataInicio, "data de início");
    required(input.dataFim, "data de término");
    required(input.status, "status");
    return db.insert("contratos", input);
  },

  addParcel(input) {
    required(input.contratoId, "contrato");
    required(input.dataParcela, "data da parcela");
    positiveNumber(input.valor, "valor");
    positiveNumber(input.percentual, "percentual");
    return db.insert("parcelasObra", { ...input, pago: false });
  },

  registerRt(input) {
    required(input.clienteId, "cliente");
    required(input.contratoId, "contrato");
    positiveNumber(input.valorAcordado, "valor acordado");
    enumValue(input.tipoPagamento, ["avista", "parcelado"], "tipo de pagamento");
    return db.insert("pagamentosRt", input);
  }
};

export const financeService = {
  addEntry(input) {
    required(input.descricao, "descrição");
    enumValue(input.tipo, ["entrada", "saida", "ccd"], "tipo");
    positiveNumber(input.valor, "valor");
    return db.insert("financeiroLancamentos", input);
  },
  summary() {
    const rows = db.list("financeiroLancamentos");
    return rows.reduce((acc, item) => {
      if (item.tipo === "entrada") acc.entradas += Number(item.valor);
      if (item.tipo === "saida" || item.tipo === "ccd") acc.saidas += Number(item.valor);
      acc.saldo = acc.entradas - acc.saidas;
      return acc;
    }, { entradas: 0, saidas: 0, saldo: 0 });
  }
};

export const catalogService = {
  create(input) {
    required(input.nome, "nome");
    required(input.categoria, "categoria");
    positiveNumber(input.preco, "preço");
    return db.insert("catalogoProdutos", input);
  }
};

export const readModel = {
  all: () => db.state,
  byEntity: (entity) => db.list(entity)
};
