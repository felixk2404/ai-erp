-- מאגר וקטורי ל-RAG. תואם לצומת Supabase Vector Store של n8n.
-- הרצה: psql "$SUPABASE_DB_URL" -f n8n/supabase.sql   (או הדבקה ב-SQL Editor)
create extension if not exists vector;

create table if not exists documents (
  id bigserial primary key,
  content text,
  metadata jsonb,
  embedding vector(1536)
);

create or replace function match_documents (
  query_embedding vector(1536),
  match_count int default null,
  filter jsonb default '{}'
) returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where documents.metadata @> filter
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;

create index if not exists documents_embedding_idx
  on documents using hnsw (embedding vector_cosine_ops);
