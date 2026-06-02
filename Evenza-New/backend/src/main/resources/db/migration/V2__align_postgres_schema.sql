DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'movies'
    ) THEN
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'movies'
              AND column_name = 'cast'
        ) AND NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'movies'
              AND column_name = 'cast_members'
        ) THEN
            EXECUTE 'ALTER TABLE public.movies RENAME COLUMN "cast" TO cast_members';
        ELSIF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'movies'
              AND column_name = 'cast_members'
        ) THEN
            EXECUTE 'ALTER TABLE public.movies ADD COLUMN cast_members json';
        END IF;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'bookings'
          AND column_name = 'user_id'
          AND data_type <> 'integer'
    ) THEN
        EXECUTE $sql$
            ALTER TABLE public.bookings
            ALTER COLUMN user_id TYPE integer
            USING CASE
                WHEN user_id IS NULL OR trim(user_id::text) = '' THEN NULL
                ELSE user_id::integer
            END
        $sql$;
    END IF;
END $$;
