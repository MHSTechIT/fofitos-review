-- FOFiTOS Seed Data
-- Run AFTER schema.sql in the Supabase SQL Editor

-- Categories
INSERT INTO categories (id, name, description, img, sort_order) VALUES
('burgers',       'Burgers',       'Bold flavours, honest ingredients',      '/images/chicken_tikka_burger.png',          1),
('sandwiches',    'Sandwiches',    'Crisp, fresh & grilled to perfection',   '/images/chicken_club_sandwich.png',         2),
('rice_bowls',    'Rice Bowls',    'Nourishing rice-based power bowls',      '/images/tex_mex_chicken_bowl.png',          3),
('healthy_bowls', 'Healthy Bowls', 'Nutrient-packed wellness bowls',         '/images/mixed_fruit_healthy_bowl.png',      4),
('sauces',        'Sauces',        'House-made dips & dressings',            '/images/basil_pesto_sause.png',             5),
('wraps',         'Wraps',         'Whole-grain wrapped goodness',           '/images/peri_peri_panner_wrap.png',         6),
('overnight_oats','Overnight Oats','Slow-prep, nutrient-rich breakfasts',    '/images/mixed_fruits_coconut_oats_jar.png', 7),
('beverages',     'Beverages',     'Cold, fresh & wholesome drinks',         '/images/watermelon_beverages.png',          8);

-- Products
INSERT INTO products (cat, name, img, tagline, price, rating, reviews, tags, cal, pro, carb, fat, fibre, nutrition, ingr, revs) VALUES

-- BURGERS
('burgers','Chicken Tikka Burger','/images/chicken_tikka_burger.png','Marinated tikka chicken with mint chutney.','₹269',4.6,85,
'["No Refined Oil","No MSG","No Maida"]',450,28,42,16,4,
'[{"n":"Total Fat","v":"16 g","p":55,"c":"#2CB67D"},{"n":"Total Carbohydrates","v":"42 g","p":58,"c":"#4A90D9"},{"n":"Protein","v":"28 g","p":70,"c":"#2CB67D"},{"n":"Sodium","v":"480 mg","p":34,"c":"#C8BEA8"}]',
'[{"n":"Whole wheat sesame bun","src":"Stone-ground","c":"#2CB67D"},{"n":"Marinated chicken tikka","src":"Hormone-free","c":"#E05252"},{"n":"Mint chutney","src":"House-made","c":"#2CB67D"},{"n":"Fresh lettuce & onion","src":"Local farm","c":"#2CB67D"}]',
'[{"name":"Aarav S.","ini":"AS","bg":"#7B2CBF","date":"3 days ago","stars":5,"txt":"The tikka spice is just right. Absolutely love it!","v":true}]'),

('burgers','Peri Peri Chicken Burger','/images/peri_peri_chicken_burger.png','Fiery peri peri grilled chicken perfection.','₹279',4.7,92,
'["No Refined Oil","No MSG"]',460,30,40,17,4,
'[{"n":"Total Fat","v":"17 g","p":58,"c":"#2CB67D"},{"n":"Total Carbohydrates","v":"40 g","p":55,"c":"#4A90D9"},{"n":"Protein","v":"30 g","p":72,"c":"#2CB67D"},{"n":"Sodium","v":"500 mg","p":36,"c":"#C8BEA8"}]',
'[{"n":"Whole wheat bun","src":"Stone-ground","c":"#2CB67D"},{"n":"Peri peri chicken","src":"Hormone-free","c":"#E05252"},{"n":"Peri peri sauce","src":"Real chilli, no preservatives","c":"#E05252"},{"n":"Coleslaw","src":"House-made","c":"#2CB67D"}]',
'[{"name":"Priya M.","ini":"PM","bg":"#E05252","date":"2 days ago","stars":5,"txt":"Best peri peri in town. Spicy & juicy!","v":true}]'),

('burgers','Korean Chicken Burger','/images/korean_chicken_burger.png','Korean BBQ glazed chicken with kimchi slaw.','₹289',4.5,67,
'["No MSG","No Refined Oil"]',470,27,44,18,3,
'[{"n":"Total Fat","v":"18 g","p":60,"c":"#2CB67D"},{"n":"Total Carbohydrates","v":"44 g","p":60,"c":"#4A90D9"},{"n":"Protein","v":"27 g","p":68,"c":"#2CB67D"},{"n":"Sodium","v":"520 mg","p":38,"c":"#C8BEA8"}]',
'[{"n":"Sesame bun","src":"Stone-ground","c":"#2CB67D"},{"n":"Korean BBQ chicken","src":"Hormone-free","c":"#E05252"},{"n":"Gochujang glaze","src":"House-made","c":"#E05252"},{"n":"Kimchi slaw","src":"Fermented in-house","c":"#E09A2C"}]',
'[{"name":"Kiran J.","ini":"KJ","bg":"#4A90D9","date":"5 days ago","stars":5,"txt":"Korean flavours done right. Absolutely unique!","v":true}]'),

('burgers','Peri Peri Paneer Burger','/images/peri_peri_panner_burger.png','Vegetarian fire. Nothing fake.','₹249',4.5,72,
'["No Refined Oil","No MSG","No Maida","No Artificial Colour"]',428,22,40,18,5,
'[{"n":"Total Fat","v":"18 g","p":60,"c":"#2CB67D"},{"n":"Saturated fat","v":"8 g","p":35,"c":"#E09A2C","s":true},{"n":"Total Carbohydrates","v":"40 g","p":55,"c":"#4A90D9"},{"n":"Dietary fibre","v":"5 g","p":20,"c":"#4A90D9","s":true},{"n":"Protein","v":"22 g","p":65,"c":"#2CB67D"},{"n":"Sodium","v":"420 mg","p":30,"c":"#C8BEA8"}]',
'[{"n":"Whole wheat sesame bun","src":"Stone-ground","c":"#2CB67D"},{"n":"Grilled paneer slice","src":"Natural dairy","c":"#2CB67D"},{"n":"Peri peri paste","src":"Real chilli, no preservatives","c":"#E05252"},{"n":"Mint-coriander chutney","src":"House-made","c":"#2CB67D"}]',
'[{"name":"Lakshmi V.","ini":"LV","bg":"#7B2CBF","date":"4 days ago","stars":5,"txt":"Finally a veg burger that doesn''t taste like compromise.","v":true}]'),

