/*
  # Criar usuários iniciais do sistema
  
  1. Limpeza
    - Remove registros existentes de forma segura
    - Limpa tabelas na ordem correta
    
  2. Usuários Iniciais
    - Admin: email 'admin@dentclinic.com' senha 'admin123'
    - Usuário: email 'user@dentclinic.com' senha 'user123'
*/

-- Remover registros existentes com segurança
DO $$
BEGIN
  -- Remover registros de tabelas dependentes primeiro
  DELETE FROM public.notifications;
  DELETE FROM public.appointments;
  DELETE FROM public.financial_records;
  
  -- Depois remover os perfis que não são referenciados
  DELETE FROM public.profiles
  WHERE id NOT IN (
    SELECT id FROM auth.users
  );
END $$;

-- Criar usuários iniciais
DO $$
DECLARE
  v_admin_id uuid := gen_random_uuid();
  v_user_id uuid := gen_random_uuid();
  v_admin_exists boolean;
  v_user_exists boolean;
BEGIN
  -- Verificar se os usuários já existem
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@dentclinic.com'
  ) INTO v_admin_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'user@dentclinic.com'
  ) INTO v_user_exists;

  -- Criar usuário administrador se não existir
  IF NOT v_admin_exists THEN
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
      v_admin_id,
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

    -- Criar perfil para o admin
    INSERT INTO public.profiles (id, email, role)
    VALUES (v_admin_id, 'admin@dentclinic.com', 'admin')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Criar usuário comum se não existir
  IF NOT v_user_exists THEN
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
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'user@dentclinic.com',
      crypt('user123', gen_salt('bf')),
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

    -- Criar perfil para o usuário
    INSERT INTO public.profiles (id, email, role)
    VALUES (v_user_id, 'user@dentclinic.com', 'user')
    ON CONFLICT (id) DO NOTHING;
  END IF;

EXCEPTION WHEN others THEN
  RAISE NOTICE 'Erro durante a criação dos usuários: %', SQLERRM;
  RAISE;
END $$;