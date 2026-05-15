"use client";

import { useState } from "react";
import MenuCard from "./MenuCard";

type Item = {
  dish: string;
  price: string;
  image: string;
};

type Props = {
  menu: Item[];
};

export default function MenuEditor({ menu }: Props) {

  const [items, setItems] = useState(menu);

  const [editDish, setEditDish] = useState(false);
  const [editPrice, setEditPrice] = useState(false);

  const updateDish = (index: number, value: string) => {
    const copy = [...items];
    copy[index].dish = value;
    setItems(copy);
  };

  const updatePrice = (index: number, value: string) => {
    const copy = [...items];
    copy[index].price = value;
    setItems(copy);
  };

  const proceed = () => {
    console.log("FINAL MENU", items);
    alert("Menu finalized!");
  };

  return (
    <div className="relative z-10 max-w-7xl mx-auto mt-10 text-foreground transition-colors duration-300">

      {/* TOP NAV BUTTONS */}
      <div className="flex justify-center gap-6 mb-10">

        <button
          onClick={() => setEditDish(!editDish)}
          className={`px-5 py-2 border rounded-lg transition font-medium ${
            editDish 
              ? "bg-primary text-white border-primary" 
              : "border-border bg-card text-foreground hover:bg-muted"
          }`}
        >
          {editDish ? "Finish Editing Names" : "Edit Dish Names"}
        </button>

        <button
          onClick={() => setEditPrice(!editPrice)}
          className={`px-5 py-2 border rounded-lg transition font-medium ${
            editPrice 
              ? "bg-primary text-white border-primary" 
              : "border-border bg-card text-foreground hover:bg-muted"
          }`}
        >
          {editPrice ? "Finish Editing Prices" : "Edit Prices"}
        </button>

      </div>


      {/* MENU GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">

        {items.map((item, i) => (

          <MenuCard
            key={i}
            index={i}
            item={item}
            editDish={editDish}
            editPrice={editPrice}
            updateDish={updateDish}
            updatePrice={updatePrice}
          />

        ))}

      </div>


      {/* PROCEED BUTTON */}
      <div className="flex justify-center mt-14">

        <button
          onClick={proceed}
          className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-10 py-3 rounded-xl shadow hover:opacity-90 transition"
        >
          Proceed
        </button>

      </div>

    </div>
  );
}