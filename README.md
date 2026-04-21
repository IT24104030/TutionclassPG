# tuition-marketing-management

Split from the original Tuition Management project.

## Included scope
- Marketing Management
- Shared JWT authentication files
- Module specific database schema in `database/module_schema.sql`

## Main endpoints
- `/auth/**`
- `/marketing/**`

## Run
```bash
mvn spring-boot:run
```

Default port: `8084`

## Environment variables
- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`

## Notes
- This split is based on your current backend structure.
- Shared auth/security files were included in every module so each repo can run independently.
- Frontend was not split into these 6 backend service packages.
