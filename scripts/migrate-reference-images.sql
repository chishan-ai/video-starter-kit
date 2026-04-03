-- Migrate referenceImages from string[] to {url, angle, label?}[]
-- Run against Supabase Postgres directly via SQL Editor
-- Safe to run multiple times (idempotent — checks for string type)

UPDATE characters
SET reference_images = (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'url', elem::text,
        'angle', 'front'
      )
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements_text(reference_images) elem
)
WHERE jsonb_typeof(reference_images) = 'array'
  AND jsonb_array_length(reference_images) > 0
  AND jsonb_typeof(reference_images -> 0) = 'string';
