-- Modelagem relacional pronta para banco SQL (PostgreSQL)

CREATE TABLE clientes (
  id UUID PRIMARY KEY,
  nome VARCHAR(160) NOT NULL,
  contato VARCHAR(120) NOT NULL,
  arquiteto VARCHAR(120),
  historico_contratos TEXT,
  historico_financeiro TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE profissionais (
  id UUID PRIMARY KEY,
  nome VARCHAR(160) NOT NULL,
  profissao VARCHAR(120) NOT NULL,
  obras TEXT,
  contratos TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE equipamentos (
  id UUID PRIMARY KEY,
  nome VARCHAR(160) NOT NULL,
  tipo VARCHAR(120) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('disponivel','em_uso','manutencao')),
  responsavel VARCHAR(120) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE equipamentos_movimentacoes (
  id UUID PRIMARY KEY,
  equipamento_id UUID NOT NULL REFERENCES equipamentos(id),
  profissional VARCHAR(120) NOT NULL,
  data_movimento DATE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('disponivel','em_uso','manutencao')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE treinamentos (
  id UUID PRIMARY KEY,
  nome VARCHAR(180) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('tecnico','seguranca')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE treinamentos_profissionais (
  id UUID PRIMARY KEY,
  treinamento_id UUID NOT NULL REFERENCES treinamentos(id),
  profissional_id UUID NOT NULL REFERENCES profissionais(id),
  data_treinamento DATE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('concluido','pendente')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE contratos (
  id UUID PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  arquiteto_id UUID,
  data_contrato DATE NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  status VARCHAR(60) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE parcelas_obra (
  id UUID PRIMARY KEY,
  contrato_id UUID NOT NULL REFERENCES contratos(id),
  data_parcela DATE NOT NULL,
  valor NUMERIC(14,2) NOT NULL,
  percentual NUMERIC(6,2) NOT NULL,
  pago BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE pagamentos_rt (
  id UUID PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  contrato_id UUID NOT NULL REFERENCES contratos(id),
  valor_acordado NUMERIC(14,2) NOT NULL,
  tipo_pagamento VARCHAR(20) NOT NULL CHECK (tipo_pagamento IN ('avista','parcelado')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE financeiro_lancamentos (
  id UUID PRIMARY KEY,
  descricao VARCHAR(220) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada','saida','ccd')),
  valor NUMERIC(14,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE catalogo_produtos (
  id UUID PRIMARY KEY,
  nome VARCHAR(180) NOT NULL,
  categoria VARCHAR(100) NOT NULL,
  imagem TEXT,
  preco NUMERIC(14,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
