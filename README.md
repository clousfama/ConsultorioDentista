# Clínica Dental - Sistema de Gerenciamento Odontológico

## Sobre o Projeto
Sistema de gerenciamento para consultórios odontológicos, desenvolvido com React, TypeScript e Supabase.

## Funcionalidades
- Sistema de autenticação com diferentes níveis de acesso (admin/usuário)
- Dashboard administrativo
- Gerenciamento de pacientes, consultas e tratamentos

## Configuração de Ambiente

### Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto e configure as seguintes variáveis:

```
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_KEY=sua_chave_do_supabase
```

### Modo de Desenvolvimento

O sistema tem um modo de desenvolvimento para facilitar testes sem depender do backend do Supabase. Este modo:

1. Permite login com credenciais pré-definidas sem conexão com o Supabase
2. Armazena os dados de usuário no localStorage
3. Facilita o desenvolvimento e testes

**IMPORTANTE: Para produção**

O modo de desenvolvimento é ativado automaticamente durante o desenvolvimento, mas para produção, você deve certifcar-se de que está desativado:

1. O modo é controlado pela variável `DEV_MODE` no arquivo `App.tsx`
2. Por padrão, ele está ativo em ambiente de desenvolvimento (`import.meta.env.DEV`) 
3. Para desabilitar explicitamente, certifique-se de que a variável `VITE_ENABLE_DEV_LOGIN` não esteja definida como 'true' no seu ambiente

```
# Para forçar o modo de desenvolvimento (NÃO use em produção)
VITE_ENABLE_DEV_LOGIN=true

# Para produção (não defina esta variável ou defina como false)
VITE_ENABLE_DEV_LOGIN=false
```

### Credenciais de Teste (apenas para desenvolvimento)

- **Admin**: admin@dentclinic.com / admin123
- **Usuário**: user@dentclinic.com / user123

**Atenção**: Estas credenciais são apenas para desenvolvimento. Em produção, use o sistema de autenticação do Supabase.

## Instalação e Execução

```bash
# Instalar dependências
yarn install

# Executar em modo de desenvolvimento
yarn dev

# Construir para produção
yarn build

# Executar testes
yarn test
```

## Estrutura do Projeto

```
/src
  /components       # Componentes React
  /lib              # Bibliotecas e configurações
  /pages            # Páginas da aplicação
  /stores           # Estados globais (Zustand)
  /types            # Tipos TypeScript
  /utils            # Funções utilitárias
```

## Segurança

- O sistema usa autenticação JWT do Supabase em produção
- Todas as rotas sensíveis são protegidas
- Os dados são armazenados de forma segura no Supabase

---

Desenvolvido por WoodBarbeariaKM2
