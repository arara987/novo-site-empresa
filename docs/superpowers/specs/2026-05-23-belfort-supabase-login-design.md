# Design: login por usuário e banco Supabase Belfort

## Objetivo

Conectar o painel Belfort Engenharia ao Supabase `rjxnxfbblhfxxyfaawev`, adicionando uma tela de autenticação com login por email e código único de segurança, cadastro de usuário, geração/cópia do código após cadastro e persistência dos dados operacionais hoje mantidos apenas em memória/localStorage.

## Decisões aprovadas

- Usar Supabase Auth para email/senha.
- Usar uma organização compartilhada para a Belfort Engenharia.
- Usuários autenticados pertencentes à organização acessam os mesmos dados operacionais.
- Criar RLS em todas as tabelas públicas.
- Criar funções/triggers para ligar `auth.users` aos perfis, organização inicial e código de segurança.
- Mostrar o código de segurança ao usuário uma vez após cadastro, com opção de copiar.
- Manter a identidade visual atual do painel.

## Tela de autenticação

Ao abrir o site, o painel principal fica bloqueado até haver sessão válida.

### Entrar

Campos:
- Email/usuário.
- Código único de segurança.

Ação:
- O site chama uma função RPC no Supabase para validar o código informado contra o hash salvo.
- Se o código for válido, autentica com Supabase Auth usando email e o código como senha.
- Em caso de sucesso, carrega os dados do banco e mostra o painel.

Links inferiores:
- Cadastrar.
- Esqueceu senha ou código de segurança.

### Cadastrar

Campos:
- Nome.
- Email.
- Senha.

Ação:
- O site gera um código forte com letras maiúsculas, minúsculas e números.
- O usuário é cadastrado no Supabase Auth usando email + código gerado como senha de login.
- O hash SHA-256 do código é salvo em `security_codes`.
- A senha digitada no cadastro será guardada como senha de recuperação em hash no perfil, não usada como login principal.
- Após cadastro, aparece a tela do código.

Links inferiores:
- Entrar.
- Esqueceu senha ou código de segurança.

### Código gerado

Tela pós-cadastro:
- Mostra o código único.
- Botão copiar.
- Botão ir para entrada.
- Texto avisando para guardar o código porque ele não será exibido novamente.

### Recuperação

A opção “Esqueceu senha ou código de segurança” mostra instrução para contatar o administrador por enquanto. Reset seguro de código pode ser adicionado depois, porque gerar novo código exige verificar identidade fora do site.

## Schema Supabase

### Autenticação e acesso

1. `organizations`
   - `id uuid primary key`
   - `name text not null`
   - `slug text unique not null`
   - timestamps

2. `profiles`
   - `id uuid primary key references auth.users(id) on delete cascade`
   - `organization_id uuid references organizations(id)`
   - `full_name text not null`
   - `email text not null`
   - `recovery_password_hash text`
   - `status text default 'active'`
   - timestamps

3. `organization_members`
   - `organization_id uuid references organizations(id)`
   - `user_id uuid references profiles(id)`
   - `role text default 'member'`
   - `status text default 'active'`
   - timestamps
   - primary key `(organization_id, user_id)`

4. `security_codes`
   - `user_id uuid primary key references profiles(id)`
   - `code_hash text not null`
   - timestamps

### Dados operacionais

5. `clientes`
6. `obras`
7. `obra_pagamentos`
8. `obra_pagamento_parcelas`
9. `cliente_art_pagamentos`
10. `cliente_art_parcelas`
11. `profissionais`
12. `profissional_treinamentos`
13. `obra_documentos`
14. `documento_anexos`
15. `cnd_mensal`
16. `epi_items`
17. `epi_estoque`
18. `equipamentos`
19. `equipamento_estoque`
20. `notifications`
21. `audit_logs`

Todas as tabelas operacionais terão:
- `organization_id` para isolamento por organização.
- `created_by` quando aplicável.
- `created_at` e `updated_at`.

## Funções e triggers

### `handle_new_user()`

Trigger em `auth.users` após criação:
- Garante organização `belfort-engenharia`.
- Cria `profiles` usando o nome vindo de metadata.
- Vincula usuário à organização em `organization_members`.

### `set_updated_at()`

Trigger genérica antes de update para atualizar `updated_at`.

### `is_org_member(org_id uuid)`

Função auxiliar para RLS verificar se `auth.uid()` pertence à organização.

### `verify_security_code(login_email text, plain_code text)`

RPC exposta para usuário anônimo validar código antes do login:
- Recebe email e código.
- Calcula `encode(digest(plain_code, 'sha256'), 'hex')`.
- Compara com `security_codes.code_hash`.
- Retorna boolean.

## RLS

- `organizations`: usuário autenticado vê organizações das quais é membro.
- `profiles`: usuário vê/edita o próprio perfil; membros podem consultar perfis da mesma organização se necessário para auditoria simples.
- `organization_members`: usuário vê membros da própria organização.
- Tabelas operacionais: qualquer usuário autenticado e membro da organização pode selecionar/inserir/editar/excluir registros daquela organização.
- `security_codes`: sem leitura pública; inserção/atualização apenas do próprio usuário autenticado; validação pública somente via RPC `verify_security_code`.

## Integração frontend

Como o projeto é HTML/CSS/JS puro, será usado o bundle ESM da `@supabase/supabase-js` via CDN no `index.html`.

Novas responsabilidades no JS:
- Criar cliente Supabase com project URL e publishable key.
- Controlar sessão.
- Mostrar/esconder overlay de autenticação.
- Gerar código de segurança.
- Calcular SHA-256 no navegador para salvar hash.
- Cadastrar usuário.
- Validar código via RPC.
- Entrar com `signInWithPassword`.
- Carregar dados iniciais do banco.
- Persistir as principais ações do painel no Supabase.

## Testes e revisão

Criar testes Node sem dependências externas para funções puras:
- geração de código de segurança;
- validação de força do código;
- hash SHA-256 determinístico;
- conversão de valores monetários.

Após implementação:
- Rodar testes automatizados.
- Rodar `node --check` em scripts extraídos/criados.
- Rodar consultas no Supabase para confirmar tabelas, triggers, RLS e RPC.
- Revisar fluxos principais do HTML para garantir que botões ainda possuem handlers.

## Fora de escopo neste ciclo

- Upload real para Supabase Storage.
- Reset automático de código por email.
- Painel administrativo avançado de usuários.
