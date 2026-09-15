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

-- אבטחה. בלי השורות האלה הטבלה חשופה דרך PostgREST לכל מי שמחזיק את מפתח ה-anon של הפרויקט,
-- והוא מפתח שנועד להיות ציבורי. Supabase סימן את זה כ-ERROR (rls_disabled_in_public) ב-15.9.2026.
-- n8n מתחבר עם service_role (ראו scripts/create-credentials.sh), ו-service_role עוקף RLS,
-- ולכן WF5-core, WF6 ו-WF7 ממשיכים לעבוד בדיוק כמו קודם. אין policy בכוונה: אף אחד מלבד
-- service_role לא אמור לגעת במאגר הווקטורי.
alter table documents enable row level security;
revoke all on documents from anon, authenticated;
revoke execute on function match_documents(vector, int, jsonb) from anon, authenticated;

-- search_path נעול: בלי זה הפונקציה פותרת שמות לפי ה-search_path של הקורא,
-- ומי שיכול ליצור סכימה משלו יכול להחליף את מה ש-`documents` מצביע אליו. (WARN 0011)
alter function match_documents(vector, int, jsonb) set search_path = public, pg_temp;