('burgers','Soy Kheema Burger','/images/soy_kheema_burger.png','Plant-based soy kheema with bold spices.','₹239',4.3,58,
'["No Refined Oil","No MSG","No Maida"]',410,24,38,15,6,
'[{"n":"Total Fat","v":"15 g","p":52,"c":"#2CB67D"},{"n":"Total Carbohydrates","v":"38 g","p":52,"c":"#4A90D9"},{"n":"Dietary fibre","v":"6 g","p":24,"c":"#4A90D9","s":true},{"n":"Protein","v":"24 g","p":68,"c":"#2CB67D"},{"n":"Sodium","v":"440 mg","p":32,"c":"#C8BEA8"}]',
'[{"n":"Whole wheat bun","src":"Stone-ground","c":"#2CB67D"},{"n":"Soy kheema patty","src":"Plant-based","c":"#2CB67D"},{"n":"Masala onion","src":"Local farm","c":"#E09A2C"},{"n":"Coriander chutney","src":"House-made","c":"#2CB67D"}]',
'[{"name":"Rahul K.","ini":"RK","bg":"#2CB67D","date":"1 week ago","stars":4,"txt":"Surprisingly meaty texture for plant-based. Loved it!","v":true}]'),

-- SANDWICHES
('sandwiches','Chicken Club Sandwich','/images/chicken_club_sandwich.png','Classic club stacked with grilled chicken.','₹249',4.4,63,
'["No MSG","No Refined Oil"]',380,26,36,14,4,
'[{"n":"Total Fat","v":"14 g","p":50,"c":"#2CB67D"},{"n":"Total Carbohydrates","v":"36 g","p":50,"c":"#4A90D9"},{"n":"Protein","v":"26 g","p":68,"c":"#2CB67D"},{"n":"Sodium","v":"460 mg","p":33,"c":"#C8BEA8"}]',
'[{"n":"Whole wheat bread","src":"Stone-ground","c":"#2CB67D"},{"n":"Grilled chicken","src":"Hormone-free","c":"#E05252"},{"n":"Lettuce & tomato","src":"Fresh daily","c":"#2CB67D"},{"n":"House mayo","src":"Vegan, no preservatives","c":"#E09A2C"}]',
'[{"name":"Meena T.","ini":"MT","bg":"#7B2CBF","date":"4 days ago","stars":4,"txt":"Fresh and filling. Perfect lunch option.","v":true}]'),

('sandwiches','Bulgogi Chicken Sandwich','/images/bulgogi_chicken_sandwich.png','Korean bulgogi marinated chicken grilled fresh.','₹269',4.6,74,
'["No MSG","No Refined Oil"]',400,28,38,15,3,
'[{"n":"Total Fat","v":"15 g","p":52,"c":"#2CB67D"},{"n":"Total Carbohydrates","v":"38 g","p":52,"c":"#4A90D9"},{"n":"Protein","v":"28 g","p":70,"c":"#2CB67D"},{"n":"Sodium","v":"490 mg","p":35,"c":"#C8BEA8"}]',
'[{"n":"Whole wheat bread","src":"Stone-ground","c":"#2CB67D"},{"n":"Bulgogi chicken","src":"Hormone-free, Korean-marinated","c":"#E05252"},{"n":"Sesame slaw","src":"House-made","c":"#E09A2C"},{"n":"Gochujang aioli","src":"House-made","c":"#E05252"}]',
'[{"name":"Ji Yeon L.","ini":"JL","bg":"#E09A2C","date":"3 days ago","stars":5,"txt":"Authentic bulgogi flavour in a sandwich!","v":true}]'),

('sandwiches','Tex Mex Chicken Crunch','/images/tex_mex_sandwich.png','Tex-Mex spiced chicken with crunch.','₹259',4.5,69,
'["No MSG","No Refined Oil"]',420,25,42,16,4,
'[{"n":"Total Fat","v":"16 g","p":55,"c":"#2CB67D"},{"n":"Total Carbohydrates","v":"42 g","p":58,"c":"#4A90D9"},{"n":"Protein","v":"25 g","p":65,"c":"#2CB67D"},{"n":"Sodium","v":"510 mg","p":37,"c":"#C8BEA8"}]',
'[{"n":"Whole wheat bread","src":"Stone-ground","c":"#2CB67D"},{"n":"Tex-Mex chicken","src":"Hormone-free","c":"#E05252"},{"n":"Jalapeños & corn","src":"Local farm","c":"#E09A2C"},{"n":"Salsa & guacamole","src":"House-made","c":"#2CB67D"}]',
'[{"name":"Carlos P.","ini":"CP","bg":"#E05252","date":"5 days ago","stars":5,"txt":"Crunchy, spicy, and so satisfying!","v":true}]'),

('sandwiches','Chilli Garlic Paneer','/images/chilli_garlic_sandwich.png','Grilled paneer with chilli garlic spread.','₹229',4.3,55,
'["No MSG","No Refined Oil","No Maida"]',360,20,34,16,3,
'[{"n":"Total Fat","v":"16 g","p":55,"c":"#2CB67D"},{"n":"Total Carbohydrates","v":"34 g","p":48,"c":"#4A90D9"},{"n":"Protein","v":"20 g","p":60,"c":"#2CB67D"},{"n":"Sodium","v":"430 mg","p":31,"c":"#C8BEA8"}]',
'[{"n":"Whole wheat bread","src":"Stone-ground","c":"#2CB67D"},{"n":"Grilled paneer","src":"Natural dairy","c":"#2CB67D"},{"n":"Chilli garlic spread","src":"House-made","c":"#E05252"},{"n":"Bell peppers","src":"Local farm","c":"#E09A2C"}]',
'[{"name":"Sunita R.","ini":"SR","bg":"#2CB67D","date":"1 week ago","stars":4,"txt":"The chilli garlic spread is addictive!","v":true}]'),

('sandwiches','Caprese Rainbow Cheese Sandwich','/images/caprese_rainbow_cheese_sandwich.png','Fresh mozzarella, tomato & basil pesto.','₹239',4.4,61,
'["No MSG","No Refined Oil"]',340,18,32,15,3,
'[{"n":"Total Fat","v":"15 g","p":52,"c":"#2CB67D"},{"n":"Total Carbohydrates","v":"32 g","p":45,"c":"#4A90D9"},{"n":"Protein","v":"18 g","p":55,"c":"#2CB67D"},{"n":"Sodium","v":"410 mg","p":30,"c":"#C8BEA8"}]',
'[{"n":"Whole wheat bread","src":"Stone-ground","c":"#2CB67D"},{"n":"Fresh mozzarella","src":"Natural dairy","c":"#2CB67D"},{"n":"Heirloom tomatoes","src":"Fresh daily","c":"#E05252"},{"n":"Basil pesto","src":"House-made","c":"#2CB67D"}]',
'[{"name":"Nandini B.","ini":"NB","bg":"#4A90D9","date":"6 days ago","stars":4,"txt":"Light, fresh and very Italian! Love the pesto.","v":true}]'),

