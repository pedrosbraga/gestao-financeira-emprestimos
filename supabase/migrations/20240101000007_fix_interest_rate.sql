-- Corrigir o tipo da coluna interest_rate para aceitar valores maiores
ALTER TABLE public.loans ALTER COLUMN interest_rate TYPE DECIMAL(6,4);