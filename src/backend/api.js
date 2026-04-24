import {
  catalogService,
  clientService,
  contractService,
  equipmentService,
  financeService,
  professionalService,
  readModel,
  trainingService
} from "./services/businessService.js";

export const api = {
  equipamentos: {
    create: equipmentService.create,
    movimentar: equipmentService.addMovement,
    list: () => readModel.byEntity("equipamentos"),
    historico: () => readModel.byEntity("equipamentosMovimentacoes")
  },
  treinamentos: {
    create: trainingService.create,
    vincular: trainingService.linkProfessional,
    list: () => readModel.byEntity("treinamentos"),
    historico: () => readModel.byEntity("treinamentosProfissionais")
  },
  clientes: {
    create: clientService.create,
    list: () => readModel.byEntity("clientes")
  },
  profissionais: {
    create: professionalService.create,
    list: () => readModel.byEntity("profissionais")
  },
  contratos: {
    create: contractService.create,
    list: () => readModel.byEntity("contratos"),
    addParcela: contractService.addParcel,
    listParcelas: () => readModel.byEntity("parcelasObra"),
    rt: contractService.registerRt,
    listRt: () => readModel.byEntity("pagamentosRt")
  },
  financeiro: {
    create: financeService.addEntry,
    list: () => readModel.byEntity("financeiroLancamentos"),
    resumo: financeService.summary
  },
  catalogo: {
    create: catalogService.create,
    list: () => readModel.byEntity("catalogoProdutos")
  },
  snapshot: readModel.all
};
