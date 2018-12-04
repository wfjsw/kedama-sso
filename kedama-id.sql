CREATE TABLE "T_users" (
"id" serial4 NOT NULL,
"username" text NOT NULL,
"password" bytea NOT NULL,
"salt" bytea,
"token" char(32) NOT NULL,
"password_changed" timestamp,
PRIMARY KEY ("id") ,
CONSTRAINT "username" UNIQUE ("username"),
CONSTRAINT "token" UNIQUE ("token")
)
WITHOUT OIDS;
CREATE UNIQUE INDEX "lower_username" ON "T_users" (LOWER("username") ASC NULLS LAST);
CREATE UNIQUE INDEX "I_user_token" ON "T_users" ("token" ASC NULLS LAST);

CREATE TABLE "T_binding_minecraft" (
"uuid" char(32) NOT NULL,
"user_id" int4 NOT NULL,
PRIMARY KEY ("uuid") ,
CONSTRAINT "user_id" UNIQUE ("user_id")
)
WITHOUT OIDS;
CREATE TABLE "T_binding_telegram" (
"id" int4 NOT NULL,
"user_id" int4 NOT NULL,
PRIMARY KEY ("id") ,
CONSTRAINT "telegram_id" UNIQUE ("user_id")
)
WITHOUT OIDS;
CREATE TABLE "T_oauth_clients" (
"client_id" char(16) NOT NULL,
"client_secret" char(32) NOT NULL,
"app_name" text NOT NULL,
"homepage_url" text,
"callback_url" text,
"owner" int4 NOT NULL,
"time" timestamp NOT NULL,
PRIMARY KEY ("client_id") 
)
WITHOUT OIDS;
CREATE INDEX "I_client_owner" ON "T_oauth_clients" ("owner" ASC NULLS LAST);

CREATE TABLE "T_oauth_tokens" (
"access_token" char(32) NOT NULL,
"issue_on" timestamp NOT NULL,
"user_id" int4 NOT NULL,
"client_id" char(16) NOT NULL,
"last_accessed" timestamp,
"authorization_code" text,
PRIMARY KEY ("access_token") ,
CONSTRAINT "auth_code" UNIQUE ("client_id", "authorization_code")
)
WITHOUT OIDS;
CREATE INDEX "I_user_id" ON "T_oauth_tokens" ("user_id" ASC NULLS LAST);
CREATE UNIQUE INDEX "I_auth_code" ON "T_oauth_tokens" ("authorization_code" ASC NULLS LAST, "client_id" ASC NULLS LAST);
CREATE INDEX "I_client_id" ON "T_oauth_tokens" ("client_id" ASC NULLS LAST);

CREATE TABLE "T_binding_bbs" (
"id" int4 NOT NULL,
"user_id" int4 NOT NULL,
"name" text,
PRIMARY KEY ("id") 
)
WITHOUT OIDS;
CREATE TABLE "T_session" (
"sid" text NOT NULL,
"sess" json NOT NULL,
"expire" timestamp(6) NOT NULL,
PRIMARY KEY ("sid") 
)
WITHOUT OIDS;

ALTER TABLE "T_binding_minecraft" ADD CONSTRAINT "fk_T_binding_mojang_T_users_1" FOREIGN KEY ("user_id") REFERENCES "T_users" ("id") ON DELETE CASCADE;
ALTER TABLE "T_binding_telegram" ADD CONSTRAINT "fk_T_binding_telegram_T_users_1" FOREIGN KEY ("user_id") REFERENCES "T_users" ("id") ON DELETE CASCADE;
ALTER TABLE "T_oauth_clients" ADD CONSTRAINT "fk_T_oauth_clients_T_users_1" FOREIGN KEY ("owner") REFERENCES "T_users" ("id") ON DELETE CASCADE;
ALTER TABLE "T_oauth_tokens" ADD CONSTRAINT "fk_T_oauth_tokens_T_users_1" FOREIGN KEY ("user_id") REFERENCES "T_users" ("id") ON DELETE CASCADE;
ALTER TABLE "T_binding_bbs" ADD CONSTRAINT "fk_T_binding_bbs_T_users_1" FOREIGN KEY ("user_id") REFERENCES "T_users" ("id") ON DELETE CASCADE;
ALTER TABLE "T_oauth_tokens" ADD CONSTRAINT "fk_T_oauth_tokens_T_oauth_clients_1" FOREIGN KEY ("client_id") REFERENCES "T_oauth_clients" ("client_id");

