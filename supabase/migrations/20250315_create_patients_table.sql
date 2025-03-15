-- Criação da tabela de pacientes (patients)
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  birth_date DATE,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Permissões para a tabela de pacientes
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura por usuários autenticados
CREATE POLICY "Usuários autenticados podem ler pacientes" 
  ON public.patients FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Política para permitir inserção por usuários autenticados
CREATE POLICY "Usuários autenticados podem inserir pacientes" 
  ON public.patients FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Política para permitir atualização por usuários autenticados
CREATE POLICY "Usuários autenticados podem atualizar pacientes" 
  ON public.patients FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Política para permitir exclusão por usuários autenticados
CREATE POLICY "Usuários autenticados podem excluir pacientes" 
  ON public.patients FOR DELETE
  USING (auth.role() = 'authenticated');

-- Função para atualizar o timestamp de atualização
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar o timestamp quando um registro for atualizado
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.patients
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
