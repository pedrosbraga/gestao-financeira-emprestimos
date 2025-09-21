-- Functions and Triggers for Gestão Financeira de Empréstimos

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON public.loans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_payments_updated_at BEFORE UPDATE ON public.monthly_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate remaining balance after payment
CREATE OR REPLACE FUNCTION update_loan_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Update remaining balance when a payment is made
    IF TG_OP = 'INSERT' THEN
        UPDATE public.loans 
        SET remaining_balance = remaining_balance - NEW.principal_amount
        WHERE id = NEW.loan_id;
        
        -- Update loan status if fully paid
        UPDATE public.loans 
        SET status = 'QUITADO'
        WHERE id = NEW.loan_id AND remaining_balance <= 0;
        
        RETURN NEW;
    END IF;
    
    -- Handle payment updates
    IF TG_OP = 'UPDATE' THEN
        UPDATE public.loans 
        SET remaining_balance = remaining_balance + OLD.principal_amount - NEW.principal_amount
        WHERE id = NEW.loan_id;
        
        -- Update loan status
        UPDATE public.loans 
        SET status = CASE 
            WHEN remaining_balance <= 0 THEN 'QUITADO'
            ELSE 'ATIVO'
        END
        WHERE id = NEW.loan_id;
        
        RETURN NEW;
    END IF;
    
    -- Handle payment deletion
    IF TG_OP = 'DELETE' THEN
        UPDATE public.loans 
        SET remaining_balance = remaining_balance + OLD.principal_amount,
            status = 'ATIVO'
        WHERE id = OLD.loan_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Apply balance update trigger
CREATE TRIGGER update_loan_balance_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION update_loan_balance();

-- Function to generate monthly payments when loan is created
CREATE OR REPLACE FUNCTION generate_monthly_payments()
RETURNS TRIGGER AS $$
DECLARE
    monthly_interest DECIMAL(15,2);
    base_date DATE;
    months_count INTEGER := 12; -- Generate 12 months ahead
BEGIN
    -- Calculate monthly interest
    monthly_interest := (NEW.amount * NEW.interest_rate / 100) / 12;
    base_date := NEW.start_date;
    
    -- Generate monthly payment records
    FOR i IN 1..months_count LOOP
        INSERT INTO public.monthly_payments (
            loan_id,
            due_date,
            interest_amount
        ) VALUES (
            NEW.id,
            base_date + INTERVAL '1 month' * i,
            monthly_interest
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply monthly payments generation trigger
CREATE TRIGGER generate_monthly_payments_trigger
    AFTER INSERT ON public.loans
    FOR EACH ROW EXECUTE FUNCTION generate_monthly_payments();

-- Function to mark monthly payment as paid
CREATE OR REPLACE FUNCTION mark_monthly_payment_paid()
RETURNS TRIGGER AS $$
BEGIN
    -- When a payment is made, mark corresponding monthly payment as paid
    UPDATE public.monthly_payments 
    SET 
        is_paid = TRUE,
        paid_date = NEW.created_at,
        payment_id = NEW.id,
        received_by = NEW.received_by,
        principal_amount = NEW.principal_amount
    WHERE 
        loan_id = NEW.loan_id 
        AND DATE_TRUNC('month', due_date) = DATE_TRUNC('month', NEW.payment_date)
        AND NOT is_paid;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply monthly payment marking trigger
CREATE TRIGGER mark_monthly_payment_paid_trigger
    AFTER INSERT ON public.payments
    FOR EACH ROW EXECUTE FUNCTION mark_monthly_payment_paid();

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_log (table_name, record_id, action, new_values, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_log (table_name, record_id, action, old_values, new_values, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_log (table_name, record_id, action, old_values, user_id)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), auth.uid());
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Apply audit triggers to all main tables
CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_clients_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_loans_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.loans
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_payments_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();