-- RICE BOWLS
('rice_bowls','Tex - Mex Chicken','/images/tex_mex_chicken_bowl.png','Spiced chicken over Mexican rice with salsa.','₹289',4.5,68,
'["No Refined Oil","No MSG"]',420,30,52,10,6,
'[{"n":"Total Fat","v":"10 g","p":36,"c":"#2CB67D"},{"n":"Total Carbohydrates","v":"52 g","p":62,"c":"#4A90D9"},{"n":"Dietary fibre","v":"6 g","p":24,"c":"#4A90D9","s":true},{"n":"Protein","v":"30 g","p":72,"c":"#2CB67D"},{"n":"Sodium","v":"480 mg","p":34,"c":"#C8BEA8"}]',
'[{"n":"Brown rice","src":"Whole grain","c":"#2CB67D"},{"n":"Tex-Mex chicken","src":"Hormone-free","c":"#E05252"},{"n":"Salsa fresca","src":"House-made","c":"#E05252"},{"n":"Corn & black beans","src":"Organic","c":"#E09A2C"}]',
'[{"name":"Vikram S.","ini":"VS","bg":"#E09A2C","date":"4 days ago","stars":5,"txt":"Amazing flavours! The salsa makes it special.","v":true}]'),

('rice_bowls','Veg - Tex - Mex Paneer','/images/veg_tex_mex_panner_bowl.png','Paneer in Tex-Mex style over seasoned rice.','₹259',4.3,54,
'["No Refined Oil","No MSG","No Maida"]',390,22,54,11,6,
'[{"n":"Total Fat","v":"11 g","p":40,"c":"#2CB67D"},{"n":"Total Carbohydrates","v":"54 g","p":64,"c":"#4A90D9"},{"n":"Dietary fibre","v":"6 g","p":24,"c":"#4A90D9","s":true},{"n":"Protein","v":"22 g","p":64,"c":"#2CB67D"},{"n":"Sodium","v":"440 mg","p":32,"c":"#C8BEA8"}]',
'[{"n":"Brown rice","src":"Whole grain","c":"#2CB67D"},{"n":"Grilled paneer","src":"Natural dairy","c":"#2CB67D"},{"n":"Tex-Mex spice blend","src":"Natural only","c":"#E09A2C"},{"n":"Corn & jalapeños","src":"Local farm","c":"#E09A2C"}]',
'[{"name":"Divya R.","ini":"DR","bg":"#7B2CBF","date":"3 days ago","stars":4,"txt":"Great vegetarian option! Really filling.","v":true}]'),

('rice_bowls','South Indian Rice Bowl Paneer','/images/south_indian_panner_rice_bowl.png','Coastal spiced paneer with south Indian rice.','₹259',4.4,60,
'["No Refined Oil","No MSG"]',400,20,58,12,5,
'[{"n":"Total Fat","v":"12 g","p":44,"c":"#2CB67D"},{"n":"Total Carbohydrates","v":"58 g","p":68,"c":"#4A90D9"},{"n":"Dietary fibre","v":"5 g","p":22,"c":"#4A90D9","s":true},{"n":"Protein","v":"20 g","p":60,"c":"#2CB67D"},{"n":"Sodium","v":"460 mg","p":33,"c":"#C8BEA8"}]',
'[{"n":"Steamed rice","src":"Whole grain","c":"#2CB67D"},{"n":"Spiced paneer","src":"Natural dairy","c":"#2CB67D"},{"n":"Coconut chutney","src":"House-made","c":"#E09A2C"},{"n":"Curry leaves & mustard","src":"Fresh daily","c":"#2CB67D"}]',
'[{"name":"Anjali K.","ini":"AK","bg":"#4A90D9","date":"5 days ago","stars":4,"txt":"Feels like a home-cooked South Indian meal!","v":true}]'),

('rice_bowls','Basil Pesto Chicken','/images/basil_pesto_chicken_bowl.png','Grilled chicken over rice with basil pesto.','₹279',4.5,65,
'["No Refined Oil","No MSG"]',410,32,48,12,4,
'[{"n":"Total Fat","v":"12 g","p":44,"c":"#2CB67D"},{"n":"Total Carbohydrates","v":"48 g","p":58,"c":"#4A90D9"},{"n":"Protein","v":"32 g","p":74,"c":"#2CB67D"},{"n":"Sodium","v":"430 mg","p":31,"c":"#C8BEA8"}]',
'[{"n":"Brown rice","src":"Whole grain","c":"#2CB67D"},{"n":"Grilled chicken","src":"Hormone-free","c":"#E05252"},{"n":"Basil pesto","src":"House-made","c":"#2CB67D"},{"n":"Cherry tomatoes","src":"Fresh daily","c":"#E05252"}]',
'[{"name":"Aryan P.","ini":"AP","bg":"#2CB67D","date":"2 days ago","stars":5,"txt":"The pesto is so fresh. Perfect combo with chicken!","v":true}]'),

('rice_bowls','Basil Pesto Paneer','/images/basil_pesto_panner_bowl.png','Creamy paneer with aromatic basil pesto rice.','₹259',4.3,52,
'["No Refined Oil","No MSG","No Maida"]',390,20,50,14,4,
'[{"n":"Total Fat","v":"14 g","p":50,"c":"#2CB67D"},{"n":"Total Carbohydrates","v":"50 g","p":60,"c":"#4A90D9"},{"n":"Protein","v":"20 g","p":60,"c":"#2CB67D"},{"n":"Sodium","v":"410 mg","p":30,"c":"#C8BEA8"}]',
'[{"n":"Brown rice","src":"Whole grain","c":"#2CB67D"},{"n":"Grilled paneer","src":"Natural dairy","c":"#2CB67D"},{"n":"Basil pesto","src":"House-made","c":"#2CB67D"},{"n":"Pine nuts","src":"Cold-pressed","c":"#E09A2C"}]',
'[{"name":"Preethi N.","ini":"PN","bg":"#7B2CBF","date":"1 week ago","stars":4,"txt":"Love the pesto flavour. Very fresh ingredients!","v":true}]'),

