import { neon } from '@neondatabase/serverless';

// Lazy initialization: não executa no momento do import (evita falha no build)
function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(url);
}

export default getDb;

export async function setupDatabase() {
  const sql = getDb();
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS obras (
        id SERIAL PRIMARY KEY,
        codigo TEXT,
        nome TEXT NOT NULL,
        cliente TEXT,
        local_obra TEXT,
        cidade TEXT,
        estado TEXT,
        status TEXT DEFAULT 'Em andamento',
        avanco INTEGER DEFAULT 0,
        inicio DATE,
        prazo INTEGER DEFAULT 20,
        contrato NUMERIC DEFAULT 0,
        extra_cliente NUMERIC DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS fornecedores (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        cnpj TEXT,
        especialidade TEXT,
        tel TEXT,
        email TEXT,
        responsavel TEXT,
        cidade TEXT,
        estado TEXT,
        obs TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS contratacoes (
        id SERIAL PRIMARY KEY,
        obra_id INTEGER REFERENCES obras(id) ON DELETE CASCADE,
        fornecedor_id INTEGER REFERENCES fornecedores(id) ON DELETE CASCADE,
        categoria TEXT,
        valor NUMERIC DEFAULT 0,
        extra NUMERIC DEFAULT 0,
        obs TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS aditivos (
        id SERIAL PRIMARY KEY,
        obra_id INTEGER REFERENCES obras(id) ON DELETE CASCADE,
        fornecedor_id INTEGER REFERENCES fornecedores(id) ON DELETE SET NULL,
        descricao TEXT,
        valor NUMERIC DEFAULT 0,
        data_aditivo DATE DEFAULT CURRENT_DATE,
        aprovado_por TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS avaliacoes (
        id SERIAL PRIMARY KEY,
        obra_id INTEGER REFERENCES obras(id) ON DELETE CASCADE,
        fornecedor_id INTEGER REFERENCES fornecedores(id) ON DELETE CASCADE,
        qualidade NUMERIC DEFAULT 0,
        prazo NUMERIC DEFAULT 0,
        custo NUMERIC DEFAULT 0,
        limpeza NUMERIC DEFAULT 0,
        seguranca NUMERIC DEFAULT 0,
        gestao NUMERIC DEFAULT 0,
        obs TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
  } catch (e) {
    console.error('Database setup error:', e);
    throw e;
  }
}
