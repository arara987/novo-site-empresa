# Belfort ERP (Arquitetura Modular)

## Estrutura

- `src/frontend`: interface e experiência do usuário.
- `src/backend`: serviços, regras de negócio e camada de API.
- `src/shared`: validações reutilizáveis.
- `src/db/schema.sql`: modelagem relacional para produção.

## Como executar

Por ser uma aplicação web estática, basta abrir o `index.html` em um servidor local.

Exemplo:

```bash
python3 -m http.server 8080
```

Depois acesse `http://localhost:8080`.