('rice_bowls','Veg Pesto Paneer','/images/veg_pesto_panner_bowl.png','Garden veggies & paneer in house pesto sauce.','₹249',4.4,58,
'["No Refined Oil","No MSG","No Maida"]',370,18,48,13,5,
'[{"n":"Total Fat","v":"13 g","p":48,"c":"#2CB67D"},{"n":"Total Carbohydrates","v":"48 g","p":58,"c":"#4A90D9"},{"n":"Dietary fibre","v":"5 g","p":22,"c":"#4A90D9","s":true},{"n":"Protein","v":"18 g","p":55,"c":"#2CB67D"},{"n":"Sodium","v":"380 mg","p":28,"c":"#C8BEA8"}]',
'[{"n":"Brown rice","src":"Whole grain","c":"#2CB67D"},{"n":"Paneer cubes","src":"Natural dairy","c":"#2CB67D"},{"n":"Seasonal veggies","src":"Local farm","c":"#2CB67D"},{"n":"Pesto sauce","src":"House-made","c":"#2CB67D"}]',
'[{"name":"Shreya M.","ini":"SM","bg":"#E09A2C","date":"6 days ago","stars":4,"txt":"Fresh and wholesome. Great everyday bowl!","v":true}]'),

-- HEALTHY BOWLS
('healthy_bowls','Mixed Fruit Bowl','/images/mixed_fruit_healthy_bowl.png','Seasonal fresh fruits with honey drizzle.','₹199',4.6,80,
'["No Refined Oil","No Artificial Colour"]',210,4,46,3,6,
'[{"n":"Total Fat","v":"3 g","p":14,"c":"#2CB67D"},{"n":"Total Carbohydrates","v":"46 g","p":58,"c":"#4A90D9"},{"n":"Dietary fibre","v":"6 g","p":24,"c":"#4A90D9","s":true},{"n":"Natural sugars","v":"32 g","p":40,"c":"#4A90D9","s":true},{"n":"Protein","v":"4 g","p":20,"c":"#2CB67D"},{"n":"Sodium","v":"20 mg","p":3,"c":"#C8BEA8"}]',
'[{"n":"Seasonal mixed fruits","src":"Fresh daily","c":"#E05252"},{"n":"Raw honey drizzle","src":"Unfiltered","c":"#E09A2C"},{"n":"Mint leaves","src":"Garden fresh","c":"#2CB67D"},{"n":"Lemon zest","src":"Fresh daily","c":"#E09A2C"}]',
'[{"name":"Rhea S.","ini":"RS","bg":"#E05252","date":"2 days ago","stars":5,"txt":"So refreshing and colourful. Guilt-free indulgence!","v":true}]'),

('healthy_bowls','Basil Pesto Chicken Bowl','/images/basil_pesto_chicken_healthy_bowl.png','Protein-packed chicken in fresh basil pesto.','₹279',4.5,71,
'["No Refined Oil","No MSG"]',350,34,22,14,4,
'[{"n":"Total Fat","v":"14 g","p":50,"c":"#2CB67D"},{"n":"Total Carbohydrates","v":"22 g","p":32,"c":"#4A90D9"},{"n":"Dietary fibre","v":"4 g","p":18,"c":"#4A90D9","s":true},{"n":"Protein","v":"34 g","p":78,"c":"#2CB67D"},{"n":"Sodium","v":"390 mg","p":28,"c":"#C8BEA8"}]',
'[{"n":"Grilled chicken breast","src":"Hormone-free","c":"#E05252"},{"n":"Basil pesto","src":"House-made","c":"#2CB67D"},{"n":"Roasted veggies","src":"Local farm","c":"#2CB67D"},{"n":"Pine nuts","src":"Cold-pressed","c":"#E09A2C"}]',
'[{"name":"Rohan V.","ini":"RV","bg":"#7B2CBF","date":"3 days ago","stars":5,"txt":"High protein and delicious. My post-workout go-to!","v":true}]'),

('healthy_bowls','Classic Nacho Bowl','/images/classic_nacho_healthy_bowl.png','Multigrain nachos with wholesome toppings.','₹229',4.4,65,
'["No MSG","No Artificial Colour"]',320,12,44,13,5,
'[{"n":"Total Fat","v":"13 g","p":48,"c":"#2CB67D"},{"n":"Total Carbohydrates","v":"44 g","p":58,"c":"#4A90D9"},{"n":"Dietary fibre","v":"5 g","p":22,"c":"#4A90D9","s":true},{"n":"Protein","v":"12 g","p":44,"c":"#2CB67D"},{"n":"Sodium","v":"360 mg","p":26,"c":"#C8BEA8"}]',
'[{"n":"Multigrain nachos","src":"Baked, no refined oil","c":"#E09A2C"},{"n":"Salsa fresca","src":"House-made","c":"#E05252"},{"n":"Guacamole","src":"Fresh daily","c":"#2CB67D"},{"n":"Sour cream","src":"Natural dairy","c":"#2CB67D"}]',
'[{"name":"Tanmay K.","ini":"TK","bg":"#4A90D9","date":"4 days ago","stars":4,"txt":"Crunchy and fresh. Great snack bowl!","v":true}]'),

('healthy_bowls','Grilled Chicken Bowl','/images/grilled_chicken_healthy_bowl.png','Clean grilled chicken with seasonal greens.','₹269',4.6,88,
'["No Refined Oil","No MSG"]',300,36,18,10,4,
'[{"n":"Total Fat","v":"10 g","p":36,"c":"#2CB67D"},{"n":"Total Carbohydrates","v":"18 g","p":28,"c":"#4A90D9"},{"n":"Dietary fibre","v":"4 g","p":18,"c":"#4A90D9","s":true},{"n":"Protein","v":"36 g","p":80,"c":"#2CB67D"},{"n":"Sodium","v":"350 mg","p":25,"c":"#C8BEA8"}]',
'[{"n":"Grilled chicken breast","src":"Hormone-free","c":"#E05252"},{"n":"Seasonal greens","src":"Local farm","c":"#2CB67D"},{"n":"Lemon herb drizzle","src":"House-made","c":"#E09A2C"},{"n":"Quinoa","src":"Organic","c":"#2CB67D"}]',
'[{"name":"Aditi N.","ini":"AN","bg":"#2CB67D","date":"1 day ago","stars":5,"txt":"Clean eating made delicious. Perfect fitness meal!","v":true}]'),

