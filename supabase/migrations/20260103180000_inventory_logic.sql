-- Create missing tables

-- INVENTORY
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    pharmacy_id UUID REFERENCES public.profiles(id) NOT NULL,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for Inventory
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pharmacies can view own inventory"
    ON public.inventory FOR SELECT
    USING (auth.uid() = pharmacy_id);

CREATE POLICY "Pharmacies can insert own inventory"
    ON public.inventory FOR INSERT
    WITH CHECK (auth.uid() = pharmacy_id);

CREATE POLICY "Pharmacies can update own inventory"
    ON public.inventory FOR UPDATE
    USING (auth.uid() = pharmacy_id);

-- BILLS
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    pharmacy_id UUID REFERENCES public.profiles(id) NOT NULL,
    patient_id UUID REFERENCES public.profiles(id) NOT NULL,
    order_id UUID REFERENCES public.orders(id),
    items JSONB NOT NULL, -- Array of objects
    total_amount NUMERIC(10, 2) NOT NULL,
    status TEXT DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for Bills
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pharmacies can view own bills"
    ON public.bills FOR SELECT
    USING (auth.uid() = pharmacy_id);

CREATE POLICY "Pharmacies can insert own bills"
    ON public.bills FOR INSERT
    WITH CHECK (auth.uid() = pharmacy_id);

CREATE POLICY "Patients can view their bills"
    ON public.bills FOR SELECT
    USING (auth.uid() = patient_id);

-- MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES auth.users(id) NOT NULL,
    receiver_id UUID REFERENCES auth.users(id) NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their messages"
    ON public.messages FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
    ON public.messages FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

-- PATIENT_PHARMACIES (Connections)
CREATE TABLE IF NOT EXISTS public.patient_pharmacies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID REFERENCES public.profiles(id) NOT NULL,
    pharmacy_id UUID REFERENCES public.profiles(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(patient_id, pharmacy_id)
);

-- RLS for Connections
ALTER TABLE public.patient_pharmacies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their connections"
    ON public.patient_pharmacies FOR SELECT
    USING (auth.uid() = patient_id OR auth.uid() = pharmacy_id);

-- ATOMIC TRANSACTION FUNCTION
CREATE OR REPLACE FUNCTION public.process_bill_transaction(
    p_order_id UUID,
    p_patient_id UUID,
    p_items JSONB,
    p_total_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_pharmacy_id UUID;
    v_item JSONB;
    v_inv_id UUID;
    v_current_qty INTEGER;
    v_item_name TEXT;
    v_item_qty INTEGER;
    v_bill_id UUID;
BEGIN
    v_pharmacy_id := auth.uid();
    
    -- validate pharmacy_id
    IF v_pharmacy_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Create Bill
    INSERT INTO public.bills (pharmacy_id, patient_id, order_id, items, total_amount, status)
    VALUES (v_pharmacy_id, p_patient_id, p_order_id, p_items, p_total_amount, 'unpaid')
    RETURNING id INTO v_bill_id;

    -- Process Inventory
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_item_name := v_item->>'name';
        v_item_qty := (v_item->>'quantity')::INTEGER;

        -- Lock inventory row
        SELECT id, quantity INTO v_inv_id, v_current_qty
        FROM public.inventory
        WHERE pharmacy_id = v_pharmacy_id AND name = v_item_name
        FOR UPDATE;

        IF v_inv_id IS NULL THEN
             RAISE EXCEPTION 'Item not found in inventory: %', v_item_name;
        END IF;

        IF v_current_qty < v_item_qty THEN
            RAISE EXCEPTION 'Insufficient stock for item: %. Available: %, Requested: %', v_item_name, v_current_qty, v_item_qty;
        END IF;

        -- Update quantity
        UPDATE public.inventory
        SET quantity = quantity - v_item_qty,
            updated_at = now()
        WHERE id = v_inv_id;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'bill_id', v_bill_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
