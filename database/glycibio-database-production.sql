-- ============================================================
-- GlyciBio — Base de donnees MySQL 8 (PRODUCTION — propre)
-- E-commerce aliments a IG controle + edulcorants naturels
-- Projet fil rouge DWWM — SHAABAN
--
-- Contenu : schema complet + donnees de reference reelles
--   (categories, modes de livraison, catalogue produits) + 1 compte admin.
--   AUCUNE donnee de demonstration (pas de clients fictifs, ni de commandes,
--   avis, messages ou paniers de test).
--
-- Re-jouable : les DROP en tete permettent de re-importer proprement.
--
-- --------------------------------------------------------------
-- DEPLOIEMENT
--
-- A) Hebergement mutualise (Hostinger, cPanel, phpMyAdmin) :
--    1. Creez la base + l'utilisateur via le panneau de l'hebergeur.
--    2. Importez ce fichier DANS cette base (la base est deja selectionnee) :
--         mysql -u VOTRE_USER -p VOTRE_BASE < glycibio-database-production.sql
--       (ou via l'onglet "Importer" de phpMyAdmin)
--    => Laissez le bloc "Section A" ci-dessous COMMENTE.
--
-- B) VPS / serveur dedie (OVH, root) :
--    1. DECOMMENTEZ la "Section A" (CREATE DATABASE + USER + GRANT).
--    2. Adaptez le mot de passe applicatif (DB_PASSWORD du fichier .env).
--    3. Importez :
--         mysql -u root -p < glycibio-database-production.sql
--
-- --------------------------------------------------------------
-- /!\ APRES IMPORT — SECURITE OBLIGATOIRE :
--   Compte admin par defaut :
--       email    : admin@glycibio.fr
--       password : Admin@GlyciBio2026!   <-- A CHANGER IMMEDIATEMENT
--   Changez-le depuis l'espace profil OU regenerez un hash :
--       PW='VotreMotDePasseFort' node -e \
--         "console.log(require('bcrypt').hashSync(process.env.PW,12))"
--       UPDATE users SET password='<hash>' WHERE email='admin@glycibio.fr';
-- ============================================================

SET NAMES utf8mb4;
SET sql_mode = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION';

-- ============================================================
-- Section A — OPTIONNELLE (VPS / root). Decommentez si besoin.
-- Sur hebergement mutualise : laissez COMMENTE (base creee via le panneau).
-- ============================================================
-- CREATE DATABASE IF NOT EXISTS glycibio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE glycibio;
-- CREATE USER IF NOT EXISTS 'glycibio_app'@'%' IDENTIFIED BY 'CHANGER_CE_MOT_DE_PASSE';
-- GRANT ALL PRIVILEGES ON glycibio.* TO 'glycibio_app'@'%';
-- FLUSH PRIVILEGES;

-- ============================================================
-- Nettoyage (re-import propre) — ordre inverse des dependances
-- ============================================================
SET FOREIGN_KEY_CHECKS = 0;

DROP VIEW IF EXISTS v_products_full;
DROP VIEW IF EXISTS v_admin_dashboard;
DROP VIEW IF EXISTS v_top_products;
DROP VIEW IF EXISTS v_product_ratings;

DROP PROCEDURE IF EXISTS sp_recalc_order_totals;

DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS abandoned_cart_sent;
DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS wishlist_items;
DROP TABLE IF EXISTS product_reviews;
DROP TABLE IF EXISTS contact_messages;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS shipping_methods;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS categories;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 1) categories
-- ============================================================
CREATE TABLE categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 2) users
--    - reset_token / reset_token_expires : reset de mot de passe
--    - failed_attempts / locked_until    : protection brute-force
--    - newsletter_opt_in / _at           : consentement RGPD horodate
--    - tokens_valid_after                : invalidation de session apres
--                                          changement de mot de passe
-- ============================================================
CREATE TABLE users (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  username              VARCHAR(100) NOT NULL UNIQUE,
  email                 VARCHAR(255) NOT NULL UNIQUE,
  password              VARCHAR(255) NOT NULL COMMENT 'Hash bcrypt (cout 12)',
  role                  ENUM('client','admin') NOT NULL DEFAULT 'client',
  first_name            VARCHAR(100) NULL,
  last_name             VARCHAR(100) NULL,
  address               TEXT NULL,
  phone                 VARCHAR(20) NULL,
  reset_token           VARCHAR(255) NULL,
  reset_token_expires   DATETIME NULL,
  failed_attempts       INT NOT NULL DEFAULT 0,
  locked_until          DATETIME NULL DEFAULT NULL,
  newsletter_opt_in     TINYINT(1) NOT NULL DEFAULT 0,
  newsletter_opt_in_at  DATETIME NULL DEFAULT NULL,
  tokens_valid_after    DATETIME NULL DEFAULT NULL,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role),
  INDEX idx_users_reset_token (reset_token),
  INDEX idx_users_locked_until (locked_until)
) ENGINE=InnoDB;

-- ============================================================
-- 3) products
--    - slug : URL SEO-friendly
--    - ig_category : colonne calculee (bas/moyen/eleve)
-- ============================================================
CREATE TABLE products (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(255) NOT NULL,
  slug             VARCHAR(140) NULL UNIQUE,
  description      TEXT NOT NULL,
  price            DECIMAL(10,2) NOT NULL CHECK (price > 0),
  image            VARCHAR(500) NULL,
  stock            INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  glycemic_index   INT NULL CHECK (glycemic_index BETWEEN 0 AND 110),
  ig_category ENUM('bas','moyen','eleve') GENERATED ALWAYS AS (
    CASE
      WHEN glycemic_index IS NULL THEN NULL
      WHEN glycemic_index <= 55 THEN 'bas'
      WHEN glycemic_index <= 69 THEN 'moyen'
      ELSE 'eleve'
    END
  ) STORED,
  allergens        JSON NULL,
  nutritional_info JSON NULL,
  category_id      INT NOT NULL,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_products_category (category_id),
  INDEX idx_products_ig (glycemic_index),
  INDEX idx_products_price (price),
  INDEX idx_products_active (is_active),
  FULLTEXT INDEX idx_products_search (name, description),
  CONSTRAINT chk_products_allergens_json CHECK (allergens IS NULL OR JSON_VALID(allergens)),
  CONSTRAINT chk_products_nutrition_json CHECK (nutritional_info IS NULL OR JSON_VALID(nutritional_info)),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 4) shipping_methods
-- ============================================================
CREATE TABLE shipping_methods (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(100) NOT NULL,
  price          DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  estimated_days INT NOT NULL CHECK (estimated_days > 0),
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 5) orders
-- ============================================================
CREATE TABLE orders (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  user_id            INT NOT NULL,
  subtotal           DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
  shipping_cost      DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (shipping_cost >= 0),
  total              DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (total >= 0),
  status             ENUM('en_attente','payee','en_preparation','expediee','livree','annulee') NOT NULL DEFAULT 'en_attente',
  shipping_address   TEXT NOT NULL,
  shipping_method_id INT NULL,
  stripe_session_id  VARCHAR(255) NULL,
  stripe_payment_id  VARCHAR(255) NULL,
  notes              TEXT NULL,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_orders_user (user_id),
  INDEX idx_orders_status (status),
  INDEX idx_orders_date (created_at),
  INDEX idx_orders_stripe (stripe_session_id),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_orders_shipping FOREIGN KEY (shipping_method_id) REFERENCES shipping_methods(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 6) order_items
-- ============================================================
CREATE TABLE order_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  order_id    INT NOT NULL,
  product_id  INT NOT NULL,
  quantity    INT NOT NULL CHECK (quantity > 0),
  unit_price  DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  INDEX idx_order_items_order (order_id),
  INDEX idx_order_items_product (product_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 7) cart_items
-- ============================================================
CREATE TABLE cart_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  product_id  INT NOT NULL,
  quantity    INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_cart_user_product (user_id, product_id),
  INDEX idx_cart_user (user_id),
  INDEX idx_cart_product (product_id),
  CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 8) contact_messages