('healthy_bowls','Korean Chicken Bowl','/images/korean_chicken_healthy_bowl.png','Korean BBQ chicken with steamed greens.','₹279',4.5,76,
'["No MSG","No Refined Oil"]',340,32,26,12,4,
'[{"n":"Total Fat","v":"12 g","p":44,"c":"#2CB67D"},{"n":"Total Carbohydrates","v":"26 g","p":38,"c":"#4A90D9"},{"n":"Protein","v":"32 g","p":74,"c":"#2CB67D"},{"n":"Sodium","v":"480 mg","p":34,"c":"#C8BEA8"}]',
'[{"n":"Korean BBQ chicken","src":"Hormone-free","c":"#E05252"},{"n":"Steamed broccoli & bok choy","src":"Fresh daily","c":"#2CB67D"},{"n":"Gochujang drizzle","src":"House-made","c":"#E05252"},{"n":"Sesame seeds","src":"Natural","c":"#E09A2C"}]',
'[{"name":"Sanya T.","ini":"ST","bg":"#E09A2C","date":"3 days ago","stars":5,"txt":"Healthy and bursting with Korean flavour!","v":true}]'),

('healthy_bowls','Chicken Rainbow Bowl','/images/chicken_rainbow_healthy_bowl.png','Colourful veggies & chicken for every nutrient.','₹289',4.7,94,
'["No Refined Oil","No MSG"]',330,30,28,11,6,
'[{"n":"Total Fat","v":"11 g","p":40,"c":"#2CB67D"},{"n":"Total Carbohydrates","v":"28 g","p":40,"c":"#4A90D9"},{"n":"Dietary fibre","v":"6 g","p":24,"c":"#4A90D9","s":true},{"n":"Protein","v":"30 g","p":72,"c":"#2CB67D"},{"n":"Sodium","v":"360 mg","p":26,"c":"#C8BEA8"}]',
'[{"n":"Grilled chicken","src":"Hormone-free","c":"#E05252"},{"n":"Rainbow veggies","src":"Local farm","c":"#E09A2C"},{"n":"Edamame","src":"Organic","c":"#2CB67D"},{"n":"Tahini dressing","src":"House-made","c":"#E09A2C"}]',
'[{"name":"Pallavi D.","ini":"PD","bg":"#E05252","date":"2 days ago","stars":5,"txt":"So beautiful and nutritious! My favourite bowl.","v":true}]'),

('healthy_bowls','Peri Peri Chicken Bowl','/images/peri_peri_chicken_healthy_bowl.png','Fiery peri peri chicken over wellness greens.','₹269',4.5,79,
'["No Refined Oil","No MSG"]',320,34,20,12,4,
'[{"n":"Total Fat","v":"12 g","p":44,"c":"#2CB67D"},{"n":"Total Carbohydrates","v":"20 g","p":30,"c":"#4A90D9"},{"n":"Protein","v":"34 g","p":78,"c":"#2CB67D"},{"n":"Sodium","v":"440 mg","p":32,"c":"#C8BEA8"}]',
'[{"n":"Peri peri chicken","src":"Hormone-free","c":"#E05252"},{"n":"Mixed greens","src":"Local farm","c":"#2CB67D"},{"n":"Peri peri drizzle","src":"House-made","c":"#E05252"},{"n":"Avocado slices","src":"Fresh daily","c":"#2CB67D"}]',
'[{"name":"Harsh M.","ini":"HM","bg":"#7B2CBF","date":"5 days ago","stars":5,"txt":"Spicy and healthy together. Best combo!","v":true}]'),

-- SAUCES
('sauces','Basil Pesto','/images/basil_pesto_sause.png','Classic Italian basil pesto, house-made daily.','₹89',4.6,45,
'["No Refined Oil","No MSG","No Artificial Colour"]',120,3,4,11,1,
'[{"n":"Total Fat","v":"11 g","p":40,"c":"#2CB67D"},{"n":"Total Carbohydrates","v":"4 g","p":12,"c":"#4A90D9"},{"n":"Protein","v":"3 g","p":18,"c":"#2CB67D"},{"n":"Sodium","v":"180 mg","p":14,"c":"#C8BEA8"}]',
'[{"n":"Fresh basil","src":"Garden fresh","c":"#2CB67D"},{"n":"Cold-pressed olive oil","src":"Extra virgin","c":"#E09A2C"},{"n":"Pine nuts","src":"Natural","c":"#E09A2C"},{"n":"Parmesan","src":"Natural dairy","c":"#2CB67D"}]',
'[{"name":"Priya V.","ini":"PV","bg":"#2CB67D","date":"4 days ago","stars":5,"txt":"Best pesto I have had outside Italy!","v":true}]'),

('sauces','Spicy Sriracha Labneh','/images/spicy_siracha_labneh_sause.png','Creamy labneh with a sriracha kick.','₹89',4.4,38,
'["No MSG","No Artificial Colour"]',90,4,5,7,0,
'[{"n":"Total Fat","v":"7 g","p":28,"c":"#2CB67D"},{"n":"Total Carbohydrates","v":"5 g","p":14,"c":"#4A90D9"},{"n":"Protein","v":"4 g","p":20,"c":"#2CB67D"},{"n":"Sodium","v":"210 mg","p":16,"c":"#C8BEA8"}]',
'[{"n":"Labneh (strained yogurt)","src":"Local dairy","c":"#2CB67D"},{"n":"Sriracha","src":"No preservatives","c":"#E05252"},{"n":"Lemon juice","src":"Fresh squeezed","c":"#E09A2C"},{"n":"Herbs","src":"Garden fresh","c":"#2CB67D"}]',
'[{"name":"Ajay M.","ini":"AM","bg":"#E05252","date":"6 days ago","stars":4,"txt":"Perfect spice level. Great dip!","v":true}]'),

('sauces','Tandoori Mayonnaise','/images/tandoori_mayonnaise_sause.png','Smoky tandoori spiced vegan mayo.','₹89',4.5,42,
'["No MSG","No Refined Oil"]',100,1,3,9,0,
'[{"n":"Total Fat","v":"9 g","p":34,"c":"#2CB67D"},{"n":"Total Carbohydrates","v":"3 g","p":10,"c":"#4A90D9"},{"n":"Protein","v":"1 g","p":8,"c":"#2CB67D"},{"n":"Sodium","v":"190 mg","p":14,"c":"#C8BEA8"}]',
'[{"n":"Vegan mayo base","src":"Egg-free","c":"#2CB67D"},{"n":"Tandoori spice blend","src":"Natural only","c":"#E09A2C"},{"n":"Lemon juice","src":"Fresh","c":"#E09A2C"},{"n":"Smoked paprika","src":"Natural","c":"#E05252"}]',
'[{"name":"Rekha J.","ini":"RJ","bg":"#E09A2C","date":"5 days ago","stars":5,"txt":"Unique flavour! Goes well with everything.","v":true}]'),

