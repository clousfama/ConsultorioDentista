/*
  # Criar usuário administrador inicial
  
  1. Alterações
    - Insere um usuário administrador inicial
    - Email: admin@dentclinic.com
    - Senha: admin123
    
  2. Segurança
    - Usuário com role 'admin'
    - Senha temporária que deve ser alterada no primeiro acesso
*/

-- Inserir usuário na tabela auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@dentclinic.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Inserir perfil do admin
INSERT INTO public.profiles (
  id,
  email,
  role
) 
SELECT 
  id,
  email,
  'admin'
FROM auth.users 
WHERE email = 'admin@dentclinic.com';