type Item = {
  dish: string;
  price: string;
  image: string;
};

type Props = {
  index: number;
  item: Item;
  editDish: boolean;
  editPrice: boolean;
  updateDish: (index: number, value: string) => void;
  updatePrice: (index: number, value: string) => void;
};

export default function MenuCard({
  index,
  item,
  editDish,
  editPrice,
  updateDish,
  updatePrice
}: Props) {

  return (
    <div className="bg-card rounded-xl shadow-sm p-4 border border-border transition-colors duration-300">

      {/* IMAGE */}
      <img
        src={`http://127.0.0.1:8000/${item.image}`}
        alt={item.dish}
        className="w-full h-40 object-cover rounded-lg mb-4"
      />

      {/* DISH NAME */}
      {editDish ? (

        <input
          value={item.dish}
          onChange={(e) => updateDish(index, e.target.value)}
          className="w-full bg-muted/30 border border-border text-foreground rounded-md px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />

      ) : (

        <div className="border border-border bg-muted/50 text-foreground rounded-md px-3 py-2 mb-2 text-center font-medium">
          {item.dish}
        </div>

      )}

      {/* PRICE */}
      {editPrice ? (

        <input
          value={item.price}
          onChange={(e) => updatePrice(index, e.target.value)}
          className="w-full bg-muted/30 border border-border text-foreground rounded-md px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-primary"
        />

      ) : (

        <div className="border border-border bg-muted/50 text-foreground rounded-md px-3 py-2 text-center font-bold">
          {item.price}
        </div>

      )}

    </div>
  );
}