('sauces','Beet & Red Pepper Labneh','/images/beet&red_pepper_labneh_sause.png','Vibrant beet & roasted pepper labneh dip.','₹89',4.3,35,
'["No MSG","No Artificial Colour"]',80,3,7,5,2,
'[{"n":"Total Fat","v":"5 g","p":20,"c":"#2CB67D"},{"n":"Total Carbohydrates","v":"7 g","p":16,"c":"#4A90D9"},{"n":"Protein","v":"3 g","p":18,"c":"#2CB67D"},{"n":"Sodium","v":"170 mg","p":12,"c":"#C8BEA8"}]',
'[{"n":"Labneh","src":"Local dairy","c":"#2CB67D"},{"n":"Roasted beetroot","src":"Organic","c":"#E05252"},{"n":"Red bell pepper","src":"Local farm","c":"#E05252"},{"n":"Herbs & lemon","src":"Fresh","c":"#2CB67D"}]',
'[{"name":"Neha K.","ini":"NK","bg":"#E05252","date":"1 week ago","stars":4,"txt":"Beautiful colour and great taste!","v":true}]'),

('sauces','Vegan Eggless Mayo','/images/vegan_eggless_mayo.png','Creamy plant-based mayo, zero compromise.','₹79',4.4,40,
'["No MSG","No Artificial Colour","No Refined Oil"]',90,0,2,9,0,
'[{"n":"Total Fat","v":"9 g","p":34,"c":"#2CB67D"},{"n":"Total Carbohydrates","v":"2 g","p":8,"c":"#4A90D9"},{"n":"Protein","v":"0 g","p":2,"c":"#2CB67D"},{"n":"Sodium","v":"140 mg","p":10,"c":"#C8BEA8"}]',
'[{"n":"Aquafaba (chickpea water)","src":"Organic","c":"#2CB67D"},{"n":"Cold-pressed sunflower oil","src":"Unrefined","c":"#E09A2C"},{"n":"Lemon juice","src":"Fresh","c":"#E09A2C"},{"n":"Dijon mustard","src":"No preservatives","c":"#E09A2C"}]',
'[{"name":"Sneha P.","ini":"SP","bg":"#4A90D9","date":"3 days ago","stars":4,"txt":"Can''t tell it''s vegan. Excellent texture!","v":true}]'),

('sauces','Guacamole','/images/guacamole_sause.png','Fresh avocado guacamole made to order.','₹99',4.7,52,
'["No MSG","No Refined Oil","No Artificial Colour"]',110,1,6,10,4,
'[{"n":"Total Fat","v":"10 g","p":36,"c":"#2CB67D"},{"n":"Total Carbohydrates","v":"6 g","p":14,"c":"#4A90D9"},{"n":"Dietary fibre","v":"4 g","p":18,"c":"#4A90D9","s":true},{"n":"Protein","v":"1 g","p":8,"c":"#2CB67D"},{"n":"Sodium","v":"120 mg","p":9,"c":"#C8BEA8"}]',
'[{"n":"Ripe avocado","src":"Fresh daily","c":"#2CB67D"},{"n":"Lime juice","src":"Fresh squeezed","c":"#E09A2C"},{"n":"Red onion","src":"Local farm","c":"#2CB67D"},{"n":"Coriander & jalapeño","src":"Fresh","c":"#E05252"}]',
'[{"name":"Meera V.","ini":"MV","bg":"#2CB67D","date":"2 days ago","stars":5,"txt":"The freshest guac I''ve tasted!","v":true}]'),

('sauces','Salsa','/images/salsa_sause.png','Chunky tomato salsa with fresh herbs.','₹79',4.5,44,
'["No MSG","No Refined Oil","No Artificial Colour"]',40,1,8,0,2,
'[{"n":"Total Fat","v":"0 g","p":2,"c":"#2CB67D"},{"n":"Total Carbohydrates","v":"8 g","p":16,"c":"#4A90D9"},{"n":"Dietary fibre","v":"2 g","p":10,"c":"#4A90D9","s":true},{"n":"Protein","v":"1 g","p":6,"c":"#2CB67D"},{"n":"Sodium","v":"200 mg","p":15,"c":"#C8BEA8"}]',
'[{"n":"Fresh tomatoes","src":"Local farm","c":"#E05252"},{"n":"Red onion","src":"Local farm","c":"#2CB67D"},{"n":"Jalapeño","src":"Fresh","c":"#E05252"},{"n":"Coriander & lime","src":"Fresh daily","c":"#2CB67D"}]',
'[{"name":"Ravi S.","ini":"RS","bg":"#E05252","date":"4 days ago","stars":5,"txt":"Fresh and punchy. Perfect with nachos!","v":true}]'),

('sauces','Mint Coriander Labneh','/images/mint_coriander_labneh_sause.png','Cooling mint & fresh coriander labneh dip.','₹89',4.4,37,
'["No MSG","No Artificial Colour"]',85,4,5,6,1,
'[{"n":"Total Fat","v":"6 g","p":24,"c":"#2CB67D"},{"n":"Total Carbohydrates","v":"5 g","p":12,"c":"#4A90D9"},{"n":"Protein","v":"4 g","p":20,"c":"#2CB67D"},{"n":"Sodium","v":"160 mg","p":12,"c":"#C8BEA8"}]',
'[{"n":"Labneh","src":"Local dairy","c":"#2CB67D"},{"n":"Fresh mint","src":"Garden fresh","c":"#2CB67D"},{"n":"Coriander","src":"Fresh daily","c":"#2CB67D"},{"n":"Lemon & cumin","src":"Natural","c":"#E09A2C"}]',
'[{"name":"Ananya R.","ini":"AR","bg":"#7B2CBF","date":"5 days ago","stars":4,"txt":"Refreshing and herby. Perfect with wraps!","v":true}]'),

