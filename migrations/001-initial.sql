-- Solo para una base nueva y vacía. El runner ejecuta todo en una transacción.
CREATE TABLE public.usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL CHECK (char_length(btrim(nombre)) BETWEEN 2 AND 80),
  email VARCHAR(120) NOT NULL UNIQUE,
  "passwordHash" VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL
);
CREATE TYPE public.enum_pedidos_estado AS ENUM ('pendiente', 'pagado', 'cancelado');
CREATE TABLE public.pedidos (
  id SERIAL PRIMARY KEY,
  producto VARCHAR(120) NOT NULL CHECK (char_length(btrim(producto)) > 0),
  cantidad INTEGER NOT NULL CHECK (cantidad >= 1),
  total DECIMAL(12,2) NOT NULL CHECK (total >= 0),
  estado public.enum_pedidos_estado NOT NULL DEFAULT 'pendiente',
  "usuarioId" INTEGER NOT NULL REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL
);
CREATE INDEX pedidos_usuario_id ON public.pedidos ("usuarioId");