-- ============================================================
CREATE TABLE contact_messages (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  subject    VARCHAR(255) NOT NULL,
  message    TEXT NOT NULL,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_contact_read (is_read),
  INDEX idx_contact_date (created_at)
) ENGINE=InnoDB;

-- ============================================================
-- 9) product_reviews
--    Status 'pending' par defaut -> moderation admin avant publication
--    UNIQUE(user_id, product_id) -> 1 avis par couple utilisateur/produit
-- ============================================================
CREATE TABLE product_reviews (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  product_id  INT NOT NULL,
  user_id     INT NOT NULL,
  rating      TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title       VARCHAR(120) NULL,
  comment     TEXT NOT NULL,
  status      ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_review_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_review_user    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT uq_review_user_product UNIQUE (user_id, product_id),
  INDEX idx_review_product_status (product_id, status),
  INDEX idx_review_status (status)
) ENGINE=InnoDB;

-- ============================================================
-- 10) wishlist_items
-- ============================================================
CREATE TABLE wishlist_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  product_id  INT NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_wishlist_user    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT fk_wishlist_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT uq_wishlist_user_product UNIQUE (user_id, product_id),
  INDEX idx_wishlist_user (user_id)
) ENGINE=InnoDB;

-- ============================================================
-- 11) product_images
--     L'image "principale" reste dans products.image (compatibilite).
--     Cette table contient les images supplementaires de la galerie.
-- ============================================================
CREATE TABLE product_images (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  product_id  INT NOT NULL,
  url         VARCHAR(500) NOT NULL,
  alt         VARCHAR(255) NULL,
  position    SMALLINT NOT NULL DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pimg_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_pimg_product (product_id, position)
) ENGINE=InnoDB;

