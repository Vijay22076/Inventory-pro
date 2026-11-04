import mongoose from "mongoose";

const MONGO_URI = "mongodb://127.0.0.1:27017/IMS";

async function run() {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;
    const productsColl = db.collection("products");

    // Map by keyword matching product_name
    const keywordGalleries = [
        {
            regex: /MacBook/i,
            images: [
                "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&auto=format&fit=crop&q=80",
            ],
        },
        {
            regex: /iPhone/i,
            images: [
                "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1511707171634-5f897ff02560?w=800&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&auto=format&fit=crop&q=80",
            ],
        },
        {
            regex: /Headphone|Sony WH/i,
            images: [
                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80",
            ],
        },
        {
            regex: /Nike|Shoe|Sneaker/i,
            images: [
                "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&auto=format&fit=crop&q=80",
            ],
        },
        {
            regex: /Bag|Backpack|Messenger/i,
            images: [
                "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&auto=format&fit=crop&q=80",
            ],
        },
        {
            regex: /Coffee|Espresso/i,
            images: [
                "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80",
            ],
        },
        {
            regex: /Chair|Desk/i,
            images: [
                "https://images.unsplash.com/photo-1580481077195-c22ae4534c79?w=800&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=800&auto=format&fit=crop&q=80",
            ],
        },
        {
            regex: /Cleanser|Face Wash|Moisturizer/i,
            images: [
                "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1608248597359-59754a65bb91?w=800&auto=format&fit=crop&q=80",
            ],
        },
    ];

    const allProducts = await productsColl.find({}).toArray();
    console.log(`Processing ${allProducts.length} products...`);

    let multiCount = 0;
    for (const prod of allProducts) {
        let matchedGallery = null;
        for (const kg of keywordGalleries) {
            if (kg.regex.test(prod.product_name)) {
                matchedGallery = kg.images;
                break;
            }
        }

        const imagesToSet = matchedGallery || (prod.product_image && prod.product_image !== "default-product.png"
            ? [prod.product_image]
            : []);

        if (imagesToSet.length > 1) {
            multiCount++;
            console.log(`  Set ${imagesToSet.length} images for: ${prod.product_name} (${prod.product_code})`);
        }

        await productsColl.updateOne(
            { _id: prod._id },
            {
                $set: {
                    product_images: imagesToSet,
                    product_image: imagesToSet[0] || prod.product_image || "default-product.png",
                },
            }
        );
    }

    console.log(`Successfully configured multi-image galleries for ${multiCount} products across categories!`);
    await mongoose.disconnect();
}

run().catch(console.error);
