import { db } from "../src/core/database.js";
import bcrypt from "bcrypt";
import * as dotenv from "dotenv";

dotenv.config();

// Hash for password 'JuryTest2026!'
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync("JuryTest2026!", 12);

async function run() {
    console.log("==================================================");
    console.log("Starting GlyciBio Demo Database Seeding...");
    console.log("==================================================");

    try {
        // 1. Get Categories IDs
        const [categories] = await db.query("SELECT id, name FROM categories");
        const categoryMap = {};
        categories.forEach(c => {
            categoryMap[c.name] = c.id;
        });

        const catEpicerieSucree = categoryMap["Epicerie sucree"];
        const catCereales = categoryMap["Cereales et feculents"];
        const catBoissons = categoryMap["Boissons"];
        const catLaitiers = categoryMap["Produits laitiers"];

        if (!catEpicerieSucree) {
            throw new Error("Required category 'Epicerie sucree' not found. Please run base schema import first.");
        }

        // 2. Insert Dummy Products (if not already exists)
        console.log("--> Inserting dummy products...");
        
        const dummyProducts = [
            {
                name: "Pate a Tartiner Noisette-Cacao IG Bas",
                slug: "pate-a-tartiner-noisette-cacao-ig-bas-demo",
                description: "Une delicieuse pate a tartiner bio aux noisettes et cacao, edulcoree naturellement a l'erythritol. Sans sucres ajoutes et a index glycemique tres bas (IG 5). Parfait pour les tartines du matin sans pic d'insuline.",
                price: 5.90,
                image: "/uploads/products/pate-noisette-ig-bas.webp",
                stock: 80,
                glycemic_index: 5,
                allergens: JSON.stringify(["fruits_a_coque"]),
                nutritional_info: JSON.stringify({ calories: 450, proteines: 8, glucides: 14, lipides: 39, fibres: 12 }),
                category_id: catEpicerieSucree
            },
            {
                name: "Chocolat Noir 90% aux eclats d'Amandes",
                slug: "chocolat-noir-90-aux-eclats-d-amandes-demo",
                description: "Une tablette de chocolat noir intense a 90% de cacao biologique, agrementee d'eclats d'amandes croquantes. Parfait pour une pause gourmande a IG bas (IG 15), riche en antioxydants et en magnesium.",
                price: 3.90,
                image: "/uploads/products/chocolat-amandes-ig-bas.webp",
                stock: 120,
                glycemic_index: 15,
                allergens: JSON.stringify(["fruits_a_coque", "soja"]),
                nutritional_info: JSON.stringify({ calories: 590, proteines: 10, glucides: 12, lipides: 53, fibres: 14 }),
                category_id: catEpicerieSucree
            }
        ];

        const productIds = {};
        for (const p of dummyProducts) {
            const [existing] = await db.query("SELECT id FROM products WHERE slug = ?", [p.slug]);
            if (existing.length > 0) {
                console.log(`Product '${p.name}' already exists with ID ${existing[0].id}.`);
                productIds[p.slug] = existing[0].id;
            } else {
                const [res] = await db.query(
                    `INSERT INTO products (name, slug, description, price, image, stock, glycemic_index, allergens, nutritional_info, category_id, is_active) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true)`,
                    [p.name, p.slug, p.description, p.price, p.image, p.stock, p.glycemic_index, p.allergens, p.nutritional_info, p.category_id]
                );
                console.log(`Created product '${p.name}' with ID ${res.insertId}`);
                productIds[p.slug] = res.insertId;
            }
        }

        // Get some other existing products for orders
        const [existingProds] = await db.query("SELECT id, price, name FROM products LIMIT 5");
        
        // 3. Insert Dummy Users (Clients)
        console.log("--> Inserting dummy clients...");
        const dummyUsers = [
            { username: "jean_dupont", email: "jean.dupont@example.com", first_name: "Jean", last_name: "Dupont" },
            { username: "marie_martin", email: "marie.martin@example.com", first_name: "Marie", last_name: "Martin" },
            { username: "sophie_lefevre", email: "sophie.lefevre@example.com", first_name: "Sophie", last_name: "Lefèvre" }
        ];

        const userIds = {};
        for (const u of dummyUsers) {
            const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [u.email]);
            if (existing.length > 0) {
                console.log(`User '${u.email}' already exists with ID ${existing[0].id}.`);
                userIds[u.username] = existing[0].id;
            } else {
                const [res] = await db.query(
                    `INSERT INTO users (username, email, password, role, first_name, last_name, address, phone, is_active)
                     VALUES (?, ?, ?, 'client', ?, ?, '12 Rue de la Paix, 75002 Paris', '0612345678', true)`,
                    [u.username, u.email, DEFAULT_PASSWORD_HASH, u.first_name, u.last_name]
                );
                console.log(`Created user '${u.email}' with ID ${res.insertId} (Password: JuryTest2026!)`);
                userIds[u.username] = res.insertId;
            }
        }

        // 4. Insert Dummy Orders
        console.log("--> Inserting dummy orders...");
        
        // Get shipping methods
        const [shippingMethods] = await db.query("SELECT id, name, price FROM shipping_methods");
        const standardShipping = shippingMethods.find(s => s.name.includes("Standard")) || shippingMethods[0];
        const freeShipping = shippingMethods.find(s => s.name.includes("Gratuit")) || shippingMethods[0];

        const dummyOrders = [
            {
                username: "jean_dupont",
                status: "payee",
                shipping_address: "12 Rue de la Paix, 75002 Paris",
                shipping_method_id: standardShipping.id,
                shipping_cost: standardShipping.price,
                created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
                items: [
                    { product_id: productIds["pate-a-tartiner-noisette-cacao-ig-bas-demo"], quantity: 2, unit_price: 5.90 },
                    { product_id: existingProds[0].id, quantity: 1, unit_price: existingProds[0].price }
                ]
            },
            {
                username: "marie_martin",
                status: "expediee",
                shipping_address: "45 Avenue des Champs-Élysées, 75008 Paris",
                shipping_method_id: freeShipping.id,
                shipping_cost: 0.00,
                created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
                items: [
                    { product_id: productIds["chocolat-noir-90-aux-eclats-d-amandes-demo"], quantity: 5, unit_price: 3.90 },
                    { product_id: productIds["pate-a-tartiner-noisette-cacao-ig-bas-demo"], quantity: 6, unit_price: 5.90 }
                ]
            },
            {
                username: "sophie_lefevre",
                status: "remboursee",
                shipping_address: "8 Rue de l'Église, 69002 Lyon",
                shipping_method_id: standardShipping.id,
                shipping_cost: standardShipping.price,
                created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
                items: [
                    { product_id: existingProds[1].id, quantity: 1, unit_price: existingProds[1].price }
                ]
            },
            {
                username: "jean_dupont",
                status: "en_preparation",
                shipping_address: "12 Rue de la Paix, 75002 Paris",
                shipping_method_id: standardShipping.id,
                shipping_cost: standardShipping.price,
                created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
                items: [
                    { product_id: productIds["pate-a-tartiner-noisette-cacao-ig-bas-demo"], quantity: 1, unit_price: 5.90 },
                    { product_id: productIds["chocolat-noir-90-aux-eclats-d-amandes-demo"], quantity: 2, unit_price: 3.90 }
                ]
            },
            {
                username: "marie_martin",
                status: "en_attente",
                shipping_address: "45 Avenue des Champs-Élysées, 75008 Paris",
                shipping_method_id: standardShipping.id,
                shipping_cost: standardShipping.price,
                created_at: new Date(), // Today
                items: [
                    { product_id: existingProds[2].id, quantity: 2, unit_price: existingProds[2].price }
                ]
            }
        ];

        for (const o of dummyOrders) {
            const userId = userIds[o.username];

            // 1. Create the order in 'en_attente' status to avoid triggering the 'Modification interdite' exception on order_items insert
            const [orderRes] = await db.query(
                `INSERT INTO orders (user_id, subtotal, shipping_cost, total, status, shipping_address, shipping_method_id, created_at, updated_at)
                 VALUES (?, 0.00, ?, 0.00, 'en_attente', ?, ?, ?, ?)`,
                [userId, o.shipping_cost, o.shipping_address, o.shipping_method_id, o.created_at, o.created_at]
            );

            const orderId = orderRes.insertId;

            // 2. Insert order items. The database triggers will automatically update subtotal and total on the orders table
            for (const item of o.items) {
                await db.query(
                    `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
                     VALUES (?, ?, ?, ?)`,
                    [orderId, item.product_id, item.quantity, item.unit_price]
                );
            }

            // 3. Finally, update the order to the actual target status and set the correct timestamp
            await db.query(
                `UPDATE orders SET status = ?, created_at = ?, updated_at = ? WHERE id = ?`,
                [o.status, o.created_at, o.created_at, orderId]
            );
            console.log(`Created order #${orderId} for '${o.username}' (${o.status})`);
        }

        // 5. Insert Dummy Reviews
        console.log("--> Inserting dummy product reviews...");
        const dummyReviews = [
            {
                product_id: productIds["chocolat-noir-90-aux-eclats-d-amandes-demo"],
                username: "jean_dupont",
                rating: 5,
                title: "Excellent chocolat !",
                comment: "Très intense en cacao, et les éclats d'amandes apportent un super croquant. Un délice sans culpabilité pour mon diabète.",
                status: "approved"
            },
            {
                product_id: productIds["pate-a-tartiner-noisette-cacao-ig-bas-demo"],
                username: "marie_martin",
                rating: 4,
                title: "Très bonne alternative",
                comment: "Le goût de noisette est bien présent. Moins sucré qu'une pâte classique mais c'est parfait pour s'habituer à l'IG bas.",
                status: "approved"
            },
            {
                product_id: productIds["pate-a-tartiner-noisette-cacao-ig-bas-demo"],
                username: "sophie_lefevre",
                rating: 5,
                title: "Incroyable, texture parfaite",
                comment: "Je n'en reviens pas que ce soit sans sucre. La texture est super onctueuse. J'adore !",
                status: "pending" // Admin can approve this one during demo
            },
            {
                product_id: productIds["chocolat-noir-90-aux-eclats-d-amandes-demo"],
                username: "sophie_lefevre",
                rating: 2,
                title: "Un peu trop amer",
                comment: "C'est du 90% donc c'est normal, mais personnellement je préfère le chocolat un peu plus doux.",
                status: "pending" // Admin can reject or approve this
            }
        ];

        for (const r of dummyReviews) {
            const userId = userIds[r.username];
            // Check if review already exists
            const [existing] = await db.query(
                "SELECT id FROM product_reviews WHERE user_id = ? AND product_id = ?",
                [userId, r.product_id]
            );

            if (existing.length > 0) {
                console.log(`Review by user ${userId} on product ${r.product_id} already exists.`);
            } else {
                await db.query(
                    `INSERT INTO product_reviews (product_id, user_id, rating, title, comment, status)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [r.product_id, userId, r.rating, r.title, r.comment, r.status]
                );
                console.log(`Created review by '${r.username}' on product ID ${r.product_id} (Status: ${r.status})`);
            }
        }

        // 6. Insert Dummy Contact Messages
        console.log("--> Inserting dummy contact messages...");
        const dummyMessages = [
            {
                name: "Lucas Bernard",
                email: "lucas.bernard@example.com",
                subject: "Question sur la livraison en Belgique",
                message: "Bonjour, je réside à Bruxelles et je souhaiterais savoir si vous livrez également en Belgique et quels sont les tarifs de livraison. Merci !",
                is_read: false
            },
            {
                name: "Julie Richard",
                email: "j.richard@organic-miel.fr",
                subject: "Proposition de partenariat local",
                message: "Bonjour, nous sommes des apiculteurs bio basés dans le Nord de la France. Nous proposons des miels d'acacia et de fleurs sauvages à IG modéré et nous aimerions savoir s'il est possible de référencer nos produits sur votre boutique GlyciBio. Cordialement.",
                is_read: true
            }
        ];

        for (const m of dummyMessages) {
            // Check if message already exists
            const [existing] = await db.query(
                "SELECT id FROM contact_messages WHERE email = ? AND subject = ?",
                [m.email, m.subject]
            );

            if (existing.length > 0) {
                console.log(`Message from ${m.email} with subject '${m.subject}' already exists.`);
            } else {
                await db.query(
                    `INSERT INTO contact_messages (name, email, subject, message, is_read)
                     VALUES (?, ?, ?, ?, ?)`,
                    [m.name, m.email, m.subject, m.message, m.is_read]
                );
                console.log(`Created contact message from '${m.name}' (Is Read: ${m.is_read})`);
            }
        }

        console.log("==================================================");
        console.log("SUCCESS: GlyciBio Demo Database Seeded Successfully!");
        console.log("Demo Clients Password: JuryTest2026!");
        console.log("==================================================");

    } catch (error) {
        console.error("CRITICAL ERROR during database seeding:", error);
    } finally {
        // End db connection
        await db.end();
    }
}

run();