-- WRAPS
('wraps','Peri Peri Paneer Wrap','/images/peri_peri_panner_wrap.png','Spiced paneer in whole wheat with peri sauce.','₹229',4.4,61,
'["No Refined Oil","No MSG","No Maida"]',340,18,38,13,4,
'[{"n":"Total Fat","v":"13 g","p":48,"c":"#2CB67D"},{"n":"Total Carbohydrates","v":"38 g","p":52,"c":"#4A90D9"},{"n":"Protein","v":"18 g","p":55,"c":"#2CB67D"},{"n":"Sodium","v":"400 mg","p":29,"c":"#C8BEA8"}]',
'[{"n":"Whole wheat roti","src":"Stone-ground","c":"#2CB67D"},{"n":"Peri peri paneer","src":"Natural dairy","c":"#2CB67D"},{"n":"Peri peri sauce","src":"House-made","c":"#E05252"},{"n":"Shredded lettuce","src":"Fresh daily","c":"#2CB67D"}]',
'[{"name":"Isha T.","ini":"IT","bg":"#E05252","date":"3 days ago","stars":4,"txt":"Love the peri kick in a wrap. Very filling!","v":true}]'),

('wraps','Korean Chicken Wrap','/images/korean_chicken_wrap.png','Korean BBQ chicken rolled in whole wheat.','₹249',4.6,73,
'["No Refined Oil","No MSG"]',360,26,36,13,3,
'[{"n":"Total Fat","v":"13 g","p":48,"c":"#2CB67D"},{"n":"Total Carbohydrates","v":"36 g","p":50,"c":"#4A90D9"},{"n":"Protein","v":"26 g","p":68,"c":"#2CB67D"},{"n":"Sodium","v":"460 mg","p":33,"c":"#C8BEA8"}]',
'[{"n":"Whole wheat roti","src":"Stone-ground","c":"#2CB67D"},{"n":"Korean BBQ chicken","src":"Hormone-free","c":"#E05252"},{"n":"Kimchi","src":"Fermented in-house","c":"#E09A2C"},{"n":"Sesame gochujang","src":"House-made","c":"#E05252"}]',
'[{"name":"Yuna K.","ini":"YK","bg":"#4A90D9","date":"2 days ago","stars":5,"txt":"Korean flavours in a wrap format. Genius!","v":true}]'),

('wraps','Soy Kheema Wrap','/images/soy_kheema_wrap.png','Spiced soy kheema in crispy whole wheat.','₹219',4.3,55,
'["No Refined Oil","No MSG","No Maida"]',330,22,34,12,5,
'[{"n":"Total Fat","v":"12 g","p":44,"c":"#2CB67D"},{"n":"Total Carbohydrates","v":"34 g","p":48,"c":"#4A90D9"},{"n":"Dietary fibre","v":"5 g","p":22,"c":"#4A90D9","s":true},{"n":"Protein","v":"22 g","p":64,"c":"#2CB67D"},{"n":"Sodium","v":"390 mg","p":28,"c":"#C8BEA8"}]',
'[{"n":"Whole wheat roti","src":"Stone-ground","c":"#2CB67D"},{"n":"Soy kheema","src":"Plant-based","c":"#2CB67D"},{"n":"Onion & coriander","src":"Fresh","c":"#2CB67D"},{"n":"Mint chutney","src":"House-made","c":"#2CB67D"}]',
'[{"name":"Kapil D.","ini":"KD","bg":"#2CB67D","date":"1 week ago","stars":4,"txt":"Great plant-based wrap. Very satisfying!","v":true}]'),

('wraps','Peri Peri Chicken Wrap','/images/peri_peri_chicken_wrap.png','Fiery peri chicken wrapped with fresh veggies.','₹239',4.5,68,
'["No Refined Oil","No MSG"]',350,28,34,13,3,
'[{"n":"Total Fat","v":"13 g","p":48,"c":"#2CB67D"},{"n":"Total Carbohydrates","v":"34 g","p":48,"c":"#4A90D9"},{"n":"Protein","v":"28 g","p":70,"c":"#2CB67D"},{"n":"Sodium","v":"440 mg","p":32,"c":"#C8BEA8"}]',
'[{"n":"Whole wheat roti","src":"Stone-ground","c":"#2CB67D"},{"n":"Peri peri chicken","src":"Hormone-free","c":"#E05252"},{"n":"Peri sauce","src":"House-made","c":"#E05252"},{"n":"Coleslaw","src":"House-made","c":"#2CB67D"}]',
'[{"name":"Dhruv P.","ini":"DP","bg":"#E09A2C","date":"4 days ago","stars":5,"txt":"So spicy and juicy! Perfect wrap.","v":true}]'),

('wraps','Chicken Tikka Wrap','/images/chicken_tikka_wrap.png','Tandoori chicken tikka in whole wheat wrap.','₹239',4.4,64,
'["No Refined Oil","No MSG"]',355,27,35,14,3,
'[{"n":"Total Fat","v":"14 g","p":50,"c":"#2CB67D"},{"n":"Total Carbohydrates","v":"35 g","p":50,"c":"#4A90D9"},{"n":"Protein","v":"27 g","p":68,"c":"#2CB67D"},{"n":"Sodium","v":"420 mg","p":30,"c":"#C8BEA8"}]',
'[{"n":"Whole wheat roti","src":"Stone-ground","c":"#2CB67D"},{"n":"Chicken tikka","src":"Hormone-free, tandoor-cooked","c":"#E05252"},{"n":"Mint chutney","src":"House-made","c":"#2CB67D"},{"n":"Pickled onion","src":"House-made","c":"#E09A2C"}]',
'[{"name":"Rahul B.","ini":"RB","bg":"#7B2CBF","date":"5 days ago","stars":4,"txt":"Classic tikka wrap done perfectly!","v":true}]'),

-- OVERNIGHT OATS
('overnight_oats','Mixed Fruit Coconut Oats Jar','/images/mixed_fruits_coconut_oats_jar.png','Coconut milk oats with seasonal fruit topping.','₹189',4.6,72,
'["No Refined Oil","No Artificial Colour"]',310,9,52,8,6,
'[{"n":"Total Fat","v":"8 g","p":30,"c":"#2CB67D"},{"n":"Total Carbohydrates","v":"52 g","p":62,"c":"#4A90D9"},{"n":"Dietary fibre","v":"6 g","p":24,"c":"#4A90D9","s":true},{"n":"Natural sugars","v":"18 g","p":25,"c":"#4A90D9","s":true},{"n":"Protein","v":"9 g","p":35,"c":"#2CB67D"},{"n":"Sodium","v":"60 mg","p":5,"c":"#C8BEA8"}]',
'[{"n":"Rolled oats","src":"Whole grain","c":"#2CB67D"},{"n":"Coconut milk","src":"Natural, no additives","c":"#E09A2C"},{"n":"Seasonal fruits","src":"Fresh daily","c":"#E05252"},{"n":"Raw honey","src":"Unfiltered","c":"#E09A2C"}]',
'[{"name":"Kavya S.","ini":"KS","bg":"#E09A2C","date":"2 days ago","stars":5,"txt":"Perfect breakfast prep. Creamy and fruity!","v":true}]'),

