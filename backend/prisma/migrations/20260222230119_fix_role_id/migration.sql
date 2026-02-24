-- AlterTable
CREATE SEQUENCE role_id_seq;
ALTER TABLE "Role" ALTER COLUMN "id" SET DEFAULT nextval('role_id_seq');
ALTER SEQUENCE role_id_seq OWNED BY "Role"."id";