-- ============================================================
-- 12) abandoned_cart_sent (cron paniers abandonnes)
--     Tracking pour eviter de spammer (cooldown 7 jours).
-- ============================================================
CREATE TABLE abandoned_cart_sent (
  user_id    INT NOT NULL,
  sent_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_acs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 13) settings (parametres de site cle/valeur — ex: image de fond du hero,
--     modifiable depuis la console d'administration)
-- ============================================================
CREATE TABLE settings (
  setting_key   VARCHAR(64) PRIMARY KEY,
  setting_value TEXT NULL,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO settings (setting_key, setting_value) VALUES
  ('hero_background', NULL);

-- ============================================================
-- TRIGGERS & PROCEDURE (calcul auto des totaux + verrou commandes validees)
-- ============================================================
DELIMITER $$

CREATE PROCEDURE sp_recalc_order_totals(IN p_order_id INT)
BEGIN
  DECLARE v_sub DECIMAL(10,2);
  DECLARE v_ship DECIMAL(10,2);
  SELECT COALESCE(SUM(quantity * unit_price), 0.00) INTO v_sub FROM order_items WHERE order_id = p_order_id;
  SELECT shipping_cost INTO v_ship FROM orders WHERE id = p_order_id;
  UPDATE orders SET subtotal = v_sub, total = v_sub + v_ship WHERE id = p_order_id;
END$$

CREATE TRIGGER trg_order_items_lock_insert BEFORE INSERT ON order_items FOR EACH ROW
BEGIN
  IF (SELECT status FROM orders WHERE id = NEW.order_id) IN ('payee','en_preparation','expediee','livree') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Modification interdite: commande validee';
  END IF;
END$$

CREATE TRIGGER trg_order_items_lock_update BEFORE UPDATE ON order_items FOR EACH ROW
BEGIN
  IF (SELECT status FROM orders WHERE id = NEW.order_id) IN ('payee','en_preparation','expediee','livree') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Modification interdite: commande validee';
  END IF;
END$$

CREATE TRIGGER trg_order_items_lock_delete BEFORE DELETE ON order_items FOR EACH ROW
BEGIN
  IF (SELECT status FROM orders WHERE id = OLD.order_id) IN ('payee','en_preparation','expediee','livree') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Suppression interdite: commande validee';
  END IF;
END$$

CREATE TRIGGER trg_order_items_after_insert AFTER INSERT ON order_items FOR EACH ROW
BEGIN CALL sp_recalc_order_totals(NEW.order_id); END$$

CREATE TRIGGER trg_order_items_after_update AFTER UPDATE ON order_items FOR EACH ROW
BEGIN CALL sp_recalc_order_totals(NEW.order_id); END$$

CREATE TRIGGER trg_order_items_after_delete AFTER DELETE ON order_items FOR EACH ROW
BEGIN CALL sp_recalc_order_totals(OLD.order_id); END$$

DELIMITER ;

-- ============================================================
-- DONNEES DE REFERENCE (reelles — necessaires au fonctionnement)
-- ============================================================

-- ------------------------------------------------------------
-- Categories
-- ------------------------------------------------------------
INSERT INTO categories (name, description) VALUES
  ('Cereales et feculents', 'Pates, riz, pain, farines a IG controle'),
  ('Fruits et legumes', 'Fruits frais, legumes frais et surgeles'),
  ('Produits laitiers', 'Lait, yaourts, fromages adaptes'),
  ('Boissons', 'Boissons sans sucres ajoutes, thes, eaux aromatisees'),
  ('Snacks et en-cas', 'Barres, biscuits et collations a IG bas'),
  ('Epicerie sucree', 'Confitures, chocolats, edulcorants naturels'),
  ('Epicerie salee', 'Conserves, sauces, condiments'),
  ('Complements alimentaires', 'Proteines, vitamines, complements pour sportifs'),
  ('Edulcorants naturels', 'Edulcorants naturels a IG nul ou tres faible');

SET @cat_cereales := (SELECT id FROM categories WHERE name='Cereales et feculents' LIMIT 1);
SET @cat_fruits   := (SELECT id FROM categories WHERE name='Fruits et legumes' LIMIT 1);
SET @cat_laitiers := (SELECT id FROM categories WHERE name='Produits laitiers' LIMIT 1);
SET @cat_boissons := (SELECT id FROM categories WHERE name='Boissons' LIMIT 1);
SET @cat_snacks   := (SELECT id FROM categories WHERE name='Snacks et en-cas' LIMIT 1);
SET @cat_sucree   := (SELECT id FROM categories WHERE name='Epicerie sucree' LIMIT 1);
SET @cat_salee    := (SELECT id FROM categories WHERE name='Epicerie salee' LIMIT 1);
SET @cat_compl    := (SELECT id FROM categories WHERE name='Complements alimentaires' LIMIT 1);
SET @cat_edu_nat  := (SELECT id FROM categories WHERE name='Edulcorants naturels' LIMIT 1);

-- ------------------------------------------------------------
-- Modes de livraison
-- ------------------------------------------------------------
INSERT INTO shipping_methods (name, price, estimated_days) VALUES
  ('Standard',           4.90, 5),
  ('Express',            9.90, 2),
  ('Point relais',       3.90, 4),
  ('Gratuit (+50 EUR)',  0.00, 7);

-- ------------------------------------------------------------
-- Compte administrateur (UNIQUE compte cree)
--   email    : admin@glycibio.fr
--   password : Admin@GlyciBio2026!  (hash bcrypt cout 12 ci-dessous)
--   /!\ A CHANGER IMMEDIATEMENT APRES LE PREMIER DEPLOIEMENT.
-- ------------------------------------------------------------
INSERT INTO users (username, email, password, role, first_name, last_name) VALUES
  ('admin','admin@glycibio.fr',
   '$2b$12$lywlcGeluaXEhzo2HmgMF..tZWrq238IgM0IpEikGkYKV7ltdpNei',
   'admin','Admin','GlyciBio');

-- ------------------------------------------------------------
-- Catalogue produits (25)
-- ------------------------------------------------------------
INSERT INTO products (name, description, price, image, stock, glycemic_index, allergens, nutritional_info, category_id) VALUES
('Pates completes bio','Pates de ble complet bio. Cuisson al dente pour un IG optimal.',3.50,'/uploads/products/pates-completes.webp',150,40,'["gluten"]','{"calories":350,"proteines":13,"glucides":65,"lipides":2.5,"fibres":8}',@cat_cereales),
('Riz basmati','Riz basmati a grain long. IG modere grace a sa structure amylacee.',4.20,'/uploads/products/riz-basmati.webp',200,58,NULL,'{"calories":345,"proteines":8,"glucides":77,"lipides":0.6,"fibres":1.5}',@cat_cereales),
('Pain complet aux graines','Pain complet enrichi en graines de lin, tournesol et sesame.',4.80,'/uploads/products/pain-graines.webp',50,45,'["gluten","sesame"]','{"calories":260,"proteines":10,"glucides":42,"lipides":6,"fibres":7}',@cat_cereales),
('Farine de sarrasin','Farine de sarrasin sans gluten, ideale pour galettes et crepes.',5.90,'/uploads/products/farine-sarrasin.webp',80,35,NULL,'{"calories":335,"proteines":12,"glucides":70,"lipides":2,"fibres":4}',@cat_cereales),
('Pommes Granny Smith (1kg)','Pommes fraichement croquantes et acidulees. IG tres bas.',3.90,'/uploads/products/pommes-granny.webp',100,35,NULL,'{"calories":52,"proteines":0.3,"glucides":13,"lipides":0.2,"fibres":2.4}',@cat_fruits),
('Lentilles vertes du Puy (500g)','Lentilles vertes AOP du Puy, riches en proteines vegetales.',4.50,'/uploads/products/lentilles-puy.webp',120,25,NULL,'{"calories":315,"proteines":24,"glucides":48,"lipides":1.5,"fibres":11}',@cat_fruits),
('Patates douces (1kg)','Patates douces orange, riches en beta-carotene. IG modere.',4.20,'/uploads/products/patates-douces.webp',75,61,NULL,'{"calories":86,"proteines":1.6,"glucides":20,"lipides":0.1,"fibres":3}',@cat_fruits),
('Yaourt grec nature (x4)','Yaourts grecs nature, riches en proteines, sans sucres ajoutes.',3.80,'/uploads/products/yaourt-grec.webp',60,15,'["lactose"]','{"calories":97,"proteines":9,"glucides":3,"lipides":5,"fibres":0}',@cat_laitiers),
('Lait d amande sans sucre (1L)','Lait d amande bio sans sucres ajoutes, enrichi en calcium.',2.90,'/uploads/products/lait-amande.webp',90,25,'["fruits_a_coque"]','{"calories":13,"proteines":0.4,"glucides":0.1,"lipides":1.1,"fibres":0}',@cat_laitiers),
('The vert matcha bio (100g)','The vert matcha en poudre, bio japonais. Riche en antioxydants.',12.90,'/uploads/products/matcha.webp',40,0,NULL,'{"calories":2,"proteines":0.3,"glucides":0,"lipides":0,"fibres":0}',@cat_boissons),
('Eau de coco naturelle (330ml)','Eau de coco 100% naturelle, sans sucres ajoutes.',2.50,'/uploads/products/eau-coco.webp',110,45,NULL,'{"calories":19,"proteines":0.2,"glucides":4.5,"lipides":0,"fibres":0}',@cat_boissons),
('Barres proteinees amande-cacao (x6)','Barres sans sucres ajoutes, amandes, cacao, proteines de pois.',8.90,'/uploads/products/barres-proteinees.webp',65,30,'["fruits_a_coque","soja"]','{"calories":180,"proteines":15,"glucides":12,"lipides":9,"fibres":3}',@cat_snacks),
('Crackers de sarrasin (200g)','Crackers croustillants au sarrasin et romarin. Sans gluten.',4.50,'/uploads/products/crackers-sarrasin.webp',55,35,NULL,'{"calories":380,"proteines":8,"glucides":60,"lipides":12,"fibres":5}',@cat_snacks),
('Chocolat noir 85% (100g)','Chocolat noir 85% cacao, commerce equitable. Riche en magnesium.',3.90,'/uploads/products/chocolat-85.webp',80,22,'["soja","lactose"]','{"calories":580,"proteines":11,"glucides":19,"lipides":50,"fibres":13}',@cat_sucree),
('Confiture de fraises sans sucre ajoute (300g)','Confiture 100% fruits, edulcoree a l erythritol.',5.50,'/uploads/products/confiture-fraises.webp',45,30,NULL,'{"calories":120,"proteines":0.5,"glucides":28,"lipides":0,"fibres":1}',@cat_sucree),
('Miel d acacia bio (250g)','Miel d acacia doux et liquide, l un des miels a IG le plus bas.',8.50,'/uploads/products/miel-acacia.webp',35,32,NULL,'{"calories":320,"proteines":0.3,"glucides":80,"lipides":0,"fibres":0}',@cat_sucree),
('Huile d olive extra vierge bio (500ml)','Huile d olive premiere pression a froid, origine Grece.',9.90,'/uploads/products/huile-olive.webp',70,0,NULL,'{"calories":884,"proteines":0,"glucides":0,"lipides":100,"fibres":0}',@cat_salee),
('Sauce tomate artisanale (350g)','Sauce tomate cuisinee avec herbes de Provence, sans sucres.',3.50,'/uploads/products/sauce-tomate.webp',95,15,NULL,'{"calories":30,"proteines":1.2,"glucides":5,"lipides":0.5,"fibres":1.5}',@cat_salee),
('Proteine de pois bio (500g)','Proteine de pois en poudre, 80% proteines, sans OGM.',19.90,'/uploads/products/proteine-pois.webp',30,15,'["soja"]','{"calories":370,"proteines":80,"glucides":4,"lipides":6,"fibres":2}',@cat_compl),
('Farine de coco bio (400g)','Farine de coco deshydratee, riche en fibres, sans gluten.',6.90,'/uploads/products/farine-coco.webp',50,35,NULL,'{"calories":320,"proteines":18,"glucides":22,"lipides":12,"fibres":38}',@cat_compl),
('Stevia pure en poudre (100g)','Edulcorant naturel extrait des feuilles de stevia. IG nul.',7.90,'/uploads/products/stevia-poudre.webp',100,0,NULL,'{"calories":0,"proteines":0,"glucides":0,"lipides":0,"fibres":0}',@cat_edu_nat),
('Erythritol cristallise (500g)','Polyol naturel, sans impact glycemique. Alternative au sucre.',6.50,'/uploads/products/erythritol.webp',120,0,NULL,'{"calories":0,"proteines":0,"glucides":0,"lipides":0,"fibres":0}',@cat_edu_nat),
('Monk Fruit en poudre (100g)','Edulcorant naturel extrait du fruit du moine. Sans calories.',9.50,'/uploads/products/monk-fruit.webp',60,0,NULL,'{"calories":0,"proteines":0,"glucides":0,"lipides":0,"fibres":0}',@cat_edu_nat),
('Melange Stevia et Erythritol (500g)','Melange pour une texture proche du sucre. IG nul.',7.40,'/uploads/products/stevia-erythritol.webp',85,0,NULL,'{"calories":0,"proteines":0,"glucides":0,"lipides":0,"fibres":0}',@cat_edu_nat),
('Xylitol naturel (500g)','Sucre de bouleau a IG faible. A consommer moderement.',8.90,'/uploads/products/xylitol.webp',90,12,NULL,'{"calories":240,"proteines":0,"glucides":100,"lipides":0,"fibres":0}',@cat_edu_nat);

-- ------------------------------------------------------------
-- Slug auto-genere pour chaque produit (URL SEO-friendly)
-- Format : <name-en-kebab>-<id>   ex: "pates-completes-bio-1"
-- ------------------------------------------------------------
UPDATE products
   SET slug = CONCAT(
     LOWER(
       REGEXP_REPLACE(
         REGEXP_REPLACE(
           CONVERT(name USING ascii),
           '[^a-zA-Z0-9]+', '-'
         ),
         '(^-+|-+$)', ''
       )
     ),
     '-', id
   )
 WHERE slug IS NULL OR slug = '';

-- ============================================================
-- VIEWS
-- ============================================================

CREATE OR REPLACE VIEW v_products_full AS
SELECT p.id, p.name, p.slug, p.price, p.glycemic_index, p.ig_category,
  CASE p.ig_category WHEN 'bas' THEN '#3c7a26' WHEN 'moyen' THEN '#b35e10' WHEN 'eleve' THEN '#d42b20' ELSE '#6a786e' END AS ig_color,
  p.stock, p.allergens, p.is_active, c.name AS category_name
FROM products p JOIN categories c ON p.category_id = c.id;

CREATE OR REPLACE VIEW v_admin_dashboard AS
SELECT
  (SELECT COUNT(*) FROM orders WHERE status IN ('payee','en_preparation','expediee','livree')) AS total_commandes_payees,
  (SELECT COALESCE(SUM(total), 0) FROM orders WHERE status IN ('payee','en_preparation','expediee','livree')) AS chiffre_affaires,
  (SELECT COUNT(*) FROM users WHERE role='client' AND is_active=TRUE) AS total_clients,
  (SELECT COUNT(*) FROM products WHERE is_active=TRUE) AS total_produits,
  (SELECT COUNT(*) FROM contact_messages WHERE is_read=FALSE) AS messages_non_lus,
  (SELECT COUNT(*) FROM product_reviews WHERE status='pending') AS avis_a_moderer;

CREATE OR REPLACE VIEW v_top_products AS
SELECT p.id, p.name, p.slug, SUM(oi.quantity) AS total_vendu, SUM(oi.quantity * oi.unit_price) AS revenue
FROM order_items oi
JOIN products p ON oi.product_id = p.id
JOIN orders o ON oi.order_id = o.id
WHERE o.status IN ('payee','en_preparation','expediee','livree')
GROUP BY p.id, p.name, p.slug ORDER BY total_vendu DESC;

CREATE OR REPLACE VIEW v_product_ratings AS
SELECT p.id AS product_id,
       p.name,
       p.slug,
       COUNT(r.id)                 AS reviews_count,
       ROUND(AVG(r.rating), 1)     AS avg_rating
FROM products p
LEFT JOIN product_reviews r
  ON r.product_id = p.id AND r.status = 'approved'
GROUP BY p.id, p.name, p.slug;

-- ============================================================
-- VERIFICATION FINALE
-- ============================================================
SELECT 'Base glycibio PRODUCTION creee avec succes !' AS status;
SELECT CONCAT(COUNT(*), ' categories')         AS data FROM categories;
SELECT CONCAT(COUNT(*), ' produits')           AS data FROM products;
SELECT CONCAT(COUNT(*), ' modes de livraison') AS data FROM shipping_methods;
SELECT CONCAT(COUNT(*), ' utilisateur(s)')     AS data FROM users;