('overnight_oats','Chocolate Peanut Butter Oat Jar','/images/chocolate_peanut_butter_oats_jar.png','Rich choco peanut butter oats for morning fuel.','₹199',4.7,88,
'["No Refined Oil","No Artificial Colour"]',360,12,48,14,6,
'[{"n":"Total Fat","v":"14 g","p":50,"c":"#2CB67D"},{"n":"Total Carbohydrates","v":"48 g","p":58,"c":"#4A90D9"},{"n":"Dietary fibre","v":"6 g","p":24,"c":"#4A90D9","s":true},{"n":"Natural sugars","v":"16 g","p":22,"c":"#4A90D9","s":true},{"n":"Protein","v":"12 g","p":44,"c":"#2CB67D"},{"n":"Sodium","v":"80 mg","p":6,"c":"#C8BEA8"}]',
'[{"n":"Rolled oats","src":"Whole grain","c":"#2CB67D"},{"n":"Natural peanut butter","src":"No added sugar","c":"#E09A2C"},{"n":"Raw cacao powder","src":"Unprocessed","c":"#E09A2C"},{"n":"Coconut sugar","src":"Unrefined","c":"#E09A2C"}]',
'[{"name":"Abhishek T.","ini":"AT","bg":"#7B2CBF","date":"1 day ago","stars":5,"txt":"Tastes like dessert but it''s healthy!","v":true}]'),

('overnight_oats','Berry Nuts Oats Jar','/images/berry_nuts_oats_jar.png','Antioxidant berries & crunchy nuts on oats.','₹199',4.5,65,
'["No Refined Oil","No Artificial Colour"]',330,10,50,11,7,
'[{"n":"Total Fat","v":"11 g","p":40,"c":"#2CB67D"},{"n":"Total Carbohydrates","v":"50 g","p":60,"c":"#4A90D9"},{"n":"Dietary fibre","v":"7 g","p":28,"c":"#4A90D9","s":true},{"n":"Natural sugars","v":"14 g","p":20,"c":"#4A90D9","s":true},{"n":"Protein","v":"10 g","p":38,"c":"#2CB67D"},{"n":"Sodium","v":"50 mg","p":4,"c":"#C8BEA8"}]',
'[{"n":"Rolled oats","src":"Whole grain","c":"#2CB67D"},{"n":"Mixed berries","src":"Fresh & dried, no added sugar","c":"#E05252"},{"n":"Mixed nuts","src":"Raw, unsalted","c":"#E09A2C"},{"n":"Almond milk","src":"Unsweetened","c":"#2CB67D"}]',
'[{"name":"Shruti L.","ini":"SL","bg":"#E05252","date":"3 days ago","stars":5,"txt":"Loaded with berries and nuts. The best jar!","v":true}]'),

-- BEVERAGES
('beverages','Watermelon','/images/watermelon_beverages.png','Fresh watermelon cooler, zero added sugar.','₹129',4.7,95,
'["No Refined Oil","No Artificial Colour","No MSG"]',80,1,18,0,1,
'[{"n":"Total Fat","v":"0 g","p":2,"c":"#2CB67D"},{"n":"Total Carbohydrates","v":"18 g","p":28,"c":"#4A90D9"},{"n":"Natural sugars","v":"14 g","p":20,"c":"#4A90D9","s":true},{"n":"Protein","v":"1 g","p":6,"c":"#2CB67D"},{"n":"Sodium","v":"10 mg","p":1,"c":"#C8BEA8"}]',
'[{"n":"Fresh watermelon","src":"Seasonal & local","c":"#E05252"},{"n":"Mint leaves","src":"Garden fresh","c":"#2CB67D"},{"n":"Lime juice","src":"Fresh squeezed","c":"#E09A2C"},{"n":"Himalayan pink salt","src":"Trace","c":"#C8BEA8"}]',
'[{"name":"Divya K.","ini":"DK","bg":"#E05252","date":"1 day ago","stars":5,"txt":"So refreshing! Pure watermelon goodness.","v":true}]'),

('beverages','Masala Butter Milk','/images/masala_butter_milk_beverages.png','Spiced buttermilk with digestive herbs.','₹99',4.6,82,
'["No Refined Oil","No Artificial Colour","No MSG"]',90,4,8,3,0,
'[{"n":"Total Fat","v":"3 g","p":14,"c":"#2CB67D"},{"n":"Total Carbohydrates","v":"8 g","p":16,"c":"#4A90D9"},{"n":"Protein","v":"4 g","p":20,"c":"#2CB67D"},{"n":"Sodium","v":"240 mg","p":18,"c":"#C8BEA8"}]',
'[{"n":"Natural buttermilk","src":"Local dairy","c":"#2CB67D"},{"n":"Roasted cumin","src":"Hand-ground","c":"#E09A2C"},{"n":"Fresh coriander","src":"Garden fresh","c":"#2CB67D"},{"n":"Ginger & green chilli","src":"Fresh","c":"#E05252"}]',
'[{"name":"Girish N.","ini":"GN","bg":"#4A90D9","date":"2 days ago","stars":5,"txt":"Best masala chaas! Great for digestion.","v":true}]'),

('beverages','Orange','/images/orange_beverages.png','Freshly squeezed orange juice, no sugar added.','₹119',4.5,71,
'["No Refined Oil","No Artificial Colour","No MSG"]',100,2,23,0,0,
'[{"n":"Total Fat","v":"0 g","p":2,"c":"#2CB67D"},{"n":"Total Carbohydrates","v":"23 g","p":34,"c":"#4A90D9"},{"n":"Natural sugars","v":"19 g","p":26,"c":"#4A90D9","s":true},{"n":"Protein","v":"2 g","p":10,"c":"#2CB67D"},{"n":"Sodium","v":"5 mg","p":1,"c":"#C8BEA8"}]',
'[{"n":"Fresh oranges","src":"Seasonal variety","c":"#E09A2C"},{"n":"Lime juice","src":"Fresh squeezed","c":"#E09A2C"},{"n":"Mint","src":"Garden fresh","c":"#2CB67D"}]',
'[{"name":"Tanya R.","ini":"TR","bg":"#E09A2C","date":"3 days ago","stars":5,"txt":"Pure OJ, no tricks. Exactly what I needed.","v":true}]');
