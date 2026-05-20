const fs = require('fs');

const categories = [
  "Appetizers", "Soups", "Salads", "Beef Dishes", "Chicken Dishes", 
  "Pork Dishes", "Seafood", "Vegetarian", "Noodles", "Rice Dishes", 
  "Signature Platters", "Side Dishes", "Desserts", "Hot Beverages", "Cold Beverages"
];

const adjectives = ["Crispy", "Spicy", "Sweet", "Savory", "Smoked", "Grilled", "Fried", "Steamed", "Braised", "Roasted", "Fresh", "Zesty", "Tangy", "Creamy", "Rich"];
const nouns = ["Delight", "Surprise", "Special", "Supreme", "Classic", "Feast", "Bowl", "Platter", "Bites", "Mix", "Fusion", "Medley", "Treat", "Magic", "Secret"];

let csv = "category,name,description,price,available,options\n";

let itemCount = 0;
for (const cat of categories) {
  // Generate 20-40 items per category
  const numItems = Math.floor(Math.random() * 21) + 20; 
  for (let i = 0; i < numItems; i++) {
    const name = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${cat.split(' ')[0]} ${nouns[Math.floor(Math.random() * nouns.length)]} ${i + 1}`;
    const desc = `Delicious and authentic ${cat.toLowerCase()} prepared with the finest ingredients.`;
    const price = (Math.floor(Math.random() * 20) + 5) * 10000; // 50k to 250k
    const available = Math.random() > 0.1 ? 'true' : 'false'; // 90% available
    
    let optionsStr = "";
    if (Math.random() > 0.5) {
      if (cat.includes("Beverages")) {
        optionsStr = "Size (Required): Regular (+0), Large (+15000) | Ice: Normal (+0), Less Ice (+0), No Ice (+0) | Sugar: 100% (+0), 50% (+0), 0% (+0)";
      } else if (cat.includes("Dishes") || cat === "Noodles" || cat === "Seafood") {
        optionsStr = "Portion (Required): Regular (+0), Large (+35000) | Add-ons: Extra Meat (+25000), Extra Veggies (+15000), Fried Egg (+10000)";
      } else if (cat === "Appetizers" || cat === "Side Dishes") {
         optionsStr = "Dipping Sauce: Chili Sauce (+0), Garlic Mayo (+5000), Sweet & Sour (+0)";
      }
    }
    
    csv += `"${cat}","${name}","${desc}",${price},${available},"${optionsStr}"\n`;
    itemCount++;
  }
}

fs.writeFileSync('menu_stress_test.csv', csv);
console.log(`Generated menu_stress_test.csv with ${itemCount} items.`